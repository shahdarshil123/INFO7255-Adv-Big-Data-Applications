const express = require("express");
const router = express.Router();
const controller = require("../controllers/controller");

router.post("/", controller.createPlan);
router.get("/:id", controller.getPlan);
router.delete("/:id", controller.deletePlan);
router.patch('/:id', controller.patchPlan);

module.exports = router;
