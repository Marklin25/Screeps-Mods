module.exports = config => {
  var fs = require("fs");
  var mods = fs.readdirSync("./mods").filter(folder => fs.statSync(`mods/${folder}`).isDirectory());
  for (var modName of mods) {
      if (modName == ".git") {
          continue;
      }
      console.log("running mod!", modName)
      var mod = require(`./${modName}`)
      mod(config);
  }
}