'use strict';

const CREST_HEIGHT = 30;

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
let matchGrid = [];

// football-data.org credential
let footballHeaders = new Headers();
footballHeaders.append("X-Auth-Token", "102c4a1fda584443861d8e3f4fe4096e");



let constructTheTable = function() {
  for(let i=0;i<CLUBS_IN_LEAGUE;i++) {
    leagueTable[i] = {"position":0, "club":-1};    // no club assigned to this position
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

    // always populate the 'position' colyume
    let newTdNode   = document.createElement("td");
    let newTextNode = document.createTextNode(leagueTable[row].position);
    newTdNode.appendChild(newTextNode);
    newTrNode.appendChild(newTdNode);

    // and the crest column
    newTdNode = document.createElement("td");
    let newImgNode = document.createElement("img");
    newImgNode.src = "EPL_logo.png";
    newImgNode.height = CREST_HEIGHT;
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
  let myTableBody = document.getElementById("myFootieTableBody");
  let myTableRows = myTableBody.getElementsByTagName("tr");
  for (let row=0; row<leagueTable.length; row++) {  
    let currentRow = myTableRows[row];
    let myRowCells = currentRow.getElementsByTagName("td");

    // put position in col 0
    myRowCells[0].innerHTML = leagueTable[row].position;    
    if (leagueClubs.hasOwnProperty(leagueTable[row].club)) {
      let currentClub = leagueClubs[leagueTable[row].club];
      
      // do the crest logo in cell 1
      let newTdNode = document.createElement("td");
      let newImgNode = document.createElement("img");
      newImgNode.src = currentClub.crest;
      newImgNode.height = CREST_HEIGHT;
      newTdNode.appendChild(newImgNode);
      myRowCells[1].replaceWith(newTdNode);
      
      // do the rest, columns 2-n
      for (let column=2;column<tableHeaderNames.length;column++) {
        let newTdNode = document.createElement("td");
        let newTextNode = document.createTextNode(currentClub[tableHeaderNames[column].colvalue]);
        newTdNode.appendChild(newTextNode);
        myRowCells[column].replaceWith(newTdNode);
      }
    }
  }
};


//=================================================
// begin execution here
//=================================================

constructTheTable();
constructTheChart();

// construct dictionary object of club objects
// and build the 20x20 match grid
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
    for (let team=0; team<incomingObjectTeams.teams.length;team++) {
      let thisClubId = incomingObjectTeams.teams[team]["id"];
      let thisClubResults = [];

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
                        "position": 0,
                        "results": thisClubResults,
      };
      leagueClubs[thisClubId] = thisClub;       // add the club to the clubs collection
      let homeClubFixtures = [];
      matchGrid[thisClubId] = homeClubFixtures;  // add a row to the results grid
    }
  })
  .then(function() {
    // now collect the match data
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

    // calculate goals and points per club by parsing all match records
    for (let i=0; i<incomingObjectMatches.matches.length; i++) {
      let thisMatch = incomingObjectMatches.matches[i];
      if (thisMatch.status === "FINISHED") {
        let home = leagueClubs[thisMatch.homeTeam.id];
        let away = leagueClubs[thisMatch.awayTeam.id];
        home.played += 1;
        away.played += 1;
        if (thisMatch.score.duration === "REGULAR") {
          home.goalsFor      += thisMatch.score.fullTime.homeTeam;
          home.goalsAgainst  += thisMatch.score.fullTime.awayTeam;
          away.goalsFor      += thisMatch.score.fullTime.awayTeam;
          away.goalsAgainst  += thisMatch.score.fullTime.homeTeam;
        }
        switch (thisMatch.score.winner) {
          case "HOME_TEAM":
            home.points += POINTS_PER_WIN;
            away.points += POINTS_PER_LOSS;
            home.results[away] = POINTS_PER_WIN;
            away.results[home] = POINTS_PER_LOSS;
            home.won += 1;
            away.lost += 1;
            break;
          case "AWAY_TEAM":
            home.points += POINTS_PER_LOSS;
            away.points += POINTS_PER_WIN;
            home.results[away] = POINTS_PER_LOSS;
            away.results[home] = POINTS_PER_WIN;
            home.lost += 1;
            away.won += 1;
            break;
          case "DRAW":
            home.points += POINTS_PER_DRAW;
            away.points += POINTS_PER_DRAW;
            home.results[away] = POINTS_PER_DRAW;
            away.results[home] = POINTS_PER_DRAW;
            home.drawn += 1;
            away.drawn += 1;
            break;
          default:
            break;
        }
        home.goalDifference = home.goalsFor-home.goalsAgainst;
        away.goalDifference = away.goalsFor-away.goalsAgainst;
      }
    }
    console.log("done collecing points etc.\n");

    // calculate max possible points - easy




    // insert the teams into the table in object order (meaningless), taking data from club record
    let tableRow=0;
    for(let club in leagueClubs) {
      if (tableRow < leagueTable.length) {
        leagueTable[tableRow].position  = parseInt(leagueClubs[club].position,10)-parseInt(club,10);
        leagueTable[tableRow].club      = parseInt(club,10);
        leagueTable[tableRow].points    = leagueClubs[club].points;
        tableRow++;
      } else {
        console.log("table row overflow\n");
      }
    }
    console.log("should be unsorted:");
    let logTable = JSON.parse(JSON.stringify(leagueTable)); // SERDES to take deep-copy snapshot
    console.log(logTable);  // otherwise console.log just queues the array, and later prints its final state 

    // then sort the teams in the table by points
    leagueTable.sort(function(a,b) { 
      if (leagueClubs[b.club].points !== leagueClubs[a.club].points) {
        return (leagueClubs[b.club].points - leagueClubs[a.club].points)
      } else {
        if (leagueClubs[b.club].goalDifference !== leagueClubs[a.club].goalDifference) {
          return (leagueClubs[b.club].goalDifference - leagueClubs[a.club].goalDifference)
        } else {
            return (leagueClubs[b.club].goalsFor - leagueClubs[a.club].goalsFor);
          }
        }
      });

    for (let i=0;i<leagueTable.length;i++) {
      leagueTable[i].position = i+1;
    }

    // should sort out case wen teams are truly equal through all tie-breakers

    // now show it
    populateTheChart();

    });
  });


