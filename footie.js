'use strict';

const CREST_HEIGHT = 30;
const US = 0;
const THEM = 1;
const ID = US;
const POINTS = THEM;

const CLUBS_IN_LEAGUE = 20;
const OPPONENTS_IN_LEAGUE = CLUBS_IN_LEAGUE-1;
const MATCHES_PER_CLUB = 2*OPPONENTS_IN_LEAGUE;
const RELEGATION_THRESOLD = 18;

const POINTS_PER_WIN = 3;
const POINTS_PER_DRAW = 1;
const POINTS_PER_LOSS = 0;
const MAX_POINTS_AVAILABLE = 2*(OPPONENTS_IN_LEAGUE)*POINTS_PER_WIN;
const MIN_POINTS_AVAILABLE = 2*(OPPONENTS_IN_LEAGUE)*POINTS_PER_LOSS;

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
//let incomingObjectTeams = {};
//let incomingObjectMatches = {};
let compressedGrid = [];
let gridKeys = [];

// compressedGrid structure:
//
// 20 rows of home team
//   each row has 20 entries (19 opponents, self)
//      each entry is a two-element array [homeTeamPoints, awaayTeamPoints] aka [US, THEM]


// football-data.org credential
let footballHeaders = new Headers();
footballHeaders.append("X-Auth-Token", "102c4a1fda584443861d8e3f4fe4096e");


let constructTheCompressedGrid = function() {
  gridKeys = Object.keys(leagueClubs);
  for (let i=0;i<gridKeys.length;i++) {
    let someClubId = gridKeys[i];
    let someClub = leagueClubs[someClubId];
    
    // construct a results row for some club, using someClub.results
    let newGridRow = [];
    for (let away=0;away<gridKeys.length;away++) {
      if (i === away) {
        newGridRow[away] = [0, 0]; // 0 points for playing against yourself
      } else {
        newGridRow[away] = someClub.results[gridKeys[away]];
      }
    }
    newGridRow[gridKeys.length] = [someClubId,someClub.points];   // append id and points for later use
    compressedGrid[i] = newGridRow;                               // add the new row to the compressed grid
  }
}

// copy grid of known structure (array of array of arrays)
let deepCopyGrid = function(gridToCopy) {
  let newGrid = [];
  let rowCount = gridToCopy.length;
  let matchCount = gridToCopy[0].length;  // includes the extra entry [id, points]
  //let elementCount = gridToCopy[0][0].length;  // guaranteed to be a defined entry, it's a self-self
  for (let row=0; row<rowCount; row++) {
    let newRow = [];
    newGrid[row] = newRow;
    for (let match=0; match<matchCount; match++) {
      //console.log(row,match);
      if (gridToCopy[row][match] === undefined) {
        newGrid[row][match] = undefined;
      } else {
        newGrid[row][match] = gridToCopy[row][match].slice();
      }
    }
  }
  return(newGrid);
}


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
    let newTextNode = document.createTextNode(row);
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


let sortTableByPoints = function(a,b) { 
  if (leagueClubs[b.club].points !== leagueClubs[a.club].points) {
    return (leagueClubs[b.club].points - leagueClubs[a.club].points)
  } else {
    if (leagueClubs[b.club].goalDifference !== leagueClubs[a.club].goalDifference) {
      return (leagueClubs[b.club].goalDifference - leagueClubs[a.club].goalDifference)
    } else {
      return (leagueClubs[b.club].goalsFor - leagueClubs[a.club].goalsFor);
    }
  }
};


