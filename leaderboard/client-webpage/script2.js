async function displayLeaderboardData () {
  var data = await fetch("http://screeps.kellpro.com:443/scoreData").then(response => response.json()).then(response => response);
  var div = d3.select("#score-graph");
  makeLineGraph(div, data);
  var tableBody = d3.select("table tbody");
  makeLeaderboard(tableBody, data);
  function makeLineGraph(div, data, options={}) {
      if (!div) {
          console.error("No `div` supplied, aborting!")
          return;
      }
      if (!data) {
          console.error("No `data` supplied, aborting!")
          return;
      }
      var margin = options.margin || {
          top: 10,
          right: 30,
          bottom: 30,
          left: 100
      };
      var width = options.width || 760;
      var height = options.height || 700;
      var maxValueY = options.maxValueY || d3.max(data, user => user.gcl);
      var maxValueX = options.maxValueX || d3.max(data[0].scoreData, d => d.tick);
      var svg = setupDivForGraphing();
      var x = makeXAxis();
      var y = makeYAxis();
      graphLines();
      function setupDivForGraphing() {
        return div.append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
      }
      function makeXAxis() {
          var x = d3.scaleLinear()
          .domain([0, maxValueX])
          .range([0, width])
          svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));
          return x;
      }
      function makeYAxis() {
          var y = d3.scaleLinear()
          .domain([0, maxValueY])
          .range([height, 0 ]);
          svg.append("g")
          .call(d3.axisLeft(y));
          return y;
      }
      function graphLines() {
          for (var userData of data) {
              var userScoreData = userData.scoreData;
              svg.append("path")
              .datum(userScoreData)
              .attr("fill", "none")
              .attr("stroke", userData.color)
              .attr("stroke-width", 1.5)
              .attr("d", d3.line()
              .x(function(d) { return x(d.tick) })
              .y(function(d) { return y(d.gcl) })
            );
          }
      }
  }
  function makeLeaderboard(tableBody, data) {
      data.sort((first, second) => second.gcl - first.gcl);
      for (var userObj of data) {
          var tr = tableBody.append("tr");
          tr.append("td").text(userObj.user);
          tr.append("td").text(userObj.gcl);
          tr.append("td").text(userObj.color).style("color", userObj.color).style("font-weight", "bold");
      }
  }
}
displayLeaderboardData();
