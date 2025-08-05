// require('dotenv').config({ path: '../.env' });
const amqp = require('amqplib');
const { client } = require('./elasticsearch'); // <- assuming this is your ES client
const queueName = 'plan_index_queue';

async function startConsumer() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        await channel.assertQueue(queueName);

        const queueStatus = await channel.checkQueue(queueName);

        if (queueStatus.messageCount === 0) {
            console.log(`Queue "${queueName}" is empty.`);
            await channel.close();
            await connection.close();
            return;
        }

        console.log(`Queue "${queueName}" has ${queueStatus.messageCount} messages. Starting consumer...`);

        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                try {
                    const plan = JSON.parse(msg.content.toString());
                    const planId = plan.objectId;

                    // 1. Index planCostShares
                    if (plan.planCostShares) {
                        await client.index({
                            index: 'indexplan',
                            id: plan.planCostShares.objectId,
                            routing: planId,
                            document: {
                                ...plan.planCostShares,
                                plan_join: {
                                    name: 'planCostShares',
                                    parent: planId
                                }
                            }
                        });
                    }

                    //2. Index each linkedPlanService
                    for (const service of plan.linkedPlanServices || []) {
                        const serviceId = service.objectId;
                        const linkedService = service.linkedService;
                        const planserviceCostShares = service.planserviceCostShares;

                        // linkedService
                        if (linkedService) {
                            await client.index({
                                index: 'indexplan',
                                id: linkedService.objectId,
                                routing: planId,
                                document: {
                                    ...linkedService,
                                    plan_join: {
                                        name: 'linkedService',
                                        parent: serviceId
                                    }
                                }
                            });
                        }

                        // planserviceCostShares
                        if (planserviceCostShares) {
                            await client.index({
                                index: 'indexplan',
                                id: planserviceCostShares.objectId,
                                routing: planId,
                                document: {
                                    ...planserviceCostShares,
                                    plan_join: {
                                        name: 'planserviceCostShares',
                                        parent: serviceId
                                    }
                                }
                            });
                        }

                        // linkedPlanService itself
                        await client.index({
                            index: 'indexplan',
                            id: serviceId,
                            routing: planId,
                            document: {
                                _org: service._org,
                                objectId: serviceId,
                                objectType: service.objectType,
                                plan_join: {
                                    name: 'linkedPlanServices',
                                    parent: planId
                                }
                            }
                        });
                    }

                    // ✅ 3. Index the top-level plan
                    await client.index({
                        index: 'indexplan',
                        id: planId,
                        routing: planId,
                        document: {
                            _org: plan._org,
                            objectId: plan.objectId,
                            objectType: plan.objectType,
                            planType: plan.planType,
                            creationDate: plan.creationDate,
                            plan_join: 'plan'
                        }
                    });

                    console.log(`Indexed plan and children for planId: ${planId}`);
                    channel.ack(msg);

                } catch (err) {
                    console.error('Error processing message:', err);
                    channel.nack(msg, false, false);
                }
            }
        });
    } catch (err) {
        console.error('Failed to check/consume RabbitMQ queue:', err);
    }
}

module.exports = {startConsumer};
