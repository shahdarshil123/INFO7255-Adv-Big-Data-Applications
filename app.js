const express = require('express');
const app = express();
const planRoutes = require('./routes/routes');

// Middleware to parse JSON bodies
app.use(express.json());
app.use('/v1/plan', planRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));