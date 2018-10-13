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
let leagueClubs = [];     // sparse array indexed by clubId
let leagueClubIndex = []; // compressed directory of ids
let leagueStandings = []; // {id, points, position} sorted into postional order (position might not be unique)
let compressedGrid = [];  // always in clubId order

// compressedGrid structure:
//
// 20 rows of home team
//   each row has 21 entries (19 opponents, self, [id,points] )
//      each entry is a two-element array [homeTeamPoints, awaayTeamPoints] aka [US, THEM]


// football-data.org API auth credential
let footballHeaders = new Headers();
footballHeaders.append("X-Auth-Token", "102c4a1fda584443861d8e3f4fe4096e");


let constructTheCompressedGrid = function() {
  for (let homeRow=0; homeRow<CLUBS_IN_LEAGUE; homeRow++) {
    let newGridRow = [];
    for (let awayColumn=0;awayColumn<CLUBS_IN_LEAGUE;awayColumn++) {
      if (awayColumn === homeRow) {
        newGridRow[awayColumn] = [0, 0]; // 0 points for playing against yourself
      } else {
        newGridRow[awayColumn] = leagueClubs[leagueClubIndex[homeRow]].results[leagueClubIndex[awayColumn]]; 
      }
    }
    compressedGrid[homeRow] = newGridRow;
  }
};


