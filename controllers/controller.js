const redis = require("../services/redis");
const validatePlan = require("../utils/validator");
const { v4: uuidv4 } = require('uuid');

exports.createPlan = async (req, res) => {
    const { valid, errors } = validatePlan(req.body);
    if (!valid) return res.status(400).json({ errors });

    const id = req.body.objectId || uuidv4();
    await redis.set(id, req.body);
    res.status(201).json({ message: "Plan created", id });
};

const etag = require('etag'); // npm install etag

exports.getPlan = async (req, res) => {
    const data = await redis.get(req.params.id);
    if (!data) return res.status(404).json({ error: "Not found" });

    const resourceEtag = etag(JSON.stringify(data));

    // Check for If-None-Match
    if (req.headers["if-none-match"] === resourceEtag) {
        return res.status(304).end();
    }

    res.setHeader("ETag", resourceEtag);
    res.status(200).json(data);
};

exports.deletePlan = async (req, res) => {
    await redis.delete(req.params.id);
    res.status(204).end();
};
