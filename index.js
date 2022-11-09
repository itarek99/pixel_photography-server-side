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
    const reviewCollection = client.db('pixelPhotography').collection('reviews');

    app.get('/services', async (req, res) => {
      const { size } = req.query;
      if (!size) {
        const cursor = servicesCollection.find({});
        const services = await cursor.toArray();
        res.send(services);
      } else {
        const descendingSort = { created_at: -1 };
        const cursor = servicesCollection.find({}).sort(descendingSort);
        const services = await cursor.limit(+size).toArray();
        res.send(services);
      }
    });

    app.post('/services', async (req, res) => {
      const service = req.body;
      const serviceWithTime = { ...service, created_at: new Date().getTime() };
      const result = await servicesCollection.insertOne(serviceWithTime);
      res.send(result);
    });

    app.get('/services/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const service = await servicesCollection.findOne(query);
      res.send(service);
    });

    app.get('/reviews', async (req, res) => {
      const { service_id, email } = req.query;

      if (service_id) {
        const query = { service_id };
        const cursor = reviewCollection.find(query);
        const reviews = await cursor.toArray();
        res.send(reviews);
      }

      if (email) {
        const query = { email };
        const cursor = reviewCollection.find(query);
        const reviews = await cursor.toArray();
        res.send(reviews);
      }
    });

    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      console.log(result);
    });

    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
};

run().catch((err) => console.error(err));

app.get('/', (req, res) => {
  res.send('gf server is running');
});

app.listen(port, console.log(`server is running on port: ${port}`));
