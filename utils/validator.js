const Ajv = require("ajv");
const planSchema = require("../models/schema.json");

const ajv = new Ajv();
const validate = ajv.compile(planSchema);

module.exports = function validatePlan(data) {
    const valid = validate(data);
    return { valid, errors: validate.errors };
};
