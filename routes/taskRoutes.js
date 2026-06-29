const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

// This still works because you are exporting an object of function
router.get("/", taskController.getTasks);
router.post("/", taskController.createTasks);
router.patch("/:id/toggle", taskController.toggleTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
