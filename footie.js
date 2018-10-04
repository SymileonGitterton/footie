'use strict';

const CLUBS_IN_LEAGUE = 20;
const RELEGATION_THRESOLD = 18;

const POINTS_PER_WIN = 3;
const POINTS_PER_DRAW = 1;
const POINTS_PER_LOSS = 0;
const MAX_POINTS_AVAILABLE = 2*(CLUBS_IN_LEAGUE-1)*POINTS_PER_WIN;
const MIN_POINTS_AVAILABLE = 2*(CLUBS_IN_LEAGUE-1)*POINTS_PER_LOSS;

const tableHeaderNames = [{"colname":" ",       "colvalue":"position"},
                          {"colname":" ",       "colvalue":"crest"},
                          {"colname":"team",    "colvalue":"name"},
                          {"colname":"points",  "colvalue":"points"},
                          {"colname":"MP",      "colvalue":"played"},
                          {"colname":"W",       "colvalue":"won"},
                          {"colname":"D",       "colvalue":"drawn"},
                          {"colname":"L",       "colvalue":"lost"},
                          {"colname":"GF",      "colvalue":"goalsFor"},
                          {"colname":"GA",      "colvalue":"goalsAgainst"},
                          {"colname":"GD",      "colvalue":"goalDifference"},
                          {"colname":"Pmax",    "colvalue":"potentialPointsBest"},
                          {"colname":"Pmin",    "colvalue":"potentialPointsWorst"},
                          {"colname":"best",    "colvalue":"potentialFinishBest"},
                          {"colname":"worst",   "colvalue":"potentialFinishWorst"} 
                          ];

// global objects
let leagueClubs = {};
let leagueTable = [];
let incomingObjectTeams = {};
let incomingObjectMatches = {};

// football-data.org credential
let footballHeaders = new Headers();
footballHeaders.append("X-Auth-Token", "102c4a1fda584443861d8e3f4fe4096e");



let constructTheTable = function() {
  for(let i=0;i<CLUBS_IN_LEAGUE;i++) {
    leagueTable[i] = {"position":0, "club":-1, "points":0};    // no club assigned to this position
  }
};

let constructTheChart = function() {
  // first, the header row
  let newTrNode = document.createElement("tr");  // header row

  for (let column=0; column<tableHeaderNames.length; column++) {
    let newThNode = document.createElement("th");
    let newTextNode  = document.createTextNode(tableHeaderNames[column].colname);
    newThNode.appendChild(newTextNode);
    newTrNode.appendChild(newThNode);
  }
  document.getElementById("myFootieTableHeader").appendChild(newTrNode);

  // then the body rows
  for (let row=0;row<CLUBS_IN_LEAGUE;row++) {
    // start a new row
    let newTrNode  = document.createElement("tr");

    // always populate the 'position' colyoum
    let newTdNode   = document.createElement("td");
    let newTextNode = document.createTextNode(leagueTable[row].position);
    newTdNode.appendChild(newTextNode);
    newTrNode.appendChild(newTdNode);

    // and the crest column
    newTdNode = document.createElement("td");
    let newImgNode = document.createElement("img");
    newImgNode.src = "EPL_logo.png";
    newImgNode.height = "35";
    //newImgNode.width = "35";
    newTdNode.appendChild(newImgNode);
    newTrNode.appendChild(newTdNode);

    // fill the remaining columns with blanks
    newTextNode = document.createTextNode(" ");
    for(let column=2;column<tableHeaderNames.length; column++) {
      newTdNode = document.createElement("td");
      newTdNode.appendChild(newTextNode);
      newTrNode.appendChild(newTdNode);
    }

    // stick the new row into the table body
    document.getElementById("myFootieTableBody").appendChild(newTrNode);
  }

};

