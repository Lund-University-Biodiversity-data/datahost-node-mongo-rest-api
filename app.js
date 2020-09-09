const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const CONNECTION_URL = "mongodb://localhost:27017";
const DATABASE_NAME = "dwca-datahost";

const API_PORT = 8085;
const LIMIT_MAX = 50;

function createCSVExport(collObject, paramRequest, result) {
        // retrieve all the fields name
    var arrFields = [];
    collObject.find(paramRequest).limit(1).toArray((error2, result2) => {
        for (key in result2) arrFields.push(key);

    });


    var { Parser } = require('json2csv');
    const json2csv = new Parser( { arrFields } );
    const csv = json2csv.parse(result)

    return csv
}


async function getArrayEvents (collEvents, paramRequestEvents) {

  return new Promise(resolve => {

    var arrEvents = [];

    collEvents.find(paramRequestEvents).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }

        for (var i=0; i < result.length; i++) {
            
          arrEvents.push(result[i].eventID);
          // do something with item
        }

        resolve(arrEvents);

    });
  });

}

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
        collOccurences = database.collection("occurences");
        console.log("Connected to `" + DATABASE_NAME + "`!");

    });

});

app.get("/events", (request, response) => {
    collEvents.find({}).limit(LIMIT_MAX).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        
        // check format
        if (typeof request.query.format !== 'undefined' && request.query.format == "csv"){
            csv = createCSVExport("", result);

            response.header('Content-Type', 'text/csv');
            response.attachment('events.csv')
            response.status(200).send(csv)
        }
        else {
            response.send(result);  

        }
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

    collEvents.find({ "county": request.params.county }).limit(LIMIT_MAX).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);	
    });
});


app.get("/events-multiple-params", (request, response) => {
// ?paramA=tamere&paramB=tonpere&paramC=tonshort

    var paramRequest;

    if (typeof request.query.startDate !== 'undefined' && request.query.startDate !== null){
        paramRequest = {
            "eventDate": { $gte : new Date( request.query.startDate + "T00:00:00.001Z") }
        };

    }


    collEvents.find(paramRequest).limit(LIMIT_MAX).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }

        // check format
        if (typeof request.query.format !== 'undefined' && request.query.format == "csv"){
            csv = createCSVExport(collEvents, paramRequest, result);

            response.header('Content-Type', 'text/csv');
            response.attachment('events-multiple-params.csv')
            response.status(200).send(csv)
        }
        else {
            response.send(result);  

        }



    });
});


async function getOccurences(request, response, collEvents, collOccurences) {

    var paramRequest = {};
    var paramRequestEvents = {};
    var arrEvents = [];


    if (typeof request.query.scientificName !== 'undefined' && request.query.scientificName !== null){

        var listSpecies = request.query.scientificName;
        var splitSpecies = listSpecies.split(',');
        paramRequest.scientificName = { $in : splitSpecies  };

    }

    if (typeof request.query.taxonID !== 'undefined' && request.query.taxonID !== null){

        var splitTaxonId = request.query.taxonID.split(',').map(Number);
        paramRequest.taxonID = { $in : splitTaxonId  };

    }

    if (typeof request.query.county !== 'undefined' && request.query.county !== null){

        var listCounties = request.query.county;
        var splitCounties = listCounties.split(',');
        paramRequestEvents.county = { $in : splitCounties  };

    }    

    var isStartDate=false;
    var isEndDate=false;
    var isArrEventsMandatory=false;

    if (typeof request.query.startDate !== 'undefined' && request.query.startDate !== null){

        isStartDate=true;

    }
    if (typeof request.query.endDate !== 'undefined' && request.query.endDate !== null){

        isEndDate=true;
    }
    if (isStartDate && isEndDate) {
        paramRequestEvents.eventDate = { 
            $gte : new Date( request.query.startDate + "T00:00:00.001Z"),
            $lte : new Date( request.query.endDate + "T23:59:59.999Z") 
        };

    }
    else if (isStartDate) {
        paramRequestEvents.eventDate = { $gte : new Date( request.query.startDate + "T00:00:00.001Z") };
    }
    else if (isEndDate) {
        paramRequestEvents.eventDate = { $lte : new Date( request.query.endDate + "T23:59:59.999Z") };
    }

    if (Object.keys(paramRequestEvents).length > 0 ) {

        arrEvents = await getArrayEvents(collEvents, paramRequestEvents);

        var isArrEventsMandatory=true;


    }

    if (isArrEventsMandatory >0) {

        // add it even if it's emmpty
        paramRequest.eventID = { $in : arrEvents  };

    }
    else {
        if (typeof request.query.eventID !== 'undefined' && request.query.eventID !== null){

            paramRequest.eventID = request.query.eventID;

        }
    }
    
    collOccurences.find(paramRequest).limit(LIMIT_MAX).toArray((error, result) => {

        if(error) {
            return response.status(500).send(error);
        }

        console.log("Nb of results :" + result.length);

        // check format
        if (typeof request.query.format !== 'undefined' && request.query.format == "csv"){
            csv = createCSVExport(collOccurences, paramRequest, result);

            response.header('Content-Type', 'text/csv');
            response.attachment('occurences-multiple-params.csv')
            response.status(200).send(csv)
        }
        else {
            response.send(result);  

        }

    });
        console.log("FIN");

}

app.get("/occurences-multiple-params", (request, response) => {
// ?startDate=2018-07-05&taxonID=102951,102958
// ?startDate=2017-07-05&endDate=2017-07-09&county=Jämtlands län
    getOccurences(request, response, collEvents, collOccurences);


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

*/
