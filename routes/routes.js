const express = require("express");
const router = express.Router();
const controller = require("../controllers/controller");
const authenticateGoogle = require('../utils/auth');

router.post("/", authenticateGoogle, controller.createPlan);
router.get("/:id", authenticateGoogle,controller.getPlan);
router.delete("/:id", authenticateGoogle, controller.deletePlan);
router.patch('/:id', authenticateGoogle, controller.patchPlan);

module.exports = router;