// copy grid of known structure (array[20] of array[20] of array[2])
let deepCopyGrid = function(gridToCopy) {
  let newGrid = [];
  let rowCount = gridToCopy.length;
  let matchCount = gridToCopy[0].length;  // includes the extra entry [id, points]
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


let generatePaddedNames = function() {
  let maxNameLength = 0;
  for (let club in leagueClubs) {
    if (leagueClubs[club].name.length > maxNameLength) {
      maxNameLength = leagueClubs[club].name.length;
    }
  }
  //console.log(maxNameLength,"longest name letters");
  for (let club in leagueClubs) {
    let padSize = maxNameLength - leagueClubs[club].name.length + 1;
    let paddedName = new Array(padSize).join(" ")+leagueClubs[club].name;
    leagueClubs[club].paddedName = paddedName;
  }
};


let populateTheChart = function() {
  let myTableBody = document.getElementById("myFootieTableBody");
  let myTableRows = myTableBody.getElementsByTagName("tr");
  for (let row=0; row<CLUBS_IN_LEAGUE; row++) {  
    let currentRow = myTableRows[row];
    let myRowCells = currentRow.getElementsByTagName("td");

    // put position in col 0
    myRowCells[0].innerHTML = leagueStandings[row].position;    
    if (leagueClubs.hasOwnProperty(leagueStandings[row].clubId)) {
      let currentClub = leagueClubs[leagueStandings[row].clubId];
      
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


let compareFunction_sortStandingsByPoints = function(a,b) {
  let clubA = leagueClubs[a.clubId];
  let clubB = leagueClubs[b.clubId];

  if (clubB.points !== clubA.points) {
    return (clubB.points - clubA.points);
  } else {
    if (clubB.goalDifference !== clubA.goalDifference) {
      return (clubB.goalDifference - clubA.goalDifference);
    } else {
      return (clubB.goalsFor - clubA.goalsFor);
    }
  }
}


let calculateStandings = function(grid) {
  let newStandings = [];
  // from a grid of results, work out points per club... 
  for (let row=0; row<CLUBS_IN_LEAGUE; row++) {
    let clubPoints = 0;
    for (let column=0; column<CLUBS_IN_LEAGUE; column++) {
      if (grid[row][column] != null) {          // (== null) comparision matches undefined
        clubPoints += grid[row][column][US];    // add home game points
      }
      if (grid[column][row] != null) {          // (== null) comparision matches undefined
        clubPoints += grid[column][row][THEM];  // add away game points
      }
    }
    newStandings[row] = {"clubId":   leagueClubIndex[row],
                         "position": -1,
                         "points":   clubPoints};
  }

  // then sort using EPL tie-breaker rules into position order
  newStandings.sort(compareFunction_sortStandingsByPoints);

  // and from that, generate positional information
  // for now this is just matching the ordering from the sort, but 2= etc. could be possible
  for (let row=0; row<CLUBS_IN_LEAGUE; row++) {
    newStandings[row].position = row+1;
  }

  return newStandings;
};


let compareFunction_sortLeagueClubsByPoints = function(a,b) { 
  // compares two LeagueTable entries
  if (b.points !== a.points) {
    return (b.points - a.points)
  } else {
    if (b.goalDifference !== a.goalDifference) {
      return (b.goalDifference - a.goalDifference)
    } else {
      return (b.goalsFor - a.goalsFor);
    }
  }
};


let compareFunction_sortGridByPoints = function(a,b) {
  // compares two compressedGrid entries
  return (b[CLUBS_IN_LEAGUE][POINTS] - a[CLUBS_IN_LEAGUE][POINTS]);
  // ot looking at goal difference etc. as this is not simulated; can adjust GD arbitrarily.
}; 


//=================================================
// begin execution here
//=================================================

constructTheChart();    // basic html table setup

// construct dictionary object of club objects
// and build the 20x20x2 match grid
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
                        "paddedName": "TBD",
      };
      leagueClubs[thisClubId] = thisClub;       // add the club to the clubs collection
      leagueClubIndex.push(thisClubId);         // make list of club ids. to be sorted later
    }
    generatePaddedNames();
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
    leagueClubIndex.sort(function(a,b) { return (parseInt(a) - parseInt(b)) });    // numeric sort
    constructTheCompressedGrid();     // id order

    leagueStandings = calculateStandings(compressedGrid);

    // let's see it in the console
    console.log("\nleagueStandings after sort");
    let dummyTable1 = JSON.parse(JSON.stringify(leagueStandings));
    console.log(dummyTable1);

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
    //console.log("\ncompressedGrid:");
    //console.log(compressedGrid);
    //printGrid(compressedGrid);

    // 2. for each club...
    for (let clubUnderTest=3;clubUnderTest===3;clubUnderTest++) {
    //for (let clubUnderTest=0;clubUnderTest<compressedGrid.length;clubUnderTest++) {
      let perfectGrid = deepCopyGrid(compressedGrid);
      //let homeGames = perfectGrid[clubUnderTest];
      //let awayGames = perfectGrid.map( x => x[clubUnderTest]);
      let inYourDreams = 0;

      // set remainder of season to perfect
      for (let opponent=0; opponent<CLUBS_IN_LEAGUE; opponent++) {   // -1 because don't look at the [id, points] entry
        

        //if (homeGames[opponent] == null) {                          // home game not played yet...
        //  homeGames[opponent] = [POINTS_PER_WIN, POINTS_PER_LOSS];  // claim future home win
        
        if (perfectGrid[clubUnderTest][opponent] == null) {                           // home game not played yet...
          perfectGrid[clubUnderTest][opponent] = [POINTS_PER_WIN, POINTS_PER_LOSS];   // claim future home win


        }


        //if (awayGames[opponent] == null) {                          // away game not played yet...
        //  awayGames[opponent] = [POINTS_PER_LOSS, POINTS_PER_WIN];  // claim future away win
        
        if (perfectGrid[opponent][clubUnderTest] == null) {                         // away game not played yet...
          perfectGrid[opponent][clubUnderTest] = [POINTS_PER_LOSS, POINTS_PER_WIN]; // claim future away win


        }
        //inYourDreams += homeGames[opponent][US];
        //inYourDreams += awayGames[opponent][THEM];
        inYourDreams += perfectGrid[clubUnderTest][opponent][US];
        inYourDreams += perfectGrid[opponent][clubUnderTest][THEM];
      }
      //perfectGrid[clubUnderTest][CLUBS_IN_LEAGUE][POINTS] = inYourDreams;
      //calculateGridPoints(perfectGrid);

      //let thisClubName = leagueClubs[compressedGrid[clubUnderTest][CLUBS_IN_LEAGUE][ID]].name;
      let thisClubName = leagueClubs[leagueClubIndex[clubUnderTest]].name;
      console.log("\nrow "+clubUnderTest+"  "+thisClubName+" could finish with "+inYourDreams+" points this season");
      console.log("\nperfectGrid unsorted:");
      let dummyTable3 = JSON.parse(JSON.stringify(perfectGrid));
      console.log(dummyTable3);
      //printGrid(dummyTable3);



      //perfectGrid = perfectGrid.sort(compareFunction_sortGridByPoints);

      // OH MY GOD need to juggle COLUMNS if we move rows around!!!
      // maybe I should stick with a sparse grid?
      
      console.log("\nperfectGrid after sort by points (ignoring GD):");
      let dummyTable4 = JSON.parse(JSON.stringify(perfectGrid));
      console.log(dummyTable4);

      //for (let i=0; i<perfectGrid.length; i++) {
      //  let thisClubName   = leagueClubs[perfectGrid[i][CLUBS_IN_LEAGUE][ID]].name;
      //  let thisClubPoints = [perfectGrid[i][CLUBS_IN_LEAGUE][POINTS]];
      //  console.log((i+1)+" "+thisClubName+" "+thisClubPoints);
      //}

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

      printGrid(perfectGrid);
    }

    // brute force exhaustive. THis will never finish.


    // redisplay with new info
    populateTheChart();


  });
});

