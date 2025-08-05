const redis = require("../services/redis");
const validatePlan = require("../utils/validator");
const mergeLinkedPlanServices = require('../utils/mergeLinkedPlanServices');
const { v4: uuidv4 } = require('uuid');
const etag = require('etag'); // npm install etag
const { client } = require('../services/elasticsearch');

var resourceEtag;

exports.createPlan = async (req, res) => {
    const plan = req.body;
    const id = plan.objectId || uuidv4();
    const index = 'plans';

    // console.log("Plan: ", plan);
    // console.log("Plan Id: ", id);

    const { valid, errors } = validatePlan(plan);
    if (!valid) return res.status(400).json({ errors });

    try {
        // const id = req.body.objectId || uuidv4();
        await redis.set(id, plan);
        const planId = id;

        if (plan.planCostShares) {
            await client.index({
                index: 'indexplan',
                id: plan.planCostShares.objectId,
                routing: planId,
                document: {
                    ...plan.planCostShares,
                    plan_join: {
                        name: 'planCostShares',
                        parent: planId
                    }
                }
            });
        }

        for(const service of plan.linkedPlanServices){
            const serviceId = service.objectId;
            const linkedService = service['linkedService'];
            const planserviceCostShares = service['planserviceCostShares'];

            //console.log(service);

            await client.index({
                index: 'indexplan',
                id: linkedService.objectId,
                routing: planId,
                document: {
                    ...linkedService,
                    plan_join: {
                        name: 'linkedService',
                        parent: serviceId
                    }
                }
            });

            await client.index({
                index: 'indexplan',
                id: planserviceCostShares.objectId,
                routing: planId,
                document: {
                    ...planserviceCostShares,
                    plan_join: {
                        name: 'planserviceCostShares',
                        parent: serviceId
                    }
                }
            });

            await client.index({
                index: 'indexplan',
                id: planserviceCostShares.objectId,
                routing: planId,
                document: {
                    ...planserviceCostShares,
                    plan_join: {
                        name: 'planserviceCostShares',
                        parent: serviceId
                    }
                }
            });

            const doc = {
                _org: service._org,
                objectId: serviceId,
                objectType: service.objectType
            };

            await client.index({
                index: 'indexplan',
                id: serviceId,
                routing: planId,
                document: {
                    doc,
                    plan_join: {
                        name: 'linkedPlanServices',
                        parent: planId
                    }
                }
            });
        }

        const plan_doc = {
            _org: plan._org,
            objectId: plan.objectId,
            objectType: plan.objectType,
            planType: plan.planType,
            creationDate: plan.creationDate
        };


        await client.index({
                index: 'indexplan',
                id: planId,
                routing: planId,
                document: {
                    plan_doc,
                    plan_join: {
                        name: 'plan'
                    }
                }
            });

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