'use strict';
let Engine = require('../dist').Engine;
let engine = new Engine();
let apiClient = require('./support/database-data');
let facts = { accountId: 'result'};
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://10.0.8.62:27017/rocketchat_test';

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  //findRule_lastmessage(db, "rule-rescue", function() {
    //  db.close();
  //});
  //findRule_ApiCalls(db, "rule-get-api-calls", function() {
    //  db.close();
  //});
   findRule_ApiCalls(db, "rule-get-api-calls-multiple", function() {
      db.close();
  });
  
});

var findRule_lastmessage = function(db, ruleName, callback) {
   var cursor = db.collection('rocketchat_livechat_Chatbot_Rules').find({"ruleName":ruleName});
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      var previous_response = getPreviousResponse();
      if (doc !== null) {
        var conditionTagsValues = JSON.stringify(doc.conditions);
        var newConditions = JSON.parse(conditionTagsValues); 
        var correctData = JSON.parse(JSON.stringify(previous_response)); 
        var doc_property = doc.conditions.all[0].property;
        var doc_property1 = doc.conditions.all[0].property1;
        var doc_property2 = doc.conditions.all[0].property2;
        var data;
        for (var key in correctData) {
            if (key.indexOf(doc_property) !== -1) {
                data = correctData[key][doc_property1][doc_property2];
            }
        }
        newConditions.all[0].value = data;
        engine.addRule({conditions : newConditions, 
                        event : doc.event});      
        engine.addFact('last-message', function (params, almanac) {
            return almanac.factValue('accountId')
            .then(accountId => {
            return apiClient.getCurrentData(accountId);
        });
    });
  engine.run(facts)
  .then(events => {
    if (!events.length) return;
    events.map(event => console.log(event.params.message.red));
  }).catch(console.log);
      } else {
         callback();
      }
   });
}

var findRule_ApiCalls = function(db, ruleName, callback) {
   var cursor = db.collection('rocketchat_livechat_Chatbot_Rules').find({"ruleName":ruleName});
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc !== null) {
        engine.addRule({conditions : doc.conditions, 
                        event : doc.event});      
        engine.addFact('action-incomplete', function (params, almanac) {
            return almanac.factValue('accountId')
            .then(accountId => {
            return apiClient.getCurrentData(accountId);
        })
    })
  engine.run(facts)
  .then(events => {
    if (!events.length) return;
    events.map(event => console.log(event.params.message));
  }).catch(console.log);
      } else {
         callback();
      }
   });
}


function getPreviousResponse() {
  let previous_response =  {
  "id": "5675ace6-9fce-48ce-bc03-b5678c9d6d96",
  "timestamp": "2017-03-31T09:34:51.886Z",
  "lang": "en",
  "result": {
    "source": "agent",
    "resolvedQuery": "idv\\n",
    "action": "Quote-SetIDV",
    "actionIncomplete": true,
    "parameters": {
      "TargetIDV": ""	
    },
    "contexts": [
      {
        "name": "quote-setidv_dialog_context",
        "parameters": {
          "TargetIDV.original": "",
          "TargetIDV": ""
        },
        "lifespan": 2
      },
      {
        "name": "70042433-9515-476b-bfd3-11a6aedcb5d3_id_dialog_context",
        "parameters": {
          "TargetIDV.original": "",
          "TargetIDV": ""
        },
        "lifespan": 2
      },
      {
        "name": "quote-setidv_dialog_params_targetidv",
        "parameters": {
          "TargetIDV.original": "",
          "TargetIDV": ""
        },
        "lifespan": 1
      }
    ],
    "metadata": {
      "intentId": "70042433-9515-476b-bfd3-11a6aedcb5d3",
      "webhookUsed": "false",
      "webhookForSlotFillingUsed": "false",
      "intentName": "Quote-SetIDV"
    },
    "fulfillment": {
      "speech": "What is the minimum IDV that you need",
      "messages": [
        {
          "type": 0,
          "speech": "What is the minimum IDV that you need"
        }
      ]
    },
    "score": 1
  },
  "status": {
    "code": 200,
    "errorType": "success"
  },
  "sessionId": "sBFerSww75YzfymQQ"
}
    return previous_response;
}