let populateTheChart = function() {
  for (let team in leagueClubs) {
    
  //if (leagueClubs.hasOwnProperty(leagueTable[row].club)) {
  //}

  // col 0
  let newTdNode0 = document.createElement("td");
  let newImgNode = document.createElement("img");
  newImgNode.src = leagueClubs[team].crest;
  newImgNode.height = "35";
    //newImgNode.width = "35";
    newTdNode0.appendChild(newImgNode);
    
    // cols 1-n
    for(let i=1; i<leagueClubs.lengt; i++) {  
      let newTdNode = document.createElement("td");
    let textNode1 = document.createTextNode(leagueClubs[team].name);
    newTdNode1.appendChild(textNode1);
    
    // col 2 points  
    let newTdNode2 = document.createElement("td");
    let textNode2 = document.createTextNode(leagueClubs[team].points); 
    newTdNode2.appendChild(textNode2);
      
    // col 3 
    let newTdNode3 = document.createElement("td");
      let textNode3 = document.createTextNode(team); 
      newTdNode3.appendChild(textNode3);

      let newRowNode = document.createElement("tr");
      newRowNode.appendChild(newTdNode0);
      newRowNode.appendChild(newTdNode1);
      newRowNode.appendChild(newTdNode2);
      newRowNode.appendChild(newTdNode3);

      document.getElementById("myFootieTableBody").appendChild(newRowNode);
    }
  }
};



constructTheTable();
console.log(leagueTable);
constructTheChart();

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
      let thisClubId = incomingObjectTeams.teams[team]["id"];
      let thisClub = {  "name":         incomingObjectTeams.teams[team]["shortName"],
                        "crest":        incomingObjectTeams.teams[team]["crestUrl"],
                        "played":       0,
                        "won":          0,
                        "drawn":        0,
                        "lost":         0,
                        "points":       0,
                        "goalsFor":     0,
                        "goalsAgainst": 0,
                        "goalDifference": 0,
                        "potentialPointsWorst": MIN_POINTS_AVAILABLE,
                        "potentialPointsBest":  MAX_POINTS_AVAILABLE,
                        "potentialFinishWorst": CLUBS_IN_LEAGUE,
                        "potentialFinishBest": 1,
                        "position":1999,
      };
      leagueClubs[thisClubId] = thisClub;
    }
    console.log(leagueClubs);
    console.log("longness = ",Object.keys(leagueClubs).length);
    //populateTheChart();
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
    
    // calculate points per club by parsing all match records
    for (let i=0; i<incomingObjectMatches.matches.length; i++) {
      let thisMatch = incomingObjectMatches.matches[i];
      //console.log("thisMatch is",thisMatch);
      let opstring = i+": "+thisMatch.homeTeam.name+" "+thisMatch.score.fullTime.homeTeam+"-"+thisMatch.score.fullTime.awayTeam+" "+thisMatch.awayTeam.name;
      //console.log(i,thisMatch.homeTeam.name,thisMatch.score.fullTime.homeTeam,"-",thisMatch.score.fullTime.awayTeam,thisMatch.awayTeam.name);
      //console.log(opstring);
    }

  // calculate each club's position and store in the record

  // insert the teams into the table in object order (meaningless)
  console.log("initial commit\n");
  console.log(leagueTable);
  let tableRow=0;
  for(let club in leagueClubs) {
    if (tableRow < leagueTable.length) {
      //console.log("cloob "+club+"\n");
      leagueTable[tableRow].position  = parseInt(leagueClubs[club].position,10)-parseInt(club,10);
      leagueTable[tableRow].club      = parseInt(club,10);
      leagueTable[tableRow].points    = leagueClubs[club].points;
      //console.log(leagueTable[tableRow]);
      tableRow++;
    } else {
      console.log("table row overflow\n");
    }
  }
  console.log(leagueTable);

  // sort the teams in the table and assign positions
  console.log("now sort\n")
  //leagueTable[i] = {"position":0, "club":-1, "points":0};    // no club assigned to this position

  });
});


