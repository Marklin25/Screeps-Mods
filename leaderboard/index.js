module.exports = function (config) {
  var fs = require("fs");
  var path = require("path");
  var express = require("express");
  var _ = require("lodash");
  var bodyParser = require("body-parser");
  try {
    ensureCollection("savedVariables");
    console.log("testing")
    if (config.backend) {
        config.backend.on("expressPreConfig", async function (app) {
          var db = getDB();
          var users = await getPlayers();
          var leaderboardFile = fs.readFileSync(path.join(__dirname, "client-webpage/index.html"), { encoding: "utf-8" });
          app.get("/leaderboard", function (req, res) {
            res.set("text/html").send(leaderboardFile);
          });
          app.get("/scoreData", async function (req, res) {
            if (db.savedVariables) {
                var users = await getPlayers();
                users = users.filter(user => user.steam);
                var arrayToSend = [];
                for (var user of users) {
                    if (user) {
                        if (!user.color) {
                            user.color = getRandomUnusedColor();
                            db.users.update({ _id: user._id }, { $set: { color: user.color } });
                        }
                        if (!user.scoreData) {
                            user.scoreData = [];
                        }
                        if (user.username) {
                            arrayToSend.push({ user: user.username, scoreData: user.scoreData, color: user.color, gcl: user.gcl });
                        }
                    }
                }
                var arrayToSend = JSON.stringify(arrayToSend);
                res.set("text/json").send(arrayToSend);
            }
          });
          app.use(bodyParser.text());
          app.post("/deleteUser", async function (req, res) {
              var userToDelete = await db.users.findOne({ username: req.body });
              await db["rooms.objects"].update({ user: userToDelete._id, type: "controller" }, { $set: { user: null, level: 0, safeMode: 0 } });
              await db["rooms.objects"].find().then(data => data.filter(data => data.user == userToDelete._id && data.type != "controller").forEach(row => db["rooms.objects"].removeWhere({ _id: row._id })));
              await db.users.removeWhere({ _id: userToDelete._id });
              res.send(200);
          });
          app.use(express.static(path.join(__dirname, "client-webpage")));
          if (config.cronjobs && config.common && config.common.storage) {
            config.common.storage.pubsub.subscribe("roomsDone", async function (tick) {
              var users = await getPlayers();
              for (var user of users) {
                var userScoreData = user.scoreData;
                if (tick % 3600 == 0 || !userScoreData) {
                  if (!userScoreData) {
                      userScoreData = [];
                  }
                  userScoreData.push({ gcl: user.gcl, tick: +tick, date: new Date() });
                  var minimumDate = new Date();
                  minimumDate.setMonth(minimumDate.getMonth() - 1);
                  userScoreData = userScoreData.filter(dataPoint => dataPoint.date.getTime() >= minimumDate.getTime());
                  db.users.update({ _id: user._id }, { $set: { scoreData: userScoreData } });
                }
              }
            })
          }
          function getRandomUnusedColor() {
            var colorArray = ["red", "blue", "teal", "green", "yellow", "grey", "navy", "tan", "purple", "orange", "lime", "fuchsia", "aqua", "brown", "chocolate", "crimson", "darkmagenta", "darkolivegreen", "darkorange", "darkslateblue"];
            var currentUserColors = users.filter(user => user.steam && user.color).map(user => user.color);
            var unusedColors = _.difference(colorArray, currentUserColors);
            var num = _.random(0, unusedColors.length - 1);
            var color = unusedColors[num];
            return color;
          }
          async function getPlayers() {
            var users = await db.users.find();
            users = users.filter(user => user.steam);
            return users;
          }
        })
      }
      function getDB() {
        return config.common && config.common.storage && config.common.storage.db;
      }
      function ensureCollection(collectionName) {
        if (!config.common.dbCollections.includes(collectionName)) {
          config.common.dbCollections.push(collectionName);
        }
      }
  } catch (err) {
      console.log("---CUSTOM MOD ERROR---", err)
  }
};
