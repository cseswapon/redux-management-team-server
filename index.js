const express = require("express");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const stripe = require("stripe")(process.env.STRIPE_SECRETE);

const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bnebi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let admin = require("firebase-admin");

// const token = JSON.parse(process.env.ID_TOKEN);
// console.log(token);
let serviceAccount = require("./redux-event-management-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//middleware
app.use(cors());
app.use(express.json());

async function run() {
  try {
    await client.connect();
    console.log("Database Connected", new Date().toTimeString());
    const db = client.db("eventManagement");
    const user_collection = db.collection("user");
    const add_service = db.collection("service");
    const order_collection = db.collection("order");

    // verify id token

    async function verifyToken(req, res, next) {
      if (req?.headers?.authorization?.startsWith("Barer ")) {
        const id_token = req?.headers?.authorization.split(" ")[1];
        try {
          const decoder = await admin.auth().verifyIdToken(id_token);
          req.decodedUserEmail = decoder.email;
        } catch {}
      }
      next();
    }

    // order api start

    app.post("/order", async (req, res) => {
      const data = req.body;
      const result = await order_collection.insertOne(data);
      res.json(result);
    });

    app.get("/order", async (req, res) => {
      const result = await order_collection.find({}).toArray();
      res.send(result);
    });

    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await order_collection.deleteOne(filter);
      res.send(result);
    });

    // exact email order

    app.get("/orders", verifyToken, async (req, res) => {
      console.log(req.decodedUserEmail);
      const email = req.query.email;
      if (req.decodedUserEmail === email) {
        const filter = { email: email };
        const result = await order_collection.find(filter).toArray();
        res.send(result);
      } else {
        res.status(401).send({ message: "not yet" });
      }
    });

    // add user database

    app.post("/user", async (req, res) => {
      const data = req.body;
      const result = await user_collection.insertOne(data);
      res.json(result);
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await user_collection.deleteOne(filter);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await user_collection.find({}).toArray();
      res.send(result);
    });

    // add to service

    app.post("/service", async (req, res) => {
      const data = req.body;
      const result = await add_service.insertOne(data);
      res.json(result);
    });

    // single service

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const cursor = { _id: ObjectId(id) };
      const result = await add_service.findOne(cursor);
      res.json(result);
    });

    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await add_service.deleteOne(filter);
      res.send(result);
    });

    // get to service

    app.get("/service", async (req, res) => {
      const result = await add_service.find({}).toArray();
      res.send(result);
    });

    // Stripe BAckend
    app.post("/create-payment-intent", async (req, res) => {
      const items = req.body;
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: items.price * 100,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Event Management Running!");
});

app.listen(port, () => {
  console.log(`listening port: ${port}`);
});
