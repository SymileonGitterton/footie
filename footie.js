'use strict';

const LEICESTER_TESTER = true;
const SINGLES_CLUB = false;
const TABLE_DUMP = false;
const TEST_LEEWAY = 4;

const CLUB_ID_BURNLEY = 328;
const CLUB_ID_LEICESTER = 338;

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

const DOT_HEIGHT = 50;
const DOT_COUNT = 10;
const MINOR_DOT_COUNT = CLUBS_IN_LEAGUE;
const MINOR_DOT_HEIGHT = Math.floor(DOT_HEIGHT*(DOT_COUNT/MINOR_DOT_COUNT));

// global objects
let leagueClubs = [];     // sparse array indexed by clubId
let leagueClubIndex = []; // compressed directory of ids
let leagueStandings = []; // {id, points, position} sorted into postional order (position might not be unique)
let leagueGrid = [];      // always in clubId order

// compressed leagueGrid structure:
//
// 20 rows of home team
//   each row has 20 entries (19 opponents, self)
//      each entry is a two-element array [homeTeamPoints, awaayTeamPoints] aka [US, THEM]


// football-data.org API auth credential
let footballHeaders = new Headers();
footballHeaders.append("X-Auth-Token", "102c4a1fda584443861d8e3f4fe4096e");


let createDots = function() {
  for (let dot=0; dot<DOT_COUNT; dot++) {
    let newDotNode = document.createElement("img");
    newDotNode.src = "whiteDot.png";
    newDotNode.height = DOT_HEIGHT;
    newDotNode.id = "dot"+dot;
    document.getElementById("dots").appendChild(newDotNode);
  }
}

let populateDots = function(n) {
  let dotCounter = 0;
  if (n >= DOT_COUNT) {
    n = DOT_COUNT-1;
  }
  for (dotCounter=0; dotCounter<n; dotCounter++){
    let dotId = "dot"+dotCounter;
    let targetDotNode = document.getElementById(dotId);
    targetDotNode.src = "greenDot.png";
  }
  for ( ; dotCounter<DOT_COUNT; dotCounter++){
    let dotId = "dot"+dotCounter;
    let targetDotNode = document.getElementById(dotId);
    targetDotNode.src = "whiteDot.png";
  }
  populateMinorDots(0);
}

let createMinorDots = function() {
  for (let dot=0; dot<MINOR_DOT_COUNT; dot++) {
    let newDotNode = document.createElement("img");
    newDotNode.src = "whihteDot.png";
    newDotNode.height = MINOR_DOT_HEIGHT;
    newDotNode.id = "minordot"+dot;
    document.getElementById("minordots").appendChild(newDotNode);
  }
}


let populateMinorDots = function(n) {
  let dotCounter = 0;
  if (n >= MINOR_DOT_COUNT) {
    n = MINOR_DOT_COUNT-1;
  }
  for (dotCounter=0; dotCounter<n; dotCounter++){
    let dotId = "minordot"+dotCounter;
    let targetDotNode = document.getElementById(dotId);
    targetDotNode.src = "blueDot.png";
  }
  for ( ; dotCounter<MINOR_DOT_COUNT; dotCounter++){
    let dotId = "minordot"+dotCounter;
    let targetDotNode = document.getElementById(dotId);
    targetDotNode.src = "whiteDot.png";
  }
}


