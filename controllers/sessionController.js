const db = require("../model/db");

// Helper to convert ISO string to MySQL datetime format
function formatToMySQLDatetime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function getSessions(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT sessions.*, tasks.name AS task_name 
       FROM sessions 
       JOIN tasks ON sessions.task_id = tasks.task_id
       ORDER BY sessions.start_time DESC`
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
    console.log("Incoming request:", req.body);

    if (!task_id || !start_time || !status) {
      return res
        .status(400)
        .json({ message: "task_id, start_time, and status are required." });
    }

    const formattedStart = formatToMySQLDatetime(start_time);
    const formattedEnd = end_time ? formatToMySQLDatetime(end_time) : null;

    const [result] = await db.query(
      "INSERT INTO sessions (task_id, start_time, end_time, status) VALUES (?, ?, ?, ?)",
      [task_id, formattedStart, formattedEnd, status]
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
