const db = require("../model/db");

async function createTable() {
  try {
    // Create tasks table with duration
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        task_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(30) NOT NULL,
        description VARCHAR(100),
        duration INT NOT NULL
      )
    `);

    // Create sessions table (unchanged)
    await db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        task_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        status VARCHAR(50) NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(task_id)
      )
    `);

    console.log("Tables created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error.message);
    process.exit(1);
  }
}

module.exports = createTable;
