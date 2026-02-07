const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const budgetRoutes = require("./routes/budgetRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend running");
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/budgets", budgetRoutes);


module.exports = app;
