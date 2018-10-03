'use strict';

const CLUBS_IN_LEAGUE = 20;
const RELEGATION_THRESOLD = 18;

const POINTS_PER_WIN = 3;
const POINTS_PER_DRAW = 1;
const POINTS_PER_LOSS = 0;
const MAX_POINTS_AVAILABLE = 2*(CLUBS_IN_LEAGUE-1)*POINTS_PER_WIN;
const MIN_POINTS_AVAILABLE = 2*(CLUBS_IN_LEAGUE-1)*POINTS_PER_LOSS;


let leagueClubs = {};
let incomingObjectTeams = {};
let incomingObjectMatches = {};


// football-data.org credential
let footballHeaders = new Headers();
footballHeaders.append("X-Auth-Token", "102c4a1fda584443861d8e3f4fe4096e");


// construct dictionary object of club objects
fetch('https://api.football-data.org/v2/competitions/PL/teams', {
	      method: "GET",
        cache: "no-cache",
        headers: footballHeaders,
  		})
  .then(function(response) {
    return response.json();
  })
  .then(function(myJson) {
    incomingObjectTeams = JSON.parse(JSON.stringify(myJson));
    console.log(incomingObjectTeams);
    for (let team=0; team<incomingObjectTeams.teams.length;team++) {
      let thisTeam = incomingObjectTeams.teams[team]["shortName"];
      let teamNoString = "team"+team;
      let crestURL = incomingObjectTeams.teams[team]["crestUrl"];
      let teamId = incomingObjectTeams.teams[team]["id"];

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

      let thisClubId = incomingObjectTeams.teams[team]["id"];
      let thisClub = {  "name":         incomingObjectTeams.teams[team]["shortName"],
                        "crest":        incomingObjectTeams.teams[team]["crestUrl"],
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
  })
  .then(function() {
    // now unwrap the matches and tally points
    fetch('https://api.football-data.org/v2/competitions/PL/matches', {
        method: "GET",
        cache: "no-cache",
        headers: footballHeaders,
      })
  .then(function(response) {
    return response.json();
  })
  .then(function(myJson) {
    incomingObjectMatches = JSON.parse(JSON.stringify(myJson));
    console.log(incomingObjectMatches);
  });
});


