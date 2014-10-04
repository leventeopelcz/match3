'use strict';

Game.controller('GameController', ['$scope', 'random', 'file', 'Swap', function($scope, random, file, Swap) {
  
  // Number of candy types.
  $scope.NUM_CANDY_TYPES = 5;
  
  // Level data.
  $scope.GAME_BOARD = {
    LAYOUT: null,
    ROWS: null,
    COLUMNS: null,
    SCORE: null,
    MOVES_LEFT: null
  }
  
  // Level loaded.
  $scope.levelLoaded = false;
  
  // This is going to be our new level.
  $scope.level;
  
  // ==========================================================================
  
  // Load the JSON file that contains the level layout.
  file.load('level.json', function(response) {
    // Set global level data.
    $scope.GAME_BOARD.LAYOUT = response.layout;
    $scope.GAME_BOARD.ROWS = response.layout.length;
    $scope.GAME_BOARD.COLUMNS = response.layout[0].length;
    $scope.GAME_BOARD.SCORE = response.score;
    $scope.GAME_BOARD.MOVES_LEFT = response.movesLeft;
    $scope.levelLoaded = true;

    // Instantiate our new level.
    $scope.level = new Level();
  });
  
  // ==========================================================================
  // LEVEL CLASS
  // ==========================================================================
  
  // Level
  function Level() {
    var candies = [$scope.GAME_BOARD.ROWS]; // Actually: [$scope.GAME_BOARD.ROWS][$scope.GAME_BOARD.COLUMNS]
    var tiles = $scope.GAME_BOARD.LAYOUT;
    
    this.shuffle = function() {
      return crateInitialCandies();
    }
    
    this.candyAtPosition = function(row, column) {
      return candies[row][column];
    }
    
    this.tileAtPosition = function(row, column) {
      return tiles[row][column];
    }
    
    var crateInitialCandies = function() {
      var set = [];
      var candyType;
      for(var i = 0; i < $scope.GAME_BOARD.ROWS; i++) {
        candies[i] = [$scope.GAME_BOARD.COLUMNS];
        for(var j = 0; j < $scope.GAME_BOARD.COLUMNS; j++) {
          if(tiles[i][j] == 1) {
            candyType = random.range(0, $scope.NUM_CANDY_TYPES);
            set.push(createCandyAtPosition(i,j,candyType));
          } else {
            candies[i][j] = null;
          }
        }
      }
      return set;
    }
    
    var createCandyAtPosition = function(row, column, type) {
      var candy = new createjs.Bitmap();
      candy.name = row + ':' + column;
      candy.row = row;
      candy.column = column;
      candy.type = type;
      candies[row][column] = candy;
      return candy;
    }
    
    this.performSwap = function(swap) {
      var rowA = swap.candyA.row;
      var columnA = swap.candyA.column;
      var rowB = swap.candyB.row;
      var columnB = swap.candyB.column;
      
      candies[rowA][columnA] = swap.candyB;
      swap.candyB.row = rowA;
      swap.candyB.column = columnA;
      
      candies[rowB][columnB] = swap.candyA;
      swap.candyA.row = rowB;
      swap.candyA.column = columnB;
    }

  }
  
  // ==========================================================================
  
  // Score.
  //$scope.score = 0;
  
  // Moves left;
  //$scope.movesLeft;
  
  
  // Game board with Ids.
  //$scope.board = [];
  
  // Available chains.
  //$scope.chains = [];
  
  // Available swaps.
  //var validSwaps = [];
  
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
  
  //Build available swap pairs and chains.
  $scope.buildSwapsAndChains = function(canvas) {
    validSwaps = [];
    $scope.chains = [];
    for(var i = 0; i < $scope.level.rows; i++) {
      for(var j = 0; j < $scope.level.columns; j++) {
        if($scope.board[i][j] > -1) {
          
          // If there is tile to the right and if it is a candy.
          if(j+1 < $scope.level.columns && $scope.board[i][j+1] > -1) {
            // Swap the current and the candy to the right.
            var original = $scope.board[i][j];
            $scope.board[i][j] = $scope.board[i][j+1];
            $scope.board[i][j+1] = original;
            
            //console.log.apply(console, $scope.board);

            // Check if we have a match in [i,j]
            var chain = detectMatches(i,j, canvas);
            if(chain) {
              chain.push(canvas.getChildByName(i+':'+(j+1))); // because we swapped!
              $scope.chains.push(chain);
              validSwaps.push([canvas.getChildByName(i+':'+j), canvas.getChildByName(i+':'+(j+1))]);
              //console.log("match: " + "(" + i + ":" + j + ") <-> (" + i + ":" + (j+1) + ")");
              //console.log.apply(console, chain);
            }
            
            // Check if we have a match in [i,j+1]
            var chain = detectMatches(i,j+1, canvas);
            if(chain) {
              chain.push(canvas.getChildByName(i+':'+j)); // because we swapped!
              $scope.chains.push(chain);
              validSwaps.push([canvas.getChildByName(i+':'+j), canvas.getChildByName(i+':'+(j+1))]);
              //console.log("match: " + "(" + i + ":" + j + ") <-> (" + i + ":" + (j+1) + ")");
              //console.log.apply(console, chain);
            }
            
            // Swap it back.
            $scope.board[i][j+1] = $scope.board[i][j];
            $scope.board[i][j] = original;
            //console.log.apply(console, $scope.board);
          }
          
          // If there is tile to the bottom and if it is a candy.
          if(i+1 < $scope.level.rows && $scope.board[i+1][j] > -1) {
            // Swap the current and the candy to the bottom.
            var original = $scope.board[i][j];
            $scope.board[i][j] = $scope.board[i+1][j];
            $scope.board[i+1][j] = original;
            
            //console.log.apply(console, $scope.board);

            // Check if we have a match.
            var chain = detectMatches(i,j, canvas);
            if(chain) {
              chain.push(canvas.getChildByName((i+1)+':'+j)); // because we swapped!
              $scope.chains.push(chain);
              validSwaps.push([canvas.getChildByName(i+':'+j), canvas.getChildByName((i+1)+':'+j)]);
              //console.log("match: " + "(" + i + ":" + j + ") <-> (" + (i+1) + ":" + j + ")");
              //console.log.apply(console, chain);
            }
            
            // Check if we have a match.
            var chain = detectMatches(i+1,j, canvas);
            if(chain) {
              chain.push(canvas.getChildByName(i+':'+j)); // because we swapped!
              $scope.chains.push(chain);
              validSwaps.push([canvas.getChildByName(i+':'+j), canvas.getChildByName((i+1)+':'+j)]);
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
    //console.log(validSwaps);
    console.log.apply(console, $scope.board);
  }
  
  var detectMatches = function(a, b, canvas) {
    var horizontalMatches = 1;
    var verticalMatches = 1;
    var candyType = $scope.board[a][b];
    var chain = [];
    //console.log("candy type: "+candyType+" ("+a+":"+b+")");

    for(var i = b - 1; i >= 0 && $scope.board[a][i] == candyType; i--) {
      horizontalMatches++;
      chain.push(canvas.getChildByName(a+':'+i));
      //console.log("horizontal<< : ("+a+":"+i+")");
    }
    for(var i = b + 1; i < $scope.level.columns && $scope.board[a][i] == candyType; i++) {
      horizontalMatches++;
      chain.push(canvas.getChildByName(a+':'+i));
      //console.log("horizontal>> : ("+a+":"+i+")");
    }
    
    if(horizontalMatches >= 3) {
      return chain;
    } else {
      chain = [];
    }
    
    for(var j = a - 1; j >= 0 && $scope.board[j][b] == candyType; j--) {
      verticalMatches++;
      chain.push(canvas.getChildByName(j+':'+b));
      //console.log("vertival^^ : ("+j+":"+b+")");
    }
    for(var j = a + 1; j < $scope.level.rows && $scope.board[j][b] == candyType; j++) {
      verticalMatches++;
      chain.push(canvas.getChildByName(j+':'+b));
      //console.log("vertivalvv : ("+j+":"+b+")");
    }
    
    if(verticalMatches >= 3) {
      return chain;
    } else {
      chain = [];
    }
  }
  
  $scope.getSwapIndex = function(pair) {
    var v1;
    var v2;
    var s1 = pair[0];
    var s2 = pair[1];
    
    for(var i = 0; i < validSwaps.length; i++) {
      v1 = validSwaps[i][0];
      v2 = validSwaps[i][1];
      
      if(v1.row == s1.row && 
         v1.column == s1.column && 
         v2.row == s2.row && 
         v2.column == s2.column || 
         v1.row == s2.row && 
         v1.column == s2.column && 
         v2.row == s1.row && 
         v2.column == s1.column) {
        // Return index.
        return {index: i, type: v1.type};
      }
    }
    
    return null;
  }
  
  
  // TODO: Unfinished!
  var fillHoles = function() {
    for(i = $scope.level.rows; i > 0; i--) {
      for(j = 0; j < $scope.level.columns; j++) {
        // If it's the board and an empty space.
        if($scope.board[i][j] != -1 && $scope.board[i][j] == -2) {
          // Scan for the next candy upwards.
          for(var scan = i-1; scan > 0; scan--) {
            // If it's a candy.
            if(scan >= 0) {
              $scope.board[i][j] = $scope.board[scan][j];
              $scope.board[scan][j] = -2;
            }
          }
        }
      }
    }
  }

}]);
