const db = require("../model/db");

async function getTasks(req, res) {
  try {
    const userId = req.user.user_id;
    const [rows] = await db.query(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY task_id DESC",
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function createTasks(req, res) {
  try {
    const { name, description, duration } = req.body;
    const userId = req.user.user_id;

    if (!name || duration === undefined) {
      return res
        .status(400)
        .json({ message: "Task name and duration are required." });
    }

    if (typeof name !== "string" || name.trim().length === 0 || name.length > 30) {
      return res
        .status(400)
        .json({ message: "Task name must be a non-empty string under 30 characters." });
    }

    if (description && (typeof description !== "string" || description.length > 100)) {
      return res
        .status(400)
        .json({ message: "Task description must be a string under 100 characters." });
    }

    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      return res
        .status(400)
        .json({ message: "Duration must be a positive numeric integer value." });
    }

    const [result] = await db.query(
      "INSERT INTO tasks (name, description, duration, user_id) VALUES (?, ?, ?, ?)",
      [name.trim(), description ? description.trim() : null, parsedDuration, userId]
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function toggleTask(req, res) {
  try {
    const taskId = req.params.id;
    const userId = req.user.user_id;

    // Check task ownership
    const [tasks] = await db.query(
      "SELECT is_completed FROM tasks WHERE task_id = ? AND user_id = ?",
      [taskId, userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found or access denied." });
    }

    const currentStatus = tasks[0].is_completed;
    const newStatus = currentStatus === 1 ? 0 : 1;

    await db.query(
      "UPDATE tasks SET is_completed = ? WHERE task_id = ? AND user_id = ?",
      [newStatus, taskId, userId]
    );

    res.json({ is_completed: newStatus });
  } catch (error) {
    console.error("Error in toggleTask:", error);
    res.status(500).json({ message: "Server error during task toggle." });
  }
}

async function deleteTask(req, res) {
  try {
    const taskId = req.params.id;
    const userId = req.user.user_id;

    // Check task ownership
    const [tasks] = await db.query(
      "SELECT task_id FROM tasks WHERE task_id = ? AND user_id = ?",
      [taskId, userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found or access denied." });
    }

    // Delete linked sessions first to prevent foreign key constraint failures on legacy databases
    await db.query(
      "DELETE FROM sessions WHERE task_id = ?",
      [taskId]
    );

    // Delete the task itself
    await db.query(
      "DELETE FROM tasks WHERE task_id = ? AND user_id = ?",
      [taskId, userId]
    );

    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Error in deleteTask:", error);
    res.status(500).json({ message: "Server error during task deletion." });
  }
}

module.exports = {
  getTasks,
  createTasks,
  toggleTask,
  deleteTask,
};
