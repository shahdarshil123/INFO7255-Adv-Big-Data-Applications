require('dotenv').config({ path: '.env' });
const express = require('express');
const app = express();
const planRoutes = require('./routes/routes');
const {client, createPlanIndex} = require('./services/elasticsearch.js');
const { connectRabbitMQ } = require('./services/rabbitmq');

// Middleware to parse JSON bodies
app.use(express.json());
app.use('/v1/plan', planRoutes);

(async () => {
    await createPlanIndex(); // Create index if not exists
    await connectRabbitMQ();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();