require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-service' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log($Name running on port 3002));

module.exports = app;
