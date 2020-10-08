const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const port = 4000;
const db_User = process.env.DB_USER;
const db_Pass = process.env.DB_PASS;
const fireDB_URL = process.env.FIREDB_URL;

const admin = require("firebase-admin");
const serviceAccount = require("./configs/volunteer-network-98347-firebase-adminsdk-atr4a-9cec7aada1.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: fireDB_URL,
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

const uri = `mongodb+srv://${db_User}:${db_Pass}@cluster0.lkrgo.mongodb.net/volunteerNetwork?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const registerCollection = client
    .db("volunteerNetwork")
    .collection("registrations");

  //Post data to Database
  app.post("/registration", (req, res) => {
    const newRegistration = req.body;
    registerCollection.insertOne(newRegistration).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //Get Data from database
  app.get("/myEvents", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            registerCollection
              .find({ email: queryEmail })
              .toArray((err, results) => {
                res.send(results);
              });
          } else {
            res.status(401).send("Un-Authorized Access");
          }
        })
        .catch(function (error) {
          //Handle errors
        });
    } else {
      res.status(401).send("Un-Authorized Access");
    }
  });

  //Get All User for Admin
  app.get("/allUser", (req, res) => {
    registerCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //Delete Data from database
  app.delete("/delete/:id", (req, res) => {
    registerCollection
      .deleteOne({ _id: ObjectID(req.params.id) })
      .then((results) => {
        if (results) {
          res.send(results.deletedCount > 0);
        }
      });
  });
});

//Connect to Events Collection...
client.connect((err) => {
  const eventsCollection = client.db("volunteerNetwork").collection("events");
  //Sent new evenetData to Database
  app.post("/createEvent", (req, res) => {
    const newEvent = req.body;
    eventsCollection.insertOne(newEvent).then((result) => {
      res.send(result.insertedCount > 0);
    });

    app.get("/createdEvent", (req, res) => {
      eventsCollection.find({}).toArray((err, documents) => {
        res.send(documents);
      });
    });
  });
});

//Connetion Check
app.get("/", (req, res) => {
  res.send("Welcome to Volunteer Network Server!");
});

app.listen(process.env.PORT || port);
