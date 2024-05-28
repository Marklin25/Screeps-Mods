module.exports = function (config) {
    var fs = require("fs");
    var path = require("path");
    var express = require("express");
    var _ = require("lodash");
  config.backend.on("expressPreConfig", function (app) {
    var leaderboardFile = fs.readFileSync(path.join(__dirname, "client-webpage/index.html"), { encoding: "utf-8" });
    app.get("/leaderboard", function (req, res) {
        res.set("text/html").send(leaderboardFile);
    });
    app.get("/scoreData", async function (req, res) {
        var users = await getUsers();
        users = users.filter(user => user.registeredDate);
        var objectToSend = {};
        for (var user of users) {
            if (!user.color) {
                var db = getDB();
                user.color = getColors()[_.random(0, 6)];
                db.users.update({ _id: user._id }, { $set: { color: user.color } });
            }
            if (user.username) {
                objectToSend[user.username] = { scoreData: JSON.parse(user.scoreData), color: user.color };
            }
        }
        var objectToSend = JSON.stringify(objectToSend);
        res.set("text/json").send(objectToSend);
    });
    app.use(express.static(path.join(__dirname, "client-webpage")));
  })
  if (config.cronjobs && config.common && config.common.storage) {
      config.cronjobs.pushToScoreData = [5, async function () {
        var db = getDB();
        ensureCollection("Game")
        db.Game.insert({ tick: 0 })
        // if (config && config.common && config.common.storage && config.common.storage.db && config.common.storage.db.users && config.common.storage.db.users.update) {

        // }
          var num = Math.round(Math.random() * 10);
          var users = await getUsers();
          for (var user of users) {
              var userScoreData = user.scoreData ? JSON.parse(user.scoreData) : [];
              userScoreData.push({ gcl: user.gcl, tick: num });
              var db = getDB();
              // db.users.update({ _id: user._id }, { $set: { scoreData: JSON.stringify(userScoreData) } });
          }
      }];
  }
  function getDB() {
      return config.common && config.common.storage && config.common.storage.db;
  }
  async function getUsers() {
      var db = getDB();
      var users = await db.users.find();
      return users
  }
  function ensureCollection(collectionName) {
        config.common.storage.db.users.update({ username: "Mark25" }, { $set: { test4: config.common.dbCollections } })
        if (!config.common.dbCollections.includes(collectionName)) {
            config.common.dbCollections.push(collectionName);
        }
    }
    function getAndRemoveColor(index) {
        ["red", "blue", "teal", "green", "yellow", "grey", "navyBlue", "tan", "purple"];
    }
};


// console.log(`<span style="color:blue">TESTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT</span>`)
// console.log(`<span style="color:red">TESTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT</span>`)
