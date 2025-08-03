const db = require("../model/db");

async function getTasks(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM tasks ORDER BY task_id DESC");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function createTasks(req, res) {
  try {
    const { name, description, duration } = req.body;

    if (!name || !duration) {
      return res
        .status(400)
        .json({ message: "Task name and duration are required." });
    }

    const [result] = await db.query(
      "INSERT INTO tasks (name, description, duration) VALUES (?, ?, ?)",
      [name, description || null, duration]
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getTasks,
  createTasks,
};
