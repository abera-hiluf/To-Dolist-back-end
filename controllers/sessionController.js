const db = require("../model/db");

// Helper to convert ISO string to MySQL datetime format
function formatToMySQLDatetime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function getSessions(req, res) {
  try {
    const userId = req.user.user_id;
    const [rows] = await db.query(
      `SELECT sessions.*, tasks.name AS task_name 
       FROM sessions 
       JOIN tasks ON sessions.task_id = tasks.task_id
       WHERE tasks.user_id = ?
       ORDER BY sessions.start_time DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function createSessions(req, res) {
  try {
    const { task_id, start_time, end_time, status } = req.body;
    const userId = req.user.user_id;
    console.log("Incoming request:", req.body);

    if (!task_id || !start_time || !status) {
      return res
        .status(400)
        .json({ message: "task_id, start_time, and status are required." });
    }

    const parsedTaskId = parseInt(task_id, 10);
    if (isNaN(parsedTaskId) || parsedTaskId <= 0) {
      return res
        .status(400)
        .json({ message: "task_id must be a positive integer." });
    }

    // Verify task ownership
    const [taskCheck] = await db.query(
      "SELECT user_id FROM tasks WHERE task_id = ?",
      [parsedTaskId]
    );

    if (taskCheck.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (taskCheck[0].user_id !== userId) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not own this task." });
    }

    if (status !== "completed" && status !== "incomplete") {
      return res
        .status(400)
        .json({ message: "Status must be either 'completed' or 'incomplete'." });
    }

    let formattedStart, formattedEnd;
    try {
      formattedStart = formatToMySQLDatetime(start_time);
      formattedEnd = end_time ? formatToMySQLDatetime(end_time) : null;
    } catch (dateErr) {
      return res
        .status(400)
        .json({ message: "Invalid ISO date string format provided for start_time/end_time." });
    }

    const [result] = await db.query(
      "INSERT INTO sessions (task_id, start_time, end_time, status) VALUES (?, ?, ?, ?)",
      [parsedTaskId, formattedStart, formattedEnd, status]
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("Error in createSessions:", error);
    if (error.sqlMessage) console.error("SQL Error Message:", error.sqlMessage);
    if (error.code) console.error("SQL Error Code:", error.code);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getSessions,
  createSessions,
};
