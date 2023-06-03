const express = require('express');
const app = express();
const path = require('path');
const CosmosClient = require('@azure/cosmos').CosmosClient;

app.set('view engine', 'ejs'); 
app.use(express.static('public', { 'extensions': ['html', 'css'] }));

const config = {
  endpoint: 'https://kfiry-cosmos.documents.azure.com:443',
  key: 'apPuEtn4do6LcTnjP0uWk93nCH1PiTQ4cC0m4mS48tmeWWglX99wTfaF91BdR2yO2UfhNm11xOKMACDbJlTvCA==',
  databaseId: 'IotHub',
  containerId: 'telemetric',
};

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

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});