let sortGridByPoints = function(a,b) {
  clubIdA = a[CLUBS_IN_LEAGUE][ID];
  clubIdB = b[CLUBS_IN_LEAGUE][ID];
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
  .then(function(incomingObjectTeams) {
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
    }
  })
  .then(function() {
    // now collect the match data
    fetch('https://api.football-data.org/v2/competitions/PL/matches', {
        method: "GET",
        cache: "no-cache",
        headers: footballHeaders,
    })
  //}) // change?
  .then(function(response) {
    return response.json();
  })
  //.then(function(myJson) {
  .then(function(incomingObjectMatches) {
    // calculate goals and points per club by parsing all match records
    for (let i=0; i<incomingObjectMatches.matches.length; i++) {
      let thisMatch = incomingObjectMatches.matches[i];
      if (thisMatch.status === "FINISHED") {
        let homeId = thisMatch.homeTeam.id;
        let awayId = thisMatch.awayTeam.id;
        let home = leagueClubs[homeId];
        let away = leagueClubs[awayId];
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
            home.results[awayId] = [POINTS_PER_WIN, POINTS_PER_LOSS];
            home.won += 1;
            away.lost += 1;
            break;
          case "AWAY_TEAM":
            home.points += POINTS_PER_LOSS;
            away.points += POINTS_PER_WIN;
            home.results[awayId] = [POINTS_PER_LOSS, POINTS_PER_WIN];
            home.lost += 1;
            away.won += 1;
            break;
          case "DRAW":
            home.points += POINTS_PER_DRAW;
            away.points += POINTS_PER_DRAW;
            home.results[awayId] = [POINTS_PER_DRAW, POINTS_PER_DRAW];
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

    // then sort the teams in the table by points
    console.log("\nleagueTable unsorted:");
    let dummyTable1 = JSON.parse(JSON.stringify(leagueTable));
    console.log(dummyTable1);


    leagueTable.sort(sortTableByPoints);


    for (let i=0;i<leagueTable.length;i++) {
      leagueTable[i].position = i+1;
    }

    console.log("\nleagueTable after sort");
    let dummyTable2 = JSON.parse(JSON.stringify(leagueTable));
    console.log(dummyTable2);

    // should sort out case wen teams are truly equal through all tie-breakers?

    // now show it
    populateTheChart();

    // prepare for simulations
    constructTheCompressedGrid();
    //console.log(leagueClubs);
    //console.log(compressedGrid);

    // min, max points are easy...
    for (let someClubId in leagueClubs) {
      let someClub = leagueClubs[someClubId];
      someClub.potentialPointsWorst = someClub.points;
      someClub.potentialPointsBest  = someClub.points + (POINTS_PER_WIN*(MATCHES_PER_CLUB-someClub.played));
    }

    // redisplay with new info
    populateTheChart();

    // now simulate for worst position
    console.log("compressedGrid:");
    console.log(compressedGrid);

    // 2. for each club...
    for (let clubUnderTest=3;clubUnderTest===3;clubUnderTest++) {
    //for (let clubUnderTest=0;clubUnderTest<compressedGrid.length;clubUnderTest++) {
      let perfectGrid = deepCopyGrid(compressedGrid);
      let homeGames = perfectGrid[clubUnderTest];
      let awayGames = perfectGrid.map( x => x[clubUnderTest]);
      let inYourDreams = 0;

      // set remainder of season to perfect
      for (let opponent=0; opponent<(homeGames.length-1); opponent++) {   // -1 because don't look at the [id, points] entry
        if (homeGames[opponent] == null) {                          // home game not played yet...
          homeGames[opponent] = [POINTS_PER_WIN, POINTS_PER_LOSS];  // claim future home win
        }
        if (awayGames[opponent] == null) {                          // away game not played yet...
          awayGames[opponent] = [POINTS_PER_LOSS, POINTS_PER_WIN];  // claim future away win
        }
        inYourDreams += homeGames[opponent][US];
        inYourDreams += awayGames[opponent][THEM];
      }
      console.log(leagueClubs[gridKeys[clubUnderTest]].name+" (row "+clubUnderTest+") could finish with "+inYourDreams+" points this season");
      console.log("perfectGrid:");
      console.log(perfectGrid);
      perfectGrid = perfectGrid.sort(sortGridByPoints);
      // heuristic: try to get this club to #1
      // 0.  give this club all wins
      // ...evaluate and sort by points
      //
      // 1a. give all other matches a draw
      // ...evaluate and sort
      //    if we find this club at #1 stop
      //
      // else rebuild table withh our club all wins
      // ...evaluate and sort
      // work down the table. give wins to each row just enough to keep it behind our club, then losses


      // how to handle GD? only matters if we are first-equal.


    }

    // brute force exhaustive. THis will never finish.


    // redisplay with new info
    populateTheChart();

  });
});


