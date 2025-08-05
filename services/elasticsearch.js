// require('dotenv').config({ path: 'C:/Users/darsh/Desktop/Adv big data/app/.env' });
// require('dotenv').config({ path: '../.env' });
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


const indexName = 'indexplan';

const indexSettings = {
    mappings: {
        properties: {
            objectId: { type: 'keyword' },
            objectType: { type: 'keyword' },
            _org: { type: 'keyword' },
            planType: { type: 'keyword' },
            creationDate: {
                type: 'date',
                format: 'dd-MM-yyyy||strict_date_optional_time||epoch_millis'
            },
            plan_join: {
                type: 'join',
                relations: {
                    plan: ['planCostShares', 'linkedPlanServices'],
                    linkedPlanServices: ['linkedService', 'planserviceCostShares']
                }
            }
        }
    }
};


async function createPlanIndex() {
    try {
        const exists = await client.indices.exists({ index: indexName });
        if (exists) {
            console.log(`Index "${indexName}" already exists.`);
            return;
        }
        else {
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

// createIndex();
module.exports = { client, createPlanIndex };
