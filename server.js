const express = require('express');
const app = express();
const path = require('path');
const CosmosClient = require('@azure/cosmos').CosmosClient;

app.set('view engine', 'ejs'); 
app.use(express.static('public', { 'extensions': ['html', 'css'] }));

const config = {
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
  databaseId: process.env.COSMOS_DB_ID,
  containerId: process.env.COSMOS_CONTAINER_ID,
};

//console.log(config)

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

const port = 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});