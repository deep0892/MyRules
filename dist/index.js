'use strict';
require('./generator-runtime');
module.exports = require('./json-rules-engine');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var Engine = require('.').Engine;
var MongoClient = require('mongodb').MongoClient;
var cfg = require('./config');
let apiClient = require('./database-data');
let facts = {
    accountId: 'requestData'
};

var url = cfg.mongo.url;
var db = null;

MongoClient.connect(url, function (err, database) {
    if (err) {
        console.error(err);
        return;
    }
    db = database;
});

app.post('/rules', jsonParser, function (req, res) {
    console.log("Api Call Time - " + new Date());
    console.log("Mongo url:" + url);
    var requestdataValue = req.body;
    var currentIntent = req.body.requestData.current_response.result.metadata.intentName;
    console.log('APi called for Intent: ' + req.body.requestData.current_response.result.metadata.intentName);
    var counter = 0;
    if (db == null) {
        console.log('mongo not connected');
    } else {
        var engine = new Engine();

        //New Operator To check if an array contains a field or not 
        engine.addOperator('arrayobjectmatch', (factValue, jsonValue) => {
            if (!factValue) {
                return false;
            }
            var ar = jsonValue.split(":");
            var lpcount = 0;
            factValue.forEach((fact) => {
                if (fact[ar[0]] == ar[1]) {
                    lpcount = 1;
                }
            });
            if (lpcount == 1) {
                return true;
            }
        });
        //New Operator to check if a string contains a substring
        engine.addOperator('stringcontains', (factValue, jsonValue) => {
            if (!factValue.length){
                return false;
            } 
            if (factValue.indexOf(jsonValue) != -1){
                return true;
            }
        });
        //New Operator to check if if the date difference of current date and given is greater than given value
        engine.addOperator('getdatedifference', (factValue, jsonValue) => {
            if (!factValue.length){
                return false;
            }
            var a = jsonValue.split('-');
            var difference = a[1];
            if (a[0].toLowerCase() == 'year') {
                var year = new Date();
                year = year.getFullYear();
                if (Math.abs(year - factValue) >= difference)
                    return true;
            } else if (a[0].toLowerCase() == 'month') {
                var month = new Date();
                month = month.getMonth();
                if (Math.abs(month - factValue) >= difference)
                    return true;
            } else if (a[0].toLowerCase() == 'date') {
                var date = new Date();
                date = date.getDate();
                if (Math.abs(date - factValue) >= difference)
                    return true;
            } else{
                return false;
            }
        });

        var cursor = db.collection('Rules').find({
            "isActive": true,
            // "action": {
            //     $in: [currentIntent, 'Common']
            // },
            // "AIAgentId": req.body.requestData.AIAgentId
        }).sort({
            "priority": -1
        });
        var cursorCount = cursor.count(function (err, count) {
            cursor.each(function (err, doc) {
                if (doc !== null) {
                    var event = doc.event;
                    engine.addRule({
                        conditions: doc.conditions,
                        event: event
                    });
                    var docFact = doc.fact;
                    console.log(docFact);
                    engine.addFact(docFact, function (params, almanac) {
                        return almanac.factValue('accountId')
                            .then(accountId => {
                                return apiClient.getCurrentData(accountId, requestdataValue);
                            });
                    });
                    engine.run(facts)
                        .then(events => {
                            if (!events.length) {
                                counter = counter + 1;
                                if (counter == count) {
                                    res.json(null);
                                }
                            } else {
                                events.map(event => event.params);
                                count = 1;
                                res.json(event);
                            }
                            console.log(" Api Response - " + new Date());
                        }).catch(console.log('inside Catch'));
                }
            });
        })
    }
});

var server = app.listen(8000, function () {
    var host = "localhost";
    var port = 8000;
    console.log("Example app listening at http://%s:%s", host, port);
});