//let maxNameLength = 0;



let printGrid = function(grid) {
  let row0 = grid[0];
  //let rowIdElement = row0.length-1;
  //let clubId0 = row0[rowIdElement][ID];
  let clubId0 = leagueClubIndex[0];
  let paddedLength = leagueClubs[clubId0].paddedName.length;
  
  let leftString = new Array(paddedLength+1).join(" ");

  for (let v=0; v<paddedLength; v++) {
    let newString = leftString;
    for (let row=0; row<grid.length; row++) {
      //let clubId = grid[row][rowIdElement][ID];
      let clubId = leagueClubIndex[row];
      newString = newString+"  "+leagueClubs[clubId].paddedName[v];
    }
    console.log(newString);
  }

  for (let row=0;row<grid.length;row++) {
    let currentRow = grid[row];
    //let clubId = currentRow[currentRow.length-1][ID];
    let clubId = leagueClubIndex[row];
    //console.log(leagueClubs[clubId].name);

    // now display points or '.' for self-self
    let currentResults = grid[row];
    let resultsCount = currentResults.length;//-1;    
    let homeResultsString = leagueClubs[clubId].paddedName;
    let awayResultsString = leftString+" ";
    for (let result=0; result<resultsCount; result++) {
      if (currentResults[result] == null) {
        homeResultsString = homeResultsString+"  "+"-";
        awayResultsString = awayResultsString+"  "+"-";
      } else {
        homeResultsString = homeResultsString+"  "+currentResults[result][US];
        awayResultsString = awayResultsString+"  "+currentResults[result][THEM];
      }
    }
    console.log(homeResultsString,"\n");
    console.log(awayResultsString,"\n");
  }
};


// time to refactor and redesign the data structures

// 1. Gather and Display current standings

// keep leagueClubs[ ] - source of baseline truth including points
//   - in clubId order

// construct leagueStandings from leagueClubs
//  - just a point-ordered list of clubIds
//  - no other data

// populate hhtml table from leagueClubs[ ] following leagueStandings order


// 2. Simulation

// construct compressedGrid[ ][ ]
//  - in clubId order

// foreach club -
  // deepcopy compressedGrid to PerfectGrid
  // award all remaining matches for club under test
  // calculate points -> perfectStandings[ ] w/ comparefunction

  // for each simulation heuristic
    // deepcopy perfectGrid to workingGrid
    // hack other club scores using perfectStandings data as guide
    // calculate points -> workingStandings
    // checktable for completeness
    // record club final standing
      // stop if 1st place is achieved


