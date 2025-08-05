const amqp = require('amqplib');

let channel;
const queueName = 'plan_index_queue';

async function connectRabbitMQ() {
    const connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    console.log('Connected to RabbitMQ and queue ready');
}

async function publishToQueue(data) {
    if (!channel) throw new Error('RabbitMQ channel not initialized');
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
        persistent: true
    });
}

async function checkAndConsumeIfNotEmpty(queueName = 'plan_index_queue') {
    try {
        const queueStatus = await channel.checkQueue(queueName);

        if (queueStatus.messageCount === 0) {
            console.log(`Queue "${queueName}" is empty. Nothing to consume.`);
            // await channel.close();
            // await connection.close();
            return;
        }

        console.log(`Queue "${queueName}" has ${queueStatus.messageCount} messages. Starting consumer...`);

        channel.consume(queueName, async (msg) => {
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