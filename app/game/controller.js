'use strict';

Game.controller('GameController', ['$scope', 'random', 'level', function($scope, random, level) {
  
  // Candy Ids.
  $scope.candiesVector = [0,1,2,3,4,5];
  
  // Game board with Ids.
  $scope.board = [];
  
  // Level data.
  $scope.level = {
    board: null,
    rows: null,
    columns: null,
    score: null,
    movesLeft: null,
    loaded: false
  }
  
  // Available chains.
  $scope.chains = [];
  
  // Available swaps.
  var validSwaps = [];
  
  // Load level.
  level.load(function(response) {
    // set level datas
    $scope.level.board = response.board;
    $scope.level.rows = response.board.length;
    $scope.level.columns = response.board[0].length;
    $scope.level.score = 0;
    $scope.level.movesLeft = response.movesLeft;
    $scope.level.loaded = true;
    
    generateBoard();
    
    // For easy testing.
    //$scope.board = $scope.level.board;

    // Print out game board with candy Ids.
    console.log.apply(console, $scope.board);
    
    buildMatchesVector();
  });
  
  // Generate game board with candy Ids.
  var generateBoard = function() {
    for(var i = 0; i < $scope.level.rows; i++) {
      $scope.board[i] = [$scope.level.columns];
      for(var j = 0; j < $scope.level.columns; j++) {
        var randomCandy;
        // Make sure we don't have matches while generating:
        // Generate random candy on the current spot and check if 2 candies to the left or above are not the same.
        // Also check if we even need to generate candy in a spot defined by the level.board.
        if($scope.level.board[i][j] != 0) {
          do {
            randomCandy = random.range(0, $scope.candiesVector.length);
            $scope.board[i][j] = $scope.candiesVector[randomCandy];
          } while((i >= 2 &&
            $scope.board[i - 1][j] == $scope.candiesVector[randomCandy] &&
            $scope.board[i - 2][j] == $scope.candiesVector[randomCandy])
            ||
            (j >= 2 &&
            $scope.board[i][j - 1] == $scope.candiesVector[randomCandy] &&
            $scope.board[i][j - 2] == $scope.candiesVector[randomCandy]));
        } else {
          $scope.board[i][j] = -1;
        }
      }
    }
  }
  
  //Build available swaps vector.
  var buildMatchesVector = function() {
    for(var i = 0; i < $scope.level.rows; i++) {
      for(var j = 0; j < $scope.level.columns; j++) {
        if($scope.board[i][j] != -1) {
          
          // If there is tile to the right and if it is a candy.
          if(j+1 < $scope.level.columns && $scope.board[i][j+1] != -1) {
            // Swap the current and the candy to the right.
            var original = $scope.board[i][j];
            $scope.board[i][j] = $scope.board[i][j+1];
            $scope.board[i][j+1] = original;
            
            //console.log.apply(console, $scope.board);

            // Check if we have a match in [i,j]
            var chain = detectMatches(i,j);
            if(chain) {
              chain.push([i,j+1]); // because we swapped!
              $scope.chains.push(chain);
              validSwaps.push([[i,j],[i,j+1]]);
              //console.log("match: " + "(" + i + ":" + j + ") <-> (" + i + ":" + (j+1) + ")");
              //console.log.apply(console, chain);
            }
            
            // Check if we have a match in [i,j+1]
            var chain = detectMatches(i,j+1);
            if(chain) {
              chain.push([i,j]); // because we swapped!
              $scope.chains.push(chain);
              validSwaps.push([[i,j],[i,j+1]]);
              //console.log("match: " + "(" + i + ":" + j + ") <-> (" + i + ":" + (j+1) + ")");
              //console.log.apply(console, chain);
            }
            
            // Swap it back.
            $scope.board[i][j+1] = $scope.board[i][j];
            $scope.board[i][j] = original;
            //console.log.apply(console, $scope.board);
          }
          
          // If there is tile to the bottom and if it is a candy.
          if(i+1 < $scope.level.rows && $scope.board[i+1][j] != -1) {
            // Swap the current and the candy to the bottom.
            var original = $scope.board[i][j];
            $scope.board[i][j] = $scope.board[i+1][j];
            $scope.board[i+1][j] = original;
            
            //console.log.apply(console, $scope.board);

            // Check if we have a match.
            var chain = detectMatches(i,j);
            if(chain) {
              chain.push([i+1,j]); // because we swapped!
              $scope.chains.push(chain);
              validSwaps.push([[i,j],[i+1,j]]);
              //console.log("match: " + "(" + i + ":" + j + ") <-> (" + (i+1) + ":" + j + ")");
              //console.log.apply(console, chain);
            }
            
            // Check if we have a match.
            var chain = detectMatches(i+1,j);
            if(chain) {
              chain.push([i,j]); // because we swapped!
              $scope.chains.push(chain);
              validSwaps.push([[i,j],[i+1,j]]);
              //console.log("match: " + "(" + i + ":" + j + ") <-> (" + (i+1) + ":" + j + ")");
              //console.log.apply(console, chain);
            }
            
            // Swap it back.
            $scope.board[i+1][j] = $scope.board[i][j];
            $scope.board[i][j] = original;
            //console.log.apply(console, $scope.board);
          }

        }
      }
    }
  }
  
  var detectMatches = function(a, b) {
    var horizontalMatches = 1;
    var verticalMatches = 1;
    var candyType = $scope.board[a][b];
    var chain = [];
    //console.log("candy type: "+candyType+" ("+a+":"+b+")");

    for(var i = b - 1; i >= 0 && $scope.board[a][i] == candyType; i--) {
      horizontalMatches++;
      chain.push([a,i]);
      //console.log("horizontal<< : ("+a+":"+i+")");
    }
    for(var i = b + 1; i < $scope.level.columns && $scope.board[a][i] == candyType; i++) {
      horizontalMatches++;
      chain.push([a,i]);
      //console.log("horizontal>> : ("+a+":"+i+")");
    }
    
    if(horizontalMatches >= 3) {
      return chain;
    } else {
      chain = [];
    }
    
    for(var j = a - 1; j >= 0 && $scope.board[j][b] == candyType; j--) {
      verticalMatches++;
      chain.push([j,b]);
      //console.log("vertival^^ : ("+j+":"+b+")");
    }
    for(var j = a + 1; j < $scope.level.rows && $scope.board[j][b] == candyType; j++) {
      verticalMatches++;
      chain.push([j,b]);
      //console.log("vertivalvv : ("+j+":"+b+")");
    }
    
    if(verticalMatches >= 3) {
      return chain;
    } else {
      chain = [];
    }
  }
  
  $scope.getSwapIndex = function(obj) {
    var v1;
    var v2;
    var s1 = obj[0];
    var s2 = obj[1];
    
    for(var i = 0; i < validSwaps.length; i++) {
      v1 = validSwaps[i][0];
      v2 = validSwaps[i][1];
      if(v1[0] == s1[0] && v1[1] == s1[1] && v2[0] == s2[0] && v2[1] == s2[1] || v1[0] == s2[0] && v1[1] == s2[1] && v2[0] == s1[0] && v2[1] == s1[1]) {
        // Update board and return the index.
        return i;
      }
    }
    
    return null;
  }
  
  
  $scope.removeChain = function(idx) {
    var chain = $scope.chains[idx];
    var pair;
    for(var i = 0; i < chain.length; i++) {
      pair = chain[i];
      $scope.board[pair[0]][pair[1]] = -2;
    }
  }

}]);
