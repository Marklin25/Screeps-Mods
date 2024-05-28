var usersToFilter = [];
var leaderboardCeiling;
createDisplays();
async function createDisplays() {
    var visualDisplays = document.createElement("section");
    document.body.appendChild(visualDisplays);
    var data = await fetch("http://screeps.kellpro.com:443/scoreData").then(response => response.json()).then(response => response);
    turnDateStringsIntoDates(data);
    var minimumDate = new Date();
    minimumDate.setDate(minimumDate.getDate() - 8);
    var filteredUserData = data.filter(user => !usersToFilter.includes(user.user))
    rolling8Data = filterDataByMinimumDate(minimumDate, filteredUserData);
    var defaultCeiling = 50000000;
    if (rolling8Data.length) {
        makeLineGraph("rolling8", rolling8Data, { domainMaxY: leaderboardCeiling || defaultCeiling });
    }
    createOptionsForm();
    makeLeaderboard("scoreboard", data);
    if (filteredUserData.length) {
        makeLineGraph("overall", filteredUserData, { domainMaxY: leaderboardCeiling || defaultCeiling });
    }
    var deleteUserButtons = document.querySelectorAll(".delete_button");
    for (var deleteButton of deleteUserButtons) {
        deleteButton.addEventListener("click", async function () {
            var row = this.parentElement.parentElement;
            var username = row.querySelector(".user").innerHTML;
            if (confirm(`Are you sure you wish to delete ${username}? This will delete all of ${username}'s data.`)) {
                await fetch("http://screeps.kellpro.com:443/deleteUser", { 
                    method: "POST", 
                    body: username,
                    headers: { "Content-Type": "text/plain" }    
                });
                refreshDisplays();
            }
        }, false);
    }
    var leaderboardCeilingInput = document.querySelector("input[name=ceiling]");
    leaderboardCeilingInput.addEventListener("focusout", function () {
        leaderboardCeiling = this.value;
        refreshDisplays();
    })
    var filterCheckboxes = document.querySelectorAll(".filter_user");
    for (var filterCheckbox of filterCheckboxes) {
        filterCheckbox.addEventListener("click", async function () {
            var row = this.parentElement.parentElement;
            var username = row.querySelector(".user").innerHTML;
            if (this.checked && !usersToFilter.includes(username)) {
                usersToFilter.push(username);
            }
            if (!this.checked && usersToFilter.includes(username)) {
                usersToFilter.splice(usersToFilter.indexOf(username), 1);
            }
            refreshDisplays();
        }, false);
    }
    function makeLineGraph(id, data, options={}) {
        if (!id) {
            console.error("No `id` supplied, aborting!")
            return;
        }
        if (!data) {
            console.error("No `data` supplied, aborting!")
            return;
        }
        var margin = options.margin || {
            top: 10,
            right: 60,
            bottom: 50,
            left: 100
        };
        var div = document.createElement("div");
        visualDisplays.appendChild(div);
        div.id = id;
        var div = d3.select(`#${id}`);
        div.attr("class", "score-graph");
        var width = options.width || window.innerWidth - (margin.right + margin.left);
        var height = options.height || 700;
        var svg = setupDivForGraphing();
        var x = makeXAxis();
        var y = makeYAxis();
        graphLines();
        function setupDivForGraphing() {
          return div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        }
        function makeXAxis() {
            var minDate = findMinOfData("date", data);
            var maxDate = d3.max(data[0].scoreData, d => d.date);
            var maxValueX = options.maxValueX || d3.max(data[0].scoreData, d => d.tick);
            var minValueX = findMinOfData("tick", data);
            var x = d3.scaleLinear()
            .domain([minValueX, maxValueX])
            .range([0, width]);
             svg.append("g")
             .attr("transform", "translate(0," + height + ")")
             .call(d3.axisBottom(x));
            var dateLine = d3.scaleTime().range([0, width]).domain([minDate, maxDate]);
            svg.append("g")
            .attr("transform", "translate(0," + (height + 20) + ")")
            .call(d3.axisBottom(dateLine).tickValues([minDate, maxDate]).tickSize(20).tickFormat(d3.timeFormat("%Y-%m-%d")));
            svg.append("g")
            .attr("transform", "translate(0," + (height + 20) + ")")
            .call(d3.axisBottom(dateLine).tickFormat(d3.timeFormat("%Y-%m-%d")));
            return x;
        }
        function makeYAxis() {
            var maxValueY = options.maxValueY || d3.max(data, user => user.gcl);
            var minValueY = findMinOfData("gcl", data);
            var y = d3.scaleLinear()
            .domain([minValueY, options.domainMaxY || maxValueY])
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
    function makeLeaderboard(id, data) {
        if (!id) {
            console.error("No `id`, aborting!");
            return;
        }
        data.sort((first, second) => second.gcl - first.gcl);
        var htmlBody = d3.select("section");
        var table = htmlBody.append("table").attr("id", id);
        var thead = table.append("thead");
        var tableBody = table.append("tbody");
        thead.append("th").text("Player");
        thead.append("th").text("GCL");
        thead.append("th").text("Color");
        thead.append("th").text("Delete User");
        thead.append("th").text("Starting Date");
        thead.append("th").text("Filter User");
        for (var userObj of data) {
            var tr = tableBody.append("tr");
            tr.append("td").text(userObj.user).attr("class", "user");
            tr.append("td").text(userObj.gcl).attr("class", "gcl");
            tr.append("td").text(userObj.color).style("color", userObj.color).style("font-weight", "bold").attr("class", "color");
            tr.append("td").append("button").text("Delete").attr("class", "delete_button");
            var date = userObj.scoreData[0].date;
            var formattedDate = `${date.toLocaleString("default", { year: "numeric" })}-${date.toLocaleString("default", { month: "2-digit" })}-${date.toLocaleString("default", { day: "2-digit" })} ${date.toLocaleTimeString()}`;
            tr.append("td").style("width", "190px").text(formattedDate);
            tr.append("td").append("input").attr("type", "checkbox").attr("class", "filter_user").property("checked", usersToFilter.includes(userObj.user));
        }
    }
    function filterDataByMinimumDate(minimumDate, data) {
        data = JSON.parse(JSON.stringify(data));
        turnDateStringsIntoDates(data);
        for (var userObj of data) {
            userObj.scoreData = userObj.scoreData.filter(dataPoint => dataPoint.date.getTime() >= minimumDate.getTime());
        }
        return data;
    }
    function turnDateStringsIntoDates(data) {
        for (var userObj of data) {
            for (var i = 0; i < userObj.scoreData.length; i++) {
                userObj.scoreData[i].date = new Date(userObj.scoreData[i].date);
            }
        }
    }
    function findMinOfData(property, data) {
        for (var userObj of data) {
            var minProp = d3.min(userObj.scoreData, d => d[property]);
            if (minProp > lastMinProp) {
                minProp = lastMinProp;
            }
            var lastMinProp = minProp;
        }
        return minProp;
    }
    function createOptionsForm() {
        var section = document.querySelector("section");
        var form = document.createElement("form");
        var label = document.createElement("label");
        label.textContent = "Leaderboard Ceiling";
        label.setAttribute("for", "ceiling");
        form.appendChild(label);
        section.appendChild(form);
        var ceilingInput = document.createElement("input");
        ceilingInput.setAttribute("name", "ceiling");
        ceilingInput.setAttribute("type", "number");
        ceilingInput.value = leaderboardCeiling;
        form.appendChild(ceilingInput);
    }
}
async function refreshDisplays() {
    var allDisplays = document.querySelector("section");
    allDisplays.remove();
    await createDisplays();
}