let constructTheCompressedGrid = function() {
  let newGrid = [];
  for (let homeRow=0; homeRow<CLUBS_IN_LEAGUE; homeRow++) {
    let newGridRow = [];
    for (let awayColumn=0;awayColumn<CLUBS_IN_LEAGUE;awayColumn++) {
      if (awayColumn === homeRow) {
        newGridRow[awayColumn] = [0, 0]; // 0 points for playing against yourself
      } else {
        newGridRow[awayColumn] = leagueClubs[leagueClubIndex[homeRow]].results[leagueClubIndex[awayColumn]]; 
      }
    }
    newGrid[homeRow] = newGridRow;
  }
    return newGrid;
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


let compareFunction_sortStandingsByPointsAndTieBreakers = function(a,b) {
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


let calculateStandings = function(grid, useTieBreakers) {
  let newStandings = [];
  // from a grid of results, work out points per club... 
  for (let row=0; row<CLUBS_IN_LEAGUE; row++) {
    let clubPoints = 0;
    let matchesPlayed = 0;
    for (let column=0; column<CLUBS_IN_LEAGUE; column++) {
      if (row !== column) {
        if (grid[row][column] != null) {          // (== null) comparision matches undefined
          clubPoints += grid[row][column][US];    // add home game points
          matchesPlayed++;
        }
        if (grid[column][row] != null) {          // (== null) comparision matches undefined
          clubPoints += grid[column][row][THEM];  // add away game points
          matchesPlayed++;
        }
      }
    }
    newStandings[row] = {"clubId":   leagueClubIndex[row],
                         "position": -1,
                         "points":   clubPoints,
                         "matchesPlayed": matchesPlayed};
  }

  if (useTieBreakers) {
    // then sort using EPL tie-breaker rules into position order
    newStandings.sort(compareFunction_sortStandingsByPointsAndTieBreakers);
  } else {
    newStandings.sort(function(a,b) {return (b.points - a.points) });
  }

  // and from that, generate positional information
  // for now this is just matching the ordering from the sort, but 2= etc. could be possible
  for (let row=0; row<CLUBS_IN_LEAGUE; row++) {
    newStandings[row].position = row+1;
  }

  return newStandings;
};


let printGrid = function(grid) {
  let row0 = grid[0];
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
    let clubId = leagueClubIndex[row];

    // now display points
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


let printStandings = function(standings) {
  for (let row=0; row<CLUBS_IN_LEAGUE; row++) {
    let clubName = leagueClubs[standings[row].clubId].paddedName;
    console.log(standings[row].position+" "+clubName+" "+standings[row].points);
  }
}


let highestOccurrence = function(standings, target) {
  let i = 0;
  for (i=0; i<standings.length; i++) {
    if (standings[i].points <= target) {
      break;
    }
  }
  return i;
};


let scheduledGamesCount = function(grid) {
  let unplayed = 0;
  for (let homeRow=0; homeRow<CLUBS_IN_LEAGUE; homeRow++) {
    for (let awayColumn=0; awayColumn<CLUBS_IN_LEAGUE; awayColumn++) {
      if (grid[homeRow][awayColumn] == null) {   // also matches undefined
        unplayed++;
      }
    }
  }
  return unplayed;
};


let floodWithDraws = function(grid) {
  for (let homeRow=0; homeRow<CLUBS_IN_LEAGUE; homeRow++) {
    for (let awayColumn=0; awayColumn<CLUBS_IN_LEAGUE; awayColumn++) {
      if (grid[homeRow][awayColumn] == null) {   // also matches undefined
        grid[homeRow][awayColumn] = [POINTS_PER_DRAW, POINTS_PER_DRAW];
      }
    }
  }
};



let reverseLookupStandings = function(standings, matchId) {
  // reverse lookup aheadClub in PerfectGrid
  let aheadClubIndex = -1;
  standings.forEach(function(item,index) {
    if (item.clubId === matchId) {
      aheadClubIndex = index;
    }
  });
  return aheadClubIndex;
};


//=================================================
// begin execution here
//=================================================

constructTheChart();    // basic html table setup
createMinorDots();
createDots();
populateDots(0);


// construct dictionary object of club objects
// and build the 20x20x2 match grid
fetch('https://api.football-data.org/v2/competitions/PL/teams', {
	      method: "GET",
        cache: "no-cache",
        headers: footballHeaders,
  })
  .then(function(response) {
    populateDots(1);
    return response.json();
  })
  .then(function(incomingObjectTeams) {
    populateDots(2);

    for (let team=0; team<incomingObjectTeams.teams.length;team++) {
      populateMinorDots(team+1);
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
    leagueGrid = constructTheCompressedGrid();
    leagueStandings = calculateStandings(leagueGrid, false);    // although there is no match data yet...
    populateTheChart();    // basic html table setup
  })
  .then(function() {
    populateDots(3);

    // now collect the match data
    fetch('https://api.football-data.org/v2/competitions/PL/matches', {
        method: "GET",
        cache: "no-cache",
        headers: footballHeaders,
    })
  .then(function(response) {
    populateDots(4);
    return response.json();
  })
  .then(function(incomingObjectMatches) {
    populateDots(5);

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
    leagueGrid = constructTheCompressedGrid();     // id order
    leagueStandings = calculateStandings(leagueGrid, true);   // consider goal difference etc.

    // min, max points are easy...
    for (let someClubId in leagueClubs) {
      let someClub = leagueClubs[someClubId];
      someClub.potentialPointsWorst = someClub.points;
      someClub.potentialPointsBest  = someClub.points + (POINTS_PER_WIN*(MATCHES_PER_CLUB-someClub.played));
    }

    populateDots(6);
    populateTheChart();   // now show it
    console.log(scheduledGamesCount(leagueGrid)+" games remain to be played this season");
    populateDots(7);


    //=================================================================
    // begin simulation
    //=================================================================

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


    console.log("\n1. find highest finish positions.")
    let bestJeanist = [];
    let worstJeanist = [];
    // for each club...



    //===============================================
    // invoke test environment
    //===============================================
    if (LEICESTER_TESTER) {

      // test data set featuring Leicester City
      let leicesterGridIndex = leagueClubIndex.indexOf(CLUB_ID_LEICESTER);
      let leicesterGrid = deepCopyGrid(leagueGrid);

      let matchesPlayedByLeicester = leagueClubs[CLUB_ID_LEICESTER].played;
      let matchesPlayedTarget = MATCHES_PER_CLUB-TEST_LEEWAY;
      console.log("club "+CLUB_ID_LEICESTER+" which should be "+leagueClubs[CLUB_ID_LEICESTER].name+" have played "+matchesPlayedByLeicester+" games in reality");

      for (let opponent=0; opponent<CLUBS_IN_LEAGUE; opponent++) {   
        if (leicesterGrid[leicesterGridIndex][opponent] == null) {                           // home game not played yet...
          leicesterGrid[leicesterGridIndex][opponent] = [POINTS_PER_WIN, POINTS_PER_LOSS];   // claim future home win
          if (++matchesPlayedByLeicester >= matchesPlayedTarget) {
            break;
          }
        }
        if (leicesterGrid[opponent][leicesterGridIndex] == null) {                         // away game not played yet...
          leicesterGrid[opponent][leicesterGridIndex] = [POINTS_PER_LOSS, POINTS_PER_WIN]; // claim future away win        
          if (++matchesPlayedByLeicester >= matchesPlayedTarget) {
            break;
          }
        }
      }
      console.log("now we think they have played "+matchesPlayedByLeicester+" games. In fantasy.\n");

      leagueGrid = deepCopyGrid(leicesterGrid);    // run algorithms with Nearly-Best Leicester Ever
      leagueStandings = calculateStandings(leagueGrid, true);   // consider goal difference etc.
      console.log("Reality Warp: Leicester Dream Future, less "+TEST_LEEWAY+" wins");
    }
    //===============================================



    let clubRangeStart = 0;
    let clubRangeLength = CLUBS_IN_LEAGUE;
    if (SINGLES_CLUB) {
      clubRangeStart = leagueClubIndex.indexOf(CLUB_ID_BURNLEY);
      clubRangeLength = clubRangeStart+1;
      //let testIndex = leagueClubIndex.indexOf(leagueStandings[14].clubId);
      console.log("club "+CLUB_ID_BURNLEY+" (row "+clubRangeStart+") "+leagueClubs[leagueClubIndex[clubRangeStart]].name+" has been selected\n\n");
      //for (let clubUnderTest=testIndex;clubUnderTest===testIndex;clubUnderTest++) {
    }


    //for (let clubUnderTest=0;clubUnderTest<CLUBS_IN_LEAGUE;clubUnderTest++) {
    for (let clubUnderTest=clubRangeStart;clubUnderTest<clubRangeLength;clubUnderTest++) {
    //if (0) {
      populateMinorDots(clubUnderTest);
      let perfectGrid = deepCopyGrid(leagueGrid);
      
      // set remainder of season to perfect
      let inYourDreams = 0;
      for (let opponent=0; opponent<CLUBS_IN_LEAGUE; opponent++) {   
        if (perfectGrid[clubUnderTest][opponent] == null) {                           // home game not played yet...
          perfectGrid[clubUnderTest][opponent] = [POINTS_PER_WIN, POINTS_PER_LOSS];   // claim future home win
        }
        if (perfectGrid[opponent][clubUnderTest] == null) {                         // away game not played yet...
          perfectGrid[opponent][clubUnderTest] = [POINTS_PER_LOSS, POINTS_PER_WIN]; // claim future away win
        }
        inYourDreams += perfectGrid[clubUnderTest][opponent][US];
        inYourDreams += perfectGrid[opponent][clubUnderTest][THEM];
      }
      let perfectStandings = calculateStandings(perfectGrid, false);    // ignoring goal difference



      // 1a. try giving all other games a draw.
      //make a working copy of the grid.
      let othersAllDrawGrid = deepCopyGrid(perfectGrid);
      floodWithDraws(othersAllDrawGrid);

      let othersAllDrawStandings = calculateStandings(othersAllDrawGrid, false);    // ignore goal difference
      let bestFinishAllDrawsIndex = highestOccurrence(othersAllDrawStandings, inYourDreams);
      let bestFinishAllDraws = bestFinishAllDrawsIndex+1;
      let thisClubId = leagueClubIndex[clubUnderTest];
      let thisClubName = leagueClubs[thisClubId].name;
      console.log(bestFinishAllDraws+"  ["+thisClubId+"] "+thisClubName+" (all draws) with "+inYourDreams+" points");
      bestJeanist[clubUnderTest] = bestFinishAllDraws;



      // 1b. try to move the clubs above ours down by changing some draws to losses
      // award corresponding wins to lowest-ranked opponents
      //if (bestFinishAllDrawsIndex > 0) {
      //if (0) {
      if (bestJeanist[clubUnderTest] > 0) {
        let mungingGrid = deepCopyGrid(perfectGrid);  // fresh copy, our club best, unplayed matches undefined
        let mungingStandings = calculateStandings(mungingGrid, false);

        // target each club that's ahead of us, starting with top of the table
        for (let aheadClubIndexInAllDraws=0; aheadClubIndexInAllDraws<bestFinishAllDrawsIndex;aheadClubIndexInAllDraws++) {
          let aheadClubId = othersAllDrawStandings[aheadClubIndexInAllDraws].clubId;
          let deficit = othersAllDrawStandings[aheadClubIndexInAllDraws].points - inYourDreams;
          let aheadClubIndexInPerfect = reverseLookupStandings(perfectStandings, aheadClubId);
          let aheadClubMatchesYetToPlay = MATCHES_PER_CLUB - perfectStandings[aheadClubIndexInPerfect].matchesPlayed;
          let aheadClubIndexInGrid = leagueClubIndex.indexOf(aheadClubId);

          console.log("  club "+aheadClubId+" ("+leagueClubs[aheadClubId].name+") is "+deficit+" ahead of us with "+aheadClubMatchesYetToPlay+" left to play - drag them down:");
          //console.log("   need to assign "+deficit+" games out of "+aheadClubMatchesYetToPlay+" remaining to play");



          // perfectGrid/standings has all wins for us, unplayed matches are undefined
          // workingGrid/standings has draws assigned to unplayed matches
          // mungingGrid is a copy of working grid but some losses will b e given before filling with draws.
          // grids are always in compressed id order (all the same order)
          // standings are always in points order (NOT all the same order)

          
          let victimGamesFound = 0;
          //while (victimGamesFound < deficit) {
          //for (let lossCounter=0; lossCounter<deficit; lossCounter++) {
            // find weakest opponent with unplayed game against aheadClub, and give it the win
            // we're looking at mungingGrid (initially same as perfectGrid, not yet flooded)

            // walk up standings from the bottom and see if they have played aheadClub, home and away
            for (let laggingClub=CLUBS_IN_LEAGUE-1;laggingClub>=0;laggingClub--) {
              let laggingClubId = mungingStandings[laggingClub].clubId;
              let laggingClubIndexInGrid = leagueClubIndex.indexOf(laggingClubId);
              let laggingClubAwayGame = mungingGrid[aheadClubIndexInGrid][laggingClubIndexInGrid];
              let laggingClubHomeGame = mungingGrid[laggingClubIndexInGrid][aheadClubIndexInGrid];

              if ((laggingClubHomeGame == undefined) || (laggingClubAwayGame == undefined)) {
                console.log("   club "+laggingClubId+" ("+leagueClubs[laggingClubId].name+") is weak, #"+laggingClub+" in PerfectStandings[]");
              }
              if (laggingClubHomeGame == undefined) {
                console.log("    giving #"+laggingClubId+" ("+leagueClubs[laggingClubId].name+") home win over #"+aheadClubId+" ("+leagueClubs[aheadClubId].name+")");
                mungingGrid[laggingClubIndexInGrid][aheadClubIndexInGrid] = [POINTS_PER_WIN, POINTS_PER_LOSS];  // award home win to the lagger
                victimGamesFound++;
                if (victimGamesFound >= deficit) {
                  break;
                }
              }
              if (laggingClubAwayGame == undefined) {
                console.log("    giving #"+laggingClubId+" ("+leagueClubs[laggingClubId].name+") away win at #"+aheadClubId+" ("+leagueClubs[aheadClubId].name+")");
                mungingGrid[aheadClubIndexInGrid][laggingClubIndexInGrid] = [POINTS_PER_LOSS, POINTS_PER_WIN];  // award home loss to the aheadClub
                victimGamesFound++;
                if (victimGamesFound >= deficit) {
                  break;
                }
              }
            }
          //}
          console.log("   "+victimGamesFound+" victim games found to pull "+leagueClubs[aheadClubId].name+" down. we'll see if that's enough.\n\n");

          mungingStandings = calculateStandings(mungingGrid, false);
          let bestFinishDragDownIndex = highestOccurrence(mungingStandings, inYourDreams);  // hopefully this came out higher now
          let bestFinishDragDown = bestFinishDragDownIndex+1;
          //let thisClubId = leagueClubIndex[clubUnderTest];
          //let thisClubName = leagueClubs[thisClubId].name;
          console.log(bestFinishDragDown+"  ["+thisClubId+"] "+thisClubName+" (dragdown) with "+inYourDreams+" points");
          bestJeanist[clubUnderTest] = bestFinishDragDown;
 

          if (TABLE_DUMP) {
            console.log("\nleagueGrid");
            printGrid(leagueGrid);
            console.log("\nleagueStandings");
            console.log(leagueStandings);
            console.log("\n\n");

            console.log("\nperfectGrid");
            printGrid(perfectGrid);
            console.log("\nperfectStandings");
            console.log(perfectStandings);
            console.log("\n\n");

            console.log("\nothersAllDrawGrid");
            printGrid(othersAllDrawGrid);
            console.log("\nothersAllDrawStandings");
            console.log(othersAllDrawStandings);
            console.log("\n\n");

            console.log("\nmungingGrid");
            printGrid(mungingGrid);
            console.log("\nmungingStandings");
            console.log(mungingStandings);
            console.log("\n\n");
          }

        }
        
      }

      // 1c. work down the table awarding just enough wins
      // ... if we didn't already get to 1st

      // perfectStandings contains the positional info for clubs based on current matchday standings
      // with our club given all yet-to-play wins
      //workingGrid = deepCopyGrid(perfectGrid);  // fresh copy, our club best, unplayed matches undefined
      //workingStandings = calculateStandings(workingGrid, false);

      if (bestJeanist[clubUnderTest] !== 1) {
        // starting with lowest clubs below ours, 
        // distribute wins until <= our club's points (then fill in with losses)
        // assign wins starting with highest-ranked opponets first (both home and away)

      }

    } // end of per-club consideration

    populateDots(8);

    // copy positional results into main data structure
    for (let clubUnderTest=0;clubUnderTest<CLUBS_IN_LEAGUE;clubUnderTest++) {
      leagueClubs[leagueClubIndex[clubUnderTest]].potentialFinishBest = bestJeanist[clubUnderTest];
    }

    populateTheChart();   // now show it
    populateDots(9);
    //console.log("\nleagueStandings\n",leagueStandings);
    //console.log("\nleagueClubIndex\n",leagueClubIndex);
    //console.log("\nleagueClubs\n",leagueClubs);
  });
});
