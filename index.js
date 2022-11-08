const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ybjhadr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const servicesCollection = client.db('pixelPhotography').collection('services');

    app.get('/services', async (req, res) => {
      const { size } = req.query;
      if (!size) {
        const cursor = servicesCollection.find({});
        const services = await cursor.toArray();
        res.send(services);
      } else {
        const cursor = servicesCollection.find({});
        const services = await cursor.limit(+size).toArray();
        res.send(services);
      }
    });

    app.get('/services/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const service = await servicesCollection.findOne(query);
      res.send(service);
    });
  } finally {
  }
};

run().catch((err) => console.error(err));

app.get('/', (req, res) => {
  res.send('gf server is running');
});

app.listen(port, console.log(`server is running on port: ${port}`));
