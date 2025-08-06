const amqp = require('amqplib');

let channel;
// const queueName = 'plan_index_queue';
// const deleteQueue = 'plan_delete_queue';

async function connectRabbitMQ(queue) {
    const connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue(queue);
    console.log(`Connected to RabbitMQ and queue ${queue} ready`);
}

async function publishToQueue(data,queue) {
    if (!channel) throw new Error('RabbitMQ channel not initialized');
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
        persistent: true
    });
}

async function checkAndConsumeIfNotEmpty(queue = 'plan_index_queue') {
    try {
        const queueStatus = await channel.checkQueue(queue);

        if (queueStatus.messageCount === 0) {
            console.log(`Queue "${queue}" is empty. Nothing to consume.`);
            // await channel.close();
            // await connection.close();
            return;
        }

        console.log(`Queue "${queue}" has ${queueStatus.messageCount} messages. Starting consumer...`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                try {
                    const plan = JSON.parse(msg.content.toString());

                    //Place your custom consumer logic here
                    console.log('Consuming message:', plan);

                    // Example: pretend to process plan
                    // await processPlan(plan);

                    channel.ack(msg);
                } catch (err) {
                    console.error('Error processing message:', err);
                    channel.nack(msg, false, false); // discard if malformed
                }
            }
        });
    } catch (err) {
        console.error('Failed to check/consume RabbitMQ queue:', err);
    }
}

module.exports = { connectRabbitMQ, publishToQueue, checkAndConsumeIfNotEmpty };