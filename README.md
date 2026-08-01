# IoT Azure Dashboard

A Node.js web dashboard that displays internet speed test results collected from IoT devices via Azure IoT Hub and stored in Azure Cosmos DB.

---

## Architecture

```
IoT Device (speed test)
        │
        ▼
  Azure IoT Hub
        │  (message routing)
        ▼
 Azure Cosmos DB
        │
        ▼
  Express Server (this app)
        │
        ├── GET /        → HTML table of all speed test records
        └── GET /health  → JSON health check (compares latest vs. weekly average)
```

Each IoT message is stored in Cosmos DB with this structure:

| Field                                       | Description                          |
|---------------------------------------------|--------------------------------------|
| `_ts`                                       | Unix timestamp (added by Cosmos DB)  |
| `SystemProperties['iothub-connection-device-id']` | Device identifier from IoT Hub |
| `Body`                                      | JSON string: `{ download_speed, upload_speed, ping_latency }` |

---

## Prerequisites

- Node.js 18+
- An Azure Cosmos DB account with a database and container holding IoT Hub messages
- Azure IoT Hub configured to route messages to the Cosmos DB container

---

## Environment Variables

| Variable              | Description                        |
|-----------------------|------------------------------------|
| `COSMOS_ENDPOINT`     | Cosmos DB account URI              |
| `COSMOS_KEY`          | Cosmos DB primary key              |
| `COSMOS_DB_ID`        | Database name                      |
| `COSMOS_CONTAINER_ID` | Container name                     |

> **Security note:** Never commit these values to source control. Use a `.env` file locally (add it to `.gitignore`) or inject them via your deployment platform's secret management.

---

## Local Setup

```bash
# Install dependencies
npm install



# save to .env file: 
COSMOS_ENDPOINT= "https://<account>.documents.azure.com:443/"
COSMOS_KEY= "<your-key>"
COSMOS_DB_ID= "<database-name>"
COSMOS_CONTAINER_ID= "<container-name>"

# Set environment variables by loading the .env (CMD CLI)
FOR /F "tokens=*" %I IN ('type .env ^| findstr /v "^#"') DO SET %I

# Start the server
node server.js
```

The dashboard is available at `http://localhost:8080`.

---

## Endpoints

### `GET /`
Renders an HTML table with all speed test records ordered by most recent first.

### `GET /health`
Returns a JSON health status. Checks:
1. A report exists from within the last hour.
2. The latest values are within 25% of the past week's averages.

**Healthy response (HTTP 200):**
```json
{
  "status": "ok",
  "message": "Health check passed",
  "latestDownloadSpeed": 150.2,
  "latestUploadSpeed": 45.1,
  "latestPingLatency": 12.3
}
```

**Failing response (HTTP 500):**
```json
{
  "status": "fail",
  "message": "Latest report values are not within acceptable range",
  "latestDownloadSpeed": 20.1,
  "latestUploadSpeed": 5.0,
  "latestPingLatency": 200.0
}
```

---

## Known Issues & Areas for Improvement

| # | Issue | Severity |
|---|-------|----------|
| 1 | `console.log(config)` prints the Cosmos DB key to stdout | High |
| 2 | `GET /` has no error handling — a Cosmos failure returns no HTTP response | Medium |
| 3 | `azure-cosmos` dependency is a security placeholder package and should be removed | Medium |
| 4 | Bug in `views/index.ejs`: ping latency cell renders a stray `%>` as literal text | Low |
| 5 | No pagination — `SELECT * FROM c` fetches all records on every page load | Low |
| 6 | No `.env` / `dotenv` support for local development | Low |

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Templating:** EJS
- **Database:** Azure Cosmos DB (`@azure/cosmos` SDK)
