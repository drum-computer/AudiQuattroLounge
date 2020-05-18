// --------- Imports ------------------
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const dgram = require('dgram');
const http = require('http').Server(app);
const TD = dgram.createSocket('udp4'); //TouchDesigner is a software responsible for photo processing
const request = require('request');
const schedule = require('node-schedule');
const json2xls = require('json2xls');
require('dotenv').config();



// --------- Init -------------------------
let urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(express.static('public'));



// --------- Session Globals -------------------------
let db;
let sessionId;
let name;
let lastName;
let email;
let phone;
let subscribed;
let closed;
const mailURL = process.env.MAIL_SERVER;
const audiCRMURL = process.env.AUDI_CRM_URL;
const testEmailAddress = process.env.TEST_EMAIL;
const reportEmailAddress = process.env.REPORT_EMAIL;


// --------- Main -------------------------
// this function reads database and returns it.
// it's made to prevent db overwrite in case of the server restart 
function readDatabase(){ 
    let rawDB = fs.readFileSync('db.json', 'utf8')
    db = JSON.parse(rawDB); //as an object
    return db;
};

function writeDatabase(entry){
    db.push(entry);
    let dbAsJson = JSON.stringify(db, null, 2);
    fs.writeFileSync("db.json", dbAsJson, "utf8");
    console.log("db write done!");
    console.log(entry);
};

db = readDatabase();
sessionId = db.length;
console.log("session ID:" + sessionId);



// ------------ Web Callbacks --------------------
app.get('/', function(req, res){
    res.sendFile(__dirname + '/welcome.html');
    TDSend({
            "Command": "Page Select",
            "Value": 1
            });
});

app.get('/register', function(req, res){
    res.sendFile(__dirname + '/register.html')
    TDSend({
        "Command": "Page Select",
        "Value": 2
        });
});

app.get('/photo', function(req, res){
    res.sendFile(__dirname + '/photo.html')
    TDSend({
        "Command": "Page Select",
        "Value": 3
        });
});

app.get('/goodbye', function(req, res){
    res.sendFile(__dirname + '/goodbye.html')
    TDSend({
        "Command": "Page Select",
        "Value": 4
        });
});



// ------------------- API --------------------------------------
app.post('/api/register', urlencodedParser, function(req, res){
    // updating global values with current session ones
    name = req.body.name;
    lastName = req.body.lName;
    email = req.body.email;
    phone = req.body.phone;
    subscribed = req.body.subscribed;
    res.sendStatus(200);
});

app.post('/api/trigger', urlencodedParser, function(req, res){ //triggers photo camera to take photo
    TDSend({
        "Command": "Trigger",
        "Value": req.body.trigger,
        "Session ID": sessionId
        })
    console.log('trigger event received');
    res.sendStatus(200);
});

app.post('/api/endSession', urlencodedParser, function(req, res){
    closed = req.body.closed;
    let now = new Date();
    
    let entry = {"session Id": sessionId,
                "name": name,
                "last name": lastName,
                "phone": phone,
                "email": email,
                "subscribed": subscribed,
                "timestamp": now.toLocaleDateString()
                };

    if(closed === 'true'){
        writeDatabase(entry);
        sendGuestEmail(name, email, sessionId);
        audiCRMPost(entry);
        sessionId++;
    }else{
        console.log("cancelled. db not modified!");
    };

    res.sendStatus(200);
});

function TDSend(message){ //sends status-message to a local photo server
    TD.send(JSON.stringify(message, null, 2) + '\n', 8000);
}



// ----------- Send E-Mail ---------------
//  Send email with photo to a guest
function sendGuestEmail(sender, address, ID){
    console.log("sending email");
    let data = {
        "Subject": "Ваше фото из #audi quattro Lounge",
        "addAddress[to]": address,
        "addAddress[name]": sender,
        "attach": fs.createReadStream(__dirname + `/photo/photo${ID}.jpeg`)
    };
    let options = {
        'url': mailURL, 
        'formData': data
    };

    postData(options);
}

// Send test email for debug purpose
function sendTestEmail(){
    let data = {
        "Subject": "Ваше фото из #audi quattro Lounge",
        "addAddress[to]": testEmailAddress,
        "addAddress[name]": "Денис",
        "attach": fs.createReadStream(__dirname + '/photo.jpeg')
    };
    let options = {
        'url': mailURL, 
        'formData': data
    };
    
    postData(options);
}

// Send daily traffic report
function sendDailyReport(visitors){
    let data = {
        "Subject": `Количество гостей за сегодня: ${visitors}`,
        "addAddress[to]": reportEmailAddress,
        "addAddress[name]": "Денис"
    };
    let options = {
        'url': mailURL, 
        'formData': data
    };
    
    postData(options);  
}

// Send weekly traffic report as .xls file
function sendWeeklyReport(fileName){
    let data = {
        "Subject": 'Выгрузка базы данных',
        "addAddress[to]": reportEmailAddress,
        "addAddress[name]": "Денис",
        "attach": fs.createReadStream(__dirname + `/${fileName}`)
    };
    let options = {
        'url': mailURL, 
        'formData': data
    };
    
    postData(options);   
}

// Send visitor data to Audi processing center
function audiCRMPost(entry){
    let data = {
        "first_name": entry["name"],
        "last_name": entry["last name"],
        "phone": entry["phone"],
        "email": entry["email"],
        "communication": entry["subscribed"],
        "news_brand": entry["subscribed"]
    };
    let options = {
        'url': audiCRMURL, 
        'json': true, 
        'body': data
    };

    postData(options);         
}

function postData(options){
    request.post(options, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('upload failed:', err);
        }
        console.log('Upload successful!  Server responded with:', body);
    });    
}



// ----------- Scheduled Events ---------------
// generate daily report
schedule.scheduleJob('1 19 * * *', function(){
    let visitorsCount = 0;
    let today = new Date().toLocaleDateString();
    db.forEach(element => {
        if(element.timestamp === today){
            visitorsCount++;
        }
    });
    sendDailyReport(visitorsCount);
});

// generate weekly report (in .xls format)
schedule.scheduleJob('2 19 * * 5', function(){
    let fileName = "Audi DataBase.xlsx";
    let xls = json2xls(db,{
        fields: {
            "session Id":'string',
            "name": 'string',
            "last name": "string",
            "phone": "string",
            "email": "string",
            "subscribed": "string",
            "timestamp": "string"
                                }
    });
    fs.writeFileSync(fileName, xls, 'binary');
    sendWeeklyReport(fileName);
});



// ----------- Start Server ---------------
http.listen(3000);
// sendTestEmail();
