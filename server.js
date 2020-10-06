const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const port = 4000;
const pass = "LB6MXrkzNUK0wmqt";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

const uri =
  "mongodb+srv://kamrana610:LB6MXrkzNUK0wmqt@cluster0.lkrgo.mongodb.net/volunteerNetwork?retryWrites=true&w=majority";
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
    console.log(newRegistration);
  });

  //Get Data from database
  app.get("/myEvents", (req, res) => {
    registerCollection
      .find({ email: req.query.email })
      .toArray((err, results) => {
        res.send(results);
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

//Connetion Check
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
