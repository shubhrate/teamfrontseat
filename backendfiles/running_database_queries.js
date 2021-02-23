//source: 
//https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTP-server/
//https://nodejs.org/api/synopsis.html
//useful for testing connection to database - not for actually connecting to database

const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;
const db_name = "BlockingApp";
const dbo = db.db(`${db_name}`);
const users_collection_name = "users";
const username = "";//enter your username here
const password = "";//enter your password here

var mongo = require('mongodb');

//Connection URI
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${username}:${password}@test.abgad.mongodb.net/${db_name}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true });

client.connect(err => {
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    client.close();
});

//create a database
var url1 = `mongodb://localhost:${port}/${frontseat}`;
MongoClient.connect(url1, function(err, db) {
    if (err) throw err;
    console.log("Database created!");
    db.close();
})

//create a collection for users logging in
var url2 = "mongodb://localhost:27017/";
MongoClient.connect(url2, function(err, db) {
    if (err) throw err;
    dbo.createCollection(`${users_collection_name}`, function(err, res) {
        if (err) throw err;
        console.log("Collection created!");
        db.close();
    });
});

//insert a user into users collection
MongoClient.connect(url2, function(err, db) {
    if (err) throw err;
    //this could also be a list of many users
    var myobj = { status: "pass", payload: {userId: "Jane", name: "Jane Smith"}, message: undefined};
    //if it was a list we would instead say:
    //dbo.collection("users").insertMany(myObj, function(err, res))
    dbo.collection(`${users_collection_name}`).insertOne(myobj, function(err, res) {
        if (err) throw err;
        //if many users, console.log("Number of users inserted: " + res.insertedCount);
        console.log("1 user inserted");
        db.close();
    });
});

//find first document in users collection
MongoClient.connect(url2, function(err, db) {
    if (err) throw err;
    dbo.collection(`${users_collection_name}`).findOne({}, function(err, result) {
        if (err) throw err;
        console.log(result.name);
        db.close();
    });
});

//find all documents in the users collection
MongoClient.connect(url2, function(err, db) {
    if (err) throw err;
    dbo.collection(`${users_collection_name}`).find({}).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        db.close();
    });
});

//return the fields "status" and "payload" of all documents in the users collection
MongoClient.connect(url2, function(err, db) {
    if (err) throw err;
    dbo.collection(`${users_collection_name}`).find({}, { projection: {_id: 0, status: 1, payload: 1 } }).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        db.close();
    });
});

//find documents in users collection with userId Jane
MongoClient.connect(url2, function(err, db) {
    if (err) throw err;
    var query = { userId: "Jane" };
    dbo.collection(`${users_collection_name}`).find(query).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        db.close();
    });
});

//delete first occurence of document with userId Jane
//could also use deleteMany to delete all occurences
//deleteMany returns result object that looks like:
//{ n: 2, ok: 1 }
MongoClient.connect(url2, function(err, db) {
    if (err) throw err;
    var myquery = { userId: "Jane" };
    dbo.collection(`${users_collection_name}`).deleteOne(myquery, function(err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        db.close();
    });
});

//update document with userId Jane to userId Tim
//could also use updateMany
//result object:
//{ n: 1, nModified: 2, ok: 1 }
var url3 = `mongodb://${hostname}:${port}/`;
MongoClient.connect(url3, function(err, db) {
    if (err) throw err;
    var myquery = { userId: "Jane" };
    var newvalues = { $set: {userId: "Tim"} };
    dbo.collection(`${users_collection_name}`).updateOne(myquery, newvalues, function(err, res) {
        if (err) throw err;
        console.log("1 user updated");
        db.close();
    });
});

//requestListener takes a request object and a response object as parameters
//request object contains requested URL
//response object is how we send the headers and contents of the response back
//to the user making the request
const requestListener = http.createServer((req, res) => {
    //return a 200 response code signalling a successful response
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    //res.writeHead(200);
    res.end('Hello, World!\n');
});

//http.createServer creates a server that calls requestListener whenever
//a request comes in
//const server = http.createServer(requestListener);

//server.listen(8080) calls the listen method, which causes the server to wait
//for incoming requests on the specified port
requestListener.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});


//Running above example:
//node server.js
//open up browser and type localhost:8080
//to get the response: curl localhost:8080

//source: https://www.mongodb.com/blog/post/quick-start-nodejs-mongodb--how-to-get-connected-to-your-database
async function main(){
    try {
        //Connect to the MongoDB cluster
        await client.connect();
        
        await listDatabases(client);
    } catch (e) {
        console.error(e);
    }
    
    finally {
        await client.close();
    }

}
main().catch(console.error);

async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};
