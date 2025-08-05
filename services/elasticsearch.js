// require('dotenv').config({ path: 'C:/Users/darsh/Desktop/Adv big data/app/.env' });
require('dotenv').config({ path: '../.env' });
const { Client } = require('@elastic/elasticsearch');

const ELASTIC_SEARCH_API_KEY_ID = process.env.ELASTIC_SEARCH_API_KEY_ID;
const ELASTIC_SEARCH_API_KEY = process.env.ELASTIC_SEARCH_API_KEY;


const client = new Client({
    node: 'http://localhost:9200',
    auth: {
        id: ELASTIC_SEARCH_API_KEY_ID,
        apiKey: ELASTIC_SEARCH_API_KEY
    }
});


const indexName = 'plans';

const indexSettings = {
    mappings: {
        properties: {
            objectId: { type: 'keyword' },
            objectType: { type: 'keyword' },
            planType: { type: 'text' },
            creationDate: { type: 'date' },
            planCostShares: {
                properties: {
                    copay: { type: 'integer' },
                    deductible: { type: 'integer' }
                }
            },
            linkedPlanServices: {
                type: 'nested',
                properties: {
                    objectId: { type: 'keyword' },
                    objectType: { type: 'keyword' },
                    linkedService: {
                        properties: {
                            name: { type: 'text' },
                            objectId: { type: 'keyword' }
                        }
                    },
                    planserviceCostShares: {
                        properties: {
                            copay: { type: 'integer' },
                            deductible: { type: 'integer' }
                        }
                    }
                }
            }
        }
    }
};

async function createIndex() {
    try {
        const exists = await client.indices.exists({ index: indexName });
        if (exists) {
            console.log(`Index "${indexName}" already exists.`);
            return;
        }
        else{
            const response = await client.indices.create({
            index: indexName,
            body: indexSettings
        });

        console.log(`Index "${indexName}" created successfully!`);
        }

    } catch (error) {
        console.error('Failed to create index:', error);
    }
}

createIndex();
