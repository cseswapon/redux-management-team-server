const express = require("express");
require("dotenv").config();
const { MongoClient } = require("mongodb");
// const ObjectId = require('mongodb').ObjectId;

const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bnebi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//middleware
app.use(cors());
app.use(express.json());

async function run() {
  try {
    await client.connect();
    console.log("Database connection", new Date());
    const db = client.db("eventManagement");
    const user_collection = db.collection("user");

        /**
         * add user to database
         */
        app.post('/user', async(req, res) => {
			
			    res.json('result');
        });


    }
    finally{
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Event Managment Running!');
})

app.listen(port, () => {
  console.log(`listening port: ${port}`);
});
