'use strict';

const CLUBS_IN_LEAGUE = 20;
const RELEGATION_THRESOLD = 18;

const POINTS_PER_WIN = 3;
const POINTS_PER_DRAW = 1;
const POINTS_PER_LOSS = 0;
const MAX_POINTS_AVAILABLE = 2*(CLUBS_IN_LEAGUE-1)*POINTS_PER_WIN;
const MIN_POINTS_AVAILABLE = 2*(CLUBS_IN_LEAGUE-1)*POINTS_PER_LOSS;


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




// construct dictionary object of club objects
let leagueClubs = {};
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
      let teamId = myObject.teams[team]["id"];
      //console.log(teamNoString,thisTeam);
      //document.getElementById(teamNoString).innerHTML  = thisTeam;

      let newTdNode0 = document.createElement("td");      
      let newImgNode = document.createElement("img");
      newImgNode.src = crestURL;
      newImgNode.height = "35";
      //newImgNode.width = "35";
      newTdNode0.appendChild(newImgNode);
      
      let newTdNode1 = document.createElement("td");
      let textNode1 = document.createTextNode(thisTeam);
      newTdNode1.appendChild(textNode1);
      
      let newTdNode2 = document.createElement("td");
      let textNode2 = document.createTextNode(teamNoString); 
      newTdNode2.appendChild(textNode2);
      
      let newTdNode3 = document.createElement("td");
      let textNode3 = document.createTextNode(teamId); 
      newTdNode3.appendChild(textNode3);

      let newRowNode = document.createElement("tr");
      newRowNode.appendChild(newTdNode0);
      newRowNode.appendChild(newTdNode1);
      newRowNode.appendChild(newTdNode2);
      newRowNode.appendChild(newTdNode3);

      document.getElementById("myBody").appendChild(newRowNode);

      let thisClubId = myObject.teams[team]["id"];
      let thisClub = {  "name":         myObject.teams[team]["shortName"],
                        "crest":        myObject.teams[team]["crestUrl"],
                        "won":          0,
                        "drawn":        0,
                        "lost":         0,
                        "points":       0,
                        "goalsFor":     0,
                        "goalsAgainst": 0,
                        "potentialPointsWorst": MIN_POINTS_AVAILABLE,
                        "potentialPointsBest":  MAX_POINTS_AVAILABLE,
                        "potentialFinishWorst": CLUBS_IN_LEAGUE,
                        "potentialFinishBest": 1,
      };
      leagueClubs[thisClubId] = thisClub;
    }
    console.log(leagueClubs);
  });


