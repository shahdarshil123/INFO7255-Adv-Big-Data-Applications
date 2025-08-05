const redis = require("../services/redis");
const validatePlan = require("../utils/validator");
const mergeLinkedPlanServices = require('../utils/mergeLinkedPlanServices');
const { v4: uuidv4 } = require('uuid');
const etag = require('etag'); // npm install etag
const { client } = require('../services/elasticsearch');
const { publishToQueue } = require('../services/rabbitmq');
const {startConsumer} = require('../services/worker')
const amqp = require('amqplib');

var resourceEtag;

exports.createPlan = async (req, res) => {
    const plan = req.body;
    const id = plan.objectId || uuidv4();

    console.log("Plan: ", plan);
    console.log("Plan Id: ", id);

    const { valid, errors } = validatePlan(plan);
    if (!valid) return res.status(400).json({ errors });

    try {
        // const id = req.body.objectId || uuidv4();
        await redis.set(id, plan);
        const planId = id;

        try{
            // Publish to RabbitMQ
            await publishToQueue(plan);
        }
        catch(err){
            console.error('Error in createPlan:', err);
            res.status(500).json({ message: 'Server Error' });
        }

        try{
            // Consume from RabbitMQ
            await startConsumer();
        }
        catch(err){
            console.error('Error in dequeue:', err);
            res.status(500).json({ message: 'Server Error' });
        }


        resourceEtag = etag(JSON.stringify(plan));
        //await redis.setETag('etag', resourceEtag);

        res.setHeader("ETag", resourceEtag);
        res.status(201).json({ message: "Plan created", id });
    }
    catch (err) {
        console.error("Error in createPlan:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


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

exports.patchPlan = async (req, res) => {
    const id = req.params.id;
    const newData = req.body;

    try {
        // Validate the merged object
        const { valid, errors } = validatePlan(req.body);
        if (!valid) return res.status(400).json({ errors });

        const existing = await redis.get(id);
        if (!existing) {
            return res.status(404).json({ message: "Plan not found" });
        }

        // Deep merge only linkedPlanServices, replace everything else
        const merged = {
            ...newData,
            linkedPlanServices: mergeLinkedPlanServices(
                existing.linkedPlanServices || [],
                newData.linkedPlanServices || []
            )
        };

        // console.log("Merged object:", JSON.stringify(merged, null, 2));

        //const resourceEtag =  await redis.getETag('etag')

        if (req.headers["if-match"] !== resourceEtag) {
            return res.status(412).end();
        }

        await redis.set(id, merged);

        try{
            // Publish to RabbitMQ
            await publishToQueue(merged);
        }
        catch(err){
            console.error('Error in createPlan:', err);
            res.status(500).json({ message: 'Server Error' });
        }

        try{
            // Consume from RabbitMQ
            await startConsumer();
        }
        catch(err){
            console.error('Error in dequeue:', err);
            res.status(500).json({ message: 'Server Error' });
        }

        resourceEtag = etag(JSON.stringify(merged));
        res.setHeader("ETag", resourceEtag);
        res.status(200).json({
            message: "Plan updated successfully"
        });
    } catch (err) {
        console.error("Error in patchPlan:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};