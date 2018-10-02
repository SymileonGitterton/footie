'use strict';

let myObject = {};
//console.log(myObject);

let footballHeaders = new Headers();
footballHeaders.append("X-Auth-Token", "102c4a1fda584443861d8e3f4fe4096e");

fetch('https://api.football-data.org/v2/competitions/PL/matches', {
        method: "GET", // *GET, POST, PUT, DELETE, etc.
        //mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        //credentials: "same-origin", // include, same-origin, *omit
        //headers: {
        //  "X-Auth-Token": "102c4a1fda584443861d8e3f4fe4096e",
            //"Content-Type": "application/json; charset=utf-8",
            // "Content-Type": "application/x-www-form-urlencoded",
        //},
        headers: footballHeaders,
        //redirect: "follow", // manual, *follow, error
        //referrer: "no-referrer", // no-referrer, *client
        //body: JSON.stringify(data), // body data type must match "Content-Type" header)
      })
  .then(function(response) {
    return response.json();
  })
  .then(function(myJson) {
    let matchOfTheDay = 69;
    myObject = JSON.parse(JSON.stringify(myJson));
    let myMatch = myObject.matches[matchOfTheDay];
    console.log("Match of the Day is no.",matchOfTheDay,"\n");
    console.log(myMatch.homeTeam["name"]," ",myMatch.score.fullTime["homeTeam"],"-",myMatch.score.fullTime["awayTeam"]," ",myMatch.awayTeam["name"]);
  });

fetch('https://api.football-data.org/v2/competitions/PL/teams', {
	      method: "GET",
        cache: "no-cache",
        headers: footballHeaders,
  		})
  .then(function(response) {
    return response.json();
  })
  .then(function(myJson) {
    myObject = JSON.parse(JSON.stringify(myJson));
    console.log(myObject);
    for (let team=0; team<myObject.teams.length;team++) {
      let thisTeam = myObject.teams[team]["shortName"];
      let teamNoString = "team"+team;
      let crestURL = myObject.teams[team]["crestUrl"];
      console.log(teamNoString,thisTeam);
      //document.getElementById(teamNoString).innerHTML  = thisTeam;

      let newTdNode0 = document.createElement("td");      
      let newImgNode = document.createElement("img");
      newImgNode.src = crestURL;
      newImgNode.height = "35";
      newImgNode.width = "35";
      newTdNode0.appendChild(newImgNode);
      
      let newTdNode1 = document.createElement("td");
      let textNode1 = document.createTextNode(thisTeam);
      newTdNode1.appendChild(textNode1);
      
      let newTdNode2 = document.createElement("td");
      let textNode2 = document.createTextNode(teamNoString); 
      newTdNode2.appendChild(textNode2);


      let newRowNode = document.createElement("tr");
      newRowNode.appendChild(newTdNode0);
      newRowNode.appendChild(newTdNode1);
      newRowNode.appendChild(newTdNode2);

      document.getElementById("myBody").appendChild(newRowNode);

    }

    });


console.log("done\n");