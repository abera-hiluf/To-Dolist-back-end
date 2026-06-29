const mysql = require('mysql2');
const db = require('./model/db');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const taskRoutes = require('./routes/taskRoutes')
const sessionRoutes = require('./routes/sessionRoutes')
const authRoutes = require('./routes/authRoutes')
const authMiddleware = require('./middleware/authMiddleware')
const createTable = require("./migrate/createTable");


const app = express();
const port = 3000;

//connection
app.get('/', (req, res) => {
    res.send('welcome to the time tracker api');
})


// middlewares
app.use(cors());
app.use(bodyParser.json());

//routing
app.use("/api/auth", authRoutes);
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/sessions", authMiddleware, sessionRoutes);

async function start() {
  try {
    // Test database connection
    const result = await db.execute("SELECT 'test'");
    // Create tables if not exist
    await createTable();
    console.log("Database connection successful");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
}

start();
  

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});