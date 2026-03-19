require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const userRoutes = require('./routes/user.routes');
const { startConsumer } = require('./consumers/user.consumer');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);
app.get('/metrics', metricsEndpoint);
app.use('/users', userRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Запустить consumer
startConsumer();

app.listen(PORT, () => console.log(`user-service running on port ${PORT}`));