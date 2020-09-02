const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = "mongodb://localhost:27017";
const DATABASE_NAME = "dwca-datahost";

const API_PORT = 8085;

var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
var database, collection;

app.listen(API_PORT, () => {
    console.log("App running on port " + API_PORT);
    MongoClient.connect(CONNECTION_URL, { useUnifiedTopology: true, useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collEvents = database.collection("events");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.get("/events", (request, response) => {
    collEvents.find({}).limit(10).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);	
    });
});

app.get("/events/:id", (request, response) => {
// SFTstd:19960523:143
    collEvents.findOne({ "eventID": request.params.id }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});

app.get("/events-per-county/:county", (request, response) => {
// Västra Götalands län
// http://localhost:5000/events-per-county/V%C3%A4stra%20G%C3%B6talands%20l%C3%A4n
   	console.log(request.params.county);
    collEvents.find({ "county": request.params.county }).limit(10).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);	
    });
});


app.get("/events-multiple-params", (request, response) => {
// ?paramA=tamere&paramB=tonpere&paramC=tonshort
   	console.log(request.query.paramA);
   	console.log(request.query.paramB);
   	console.log(request.query.paramC);
    collEvents.find().limit(10).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);	
    });
});


/*
app.post("/personnel", (request, response) => {
    collection.insert(request.body, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result.result);
    });
});

app.get("/personnel", (request, response) => {
    collection.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});
*/
