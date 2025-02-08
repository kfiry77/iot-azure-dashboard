const express = require('express');
const app = express();
const CosmosClient = require('@azure/cosmos').CosmosClient;

app.set('view engine', 'ejs');
app.use(express.static('public', { 'extensions': ['html', 'css'] }));

const config = {
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
  databaseId: process.env.COSMOS_DB_ID,
  containerId: process.env.COSMOS_CONTAINER_ID,
};

console.log(config)

const client = new CosmosClient({
  endpoint: config.endpoint,
  key: config.key,
});

app.get('/', async (req, res) => {
    const container = client.database(config.databaseId).container(config.containerId);
    const query = 'SELECT * FROM c ORDER BY c._ts DESC'; 
    const { resources } = await container.items.query(query).fetchAll();
    res.render('index', { data: resources });
  });

app.get('/health', async (req, res) => {
  try {
    const container = client.database(config.databaseId).container(config.containerId);
    
    // Query for the latest report
    const latestQuery = 'SELECT TOP 1 * FROM c ORDER BY c._ts DESC';
    const { resources: latestResources } = await container.items.query(latestQuery).fetchAll();
    const latestReport = latestResources[0];
    console.log(latestReport);
    if (!latestReport) {
      return res.status(500).json({ status: 'fail', message: 'No reports found' });
    }

    // Parse the Body field to get the download_speed, upload_speed, and ping_latency
    const latestReportBody = JSON.parse(latestReport.Body);
    const latestDownloadSpeed = latestReportBody.download_speed;
    const latestUploadSpeed = latestReportBody.upload_speed;
    const latestPingLatency = latestReportBody.ping_latency;

    // Check if the latest report is within the last hour
    const oneHourAgo = Date.now() - 3600000;
    if (new Date(latestReport._ts * 1000) < oneHourAgo) {
      return res.status(500).json({ status: 'fail', message: 'No report from the last hour' });
    }

    // Query for the reports from the last week
    const oneWeekAgo = Date.now() - 7 * 24 * 3600000;
    const weeklyQuery = `SELECT * FROM c WHERE c._ts >= ${Math.floor(oneWeekAgo / 1000)}`;
    const { resources: weeklyResources } = await container.items.query(weeklyQuery).fetchAll();

    if (weeklyResources.length === 0) {
      return res.status(500).json({ status: 'fail', message: 'No reports from the last week' });
    }

    // Calculate the average download_speed, upload_speed, and ping_latency from the last week
    const averageDownloadSpeed = weeklyResources.reduce((sum, report) => {
      const reportBody = JSON.parse(report.Body);
      return sum + reportBody.download_speed;
    }, 0) / weeklyResources.length;

    const averageUploadSpeed = weeklyResources.reduce((sum, report) => {
      const reportBody = JSON.parse(report.Body);
      return sum + reportBody.upload_speed;
    }, 0) / weeklyResources.length;

    const averagePingLatency = weeklyResources.reduce((sum, report) => {
      const reportBody = JSON.parse(report.Body);
      return sum + reportBody.ping_latency;
    }, 0) / weeklyResources.length;

    // Check if the latest report values are below 25% of the average values
    if (latestDownloadSpeed < 0.75 * averageDownloadSpeed ||
        latestUploadSpeed < 0.75 * averageUploadSpeed ||
        latestPingLatency > 1.25 * averagePingLatency) {
      return res.status(500).json({
         status: 'fail', 
         message: 'Latest report values are not within acceptable range',
         latestDownloadSpeed,
         latestUploadSpeed,
         latestPingLatency   
        });
    }

    res.json({
      status: 'ok',
      message: 'Health check passed',
      latestDownloadSpeed,
      latestUploadSpeed,
      latestPingLatency
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'fail', message: 'Health check failed', error: error.message });
  }
});

   
const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});