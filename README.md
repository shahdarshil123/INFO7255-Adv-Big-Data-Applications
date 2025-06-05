# Node.js REST API with Redis and JSON Schema Validation

This project is a RESTful API built with Node.js and Express that supports:

- CRUD operations (Create, Read, Delete)
- JSON Schema validation using AJV
- ETag-based conditional GET support
- Redis-based key-value storage (using Redis Stack or Redis core)
- Modular, clean project structure

---

## 📁 Project Structure
```
app/
├── app.js # Entry point
├── controllers/
│ └── controller.js # Contains request handlers
├── routes/
│ └── routes.js # Route definitions for the API
├── services/
│ └── redis.js # Redis client wrapper
├── models/
│ └── schema.json # JSON Schema definition for validation
├── utils/
│ └── validator.js # JSON Schema validation using AJV
└── README.md
```
---

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd app

```
##  Install Dependencies
npm install express redis ajv uuid etag

## Packages:

Package	    Purpose
express	    Web framework
redis	    Redis client for Node.js
ajv	        JSON Schema validation
uuid	    For generating unique object IDs
etag	    For conditional GET (ETag support)

##  Redis Setup Using Docker
```
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

## Run the Server
```
node app.js
```

## API Endpoints
**POST** /v1/plan
Adds a new plan object

Validates against schema.json

**GET** /v1/plan/:id
Fetches the plan with the given objectId

Supports conditional reads with If-None-Match header (ETag)

**DELETE** /v1/plan/:id
Deletes the plan from Redis store