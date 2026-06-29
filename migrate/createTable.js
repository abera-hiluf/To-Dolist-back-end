const db = require("../model/db");

async function createTable() {
  try {
    // 1. Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create tasks table (with user_id for new setups)
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        task_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(30) NOT NULL,
        description VARCHAR(100),
        duration INT NOT NULL,
        is_completed TINYINT(1) DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // 3. For existing setups, check if user_id column exists in tasks, and add it if missing
    const [tasksCols] = await db.query("SHOW COLUMNS FROM tasks LIKE 'user_id'");
    if (tasksCols.length === 0) {
      console.log("Altering tasks table to add user_id column...");
      // Let's create a placeholder user so existing tasks can link to it, or make it nullable
      // To be safe and avoid foreign key failures, we will make it nullable or create a default user first.
      // Let's make user_id nullable first, or create a default user to link to.
      // Making it nullable is easiest and safest to prevent crashes, then we can link it.
      await db.query("ALTER TABLE tasks ADD COLUMN user_id INT NULL");
      await db.query("ALTER TABLE tasks ADD CONSTRAINT fk_tasks_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE");
    }

    const [tasksCompleteCols] = await db.query("SHOW COLUMNS FROM tasks LIKE 'is_completed'");
    if (tasksCompleteCols.length === 0) {
      console.log("Altering tasks table to add is_completed column...");
      await db.query("ALTER TABLE tasks ADD COLUMN is_completed TINYINT(1) DEFAULT 0");
    }

    // 4. Create sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        task_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        status VARCHAR(50) NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
      )
    `);

    console.log("Tables created/verified successfully.");
  } catch (error) {
    console.error("Error creating tables:", error.message);
    process.exit(1);
  }
}

module.exports = createTable;
