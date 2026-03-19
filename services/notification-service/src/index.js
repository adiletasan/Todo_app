require('dotenv').config();
const express = require('express');
const { startConsumers } = require('./consumers/notification.consumer');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());
app.use(metricsMiddleware);
app.get('/metrics', metricsEndpoint);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

startConsumers();

app.listen(PORT, () => console.log(`notification-service running on port ${PORT}`));