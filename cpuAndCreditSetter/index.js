module.exports = function (config) {
  if (config.cronjobs) {
    config.cronjobs.setPlayerDefaults = [60, async function () {
      var db = config.common.storage.db;
      var users = await db.users.find();
      for (var user of users) {
        if (user.steam && !user.setDefaults) {
          await db.users.update({ _id: user._id }, { $set: { cpu: 100, money: 2500000000, setDefaults: true } });
        }
      }
    }];
    config.cronjobs.turnPowerToCPU = [60, async function () {
        var db = config.common.storage.db;
        var users = await db.users.find();
        for (var user of users) {
            if (user.steam && user.cpu < 100 + Math.sqrt(user.power)/4) {
                db.users.update({ _id: user._id }, { $set: { cpu: Math.floor(100 + Math.sqrt(user.power)/4) } });
            }
        }
    }];
  }
};
