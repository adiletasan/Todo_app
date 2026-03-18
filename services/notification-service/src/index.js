require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());
app.get("/health", (req, res) => res.json({ status: "ok", service: "notification-service" }));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`notification-service running on port ${PORT}`));
