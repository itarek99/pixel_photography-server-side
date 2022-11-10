const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
var jwt = require('jsonwebtoken');

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

const verifyJWT = async (req, res, next) => {
  const authHeader = await req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' });
  } else {
    const token = await authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        console.log(err);
        return await res.status(403).send({ message: 'forbidden access' });
      }
      req.decoded = decoded;
      next();
    });
  }
};

const run = async () => {
  try {
    const servicesCollection = client.db('pixelPhotography').collection('services');
    const reviewCollection = client.db('pixelPhotography').collection('reviews');

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    });

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

    app.get('/reviews', verifyJWT, async (req, res) => {
      const { email } = req.query;
      const { decoded } = req;

      if (email) {
        if (decoded.email !== req.query.email) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        let query = { email };
        const cursor = reviewCollection.find(query).sort({ created_at: -1 });
        const reviews = await cursor.toArray();
        res.send(reviews);
      }
    });

    app.get('/reviews/:id', async (req, res) => {
      const { id } = req.params;
      const query = { service_id: id };
      const cursor = reviewCollection.find(query).sort({ created_at: -1 });
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    app.get('/review/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const review = await reviewCollection.findOne(query);
      res.send(review);
    });

    app.patch('/review/:id', async (req, res) => {
      const { id } = req.params;
      const { review_text } = req.body;

      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          review_text,
        },
      };

      const result = await reviewCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const reviewWithTimeStamp = { ...review, created_at: new Date().getTime() };
      const result = await reviewCollection.insertOne(reviewWithTimeStamp);
      res.send(result);
    });

    app.delete('/reviews/:id', async (req, res) => {
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
  res.send('pixel photography server is running');
});

app.listen(port, console.log(`server is running on port: ${port}`));
