require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const taskRoutes = require('./routes/task.routes');
const { connect } = require('./services/rabbitmq.service');
const { startReminderJob } = require('./jobs/taskReminder.job');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/tasks', taskRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

connect();
startReminderJob();

app.listen(PORT, () => console.log(`task-service running on port ${PORT}`));