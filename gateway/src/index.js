require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const jwtMiddleware = require("./middleware/jwt");
const rateLimitMiddleware = require("./middleware/rateLimit");
const logger = require("./middleware/logger");

const app = express();
app.use(logger);
app.use(rateLimitMiddleware);

app.use("/api/auth",  createProxyMiddleware({ target: process.env.AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/api/users", jwtMiddleware, createProxyMiddleware({ target: process.env.USER_SERVICE_URL, changeOrigin: true }));
app.use("/api/tasks", jwtMiddleware, createProxyMiddleware({ target: process.env.TASK_SERVICE_URL, changeOrigin: true }));

app.get("/health", (req, res) => res.json({ status: "ok", service: "gateway" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));
