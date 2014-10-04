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
    
    var possibleSwaps = [];
    
    this.shuffle = function() {
      var set = [];
      
      // In the very rare case that you end up with no possible swaps on the game board (try 3x3) try again.
      do {
        set = crateInitialCandies();
        //set = createTestGameBoard();
        //logGameBoard();
        detectPossibleSwaps();
        
        for(var i = 0; i < possibleSwaps.length; i++) {
          console.log(possibleSwaps[i].describe());
        }
      } while(possibleSwaps.length == 0);
      
      return set;
    }
    
    var hasChainAtPosition = function(row, column) {        
      var candyType = candies[row][column].type;
      var horizontalMatches = 1;
      var verticalMatches = 1;
      
      for(var i = column-1; i >= 0 && candies[row][i] && candies[row][i].type == candyType; i--) {
        horizontalMatches++;
        //console.log("horizontal<< : ("+row+":"+i+")");
      }
      for(var i = column+1; i < $scope.GAME_BOARD.COLUMNS && candies[row][i] && candies[row][i].type == candyType; i++) {
        horizontalMatches++;
        //console.log("horizontal>> : ("+row+":"+i+")");
      }
      
      for(var j = row-1; j >= 0 && candies[j][column] && candies[j][column].type == candyType; j--) {
        verticalMatches++;
        //console.log("vertival^^ : ("+j+":"+column+")");
      }
      for(var j = row+1; j < $scope.GAME_BOARD.ROWS && candies[j][column] && candies[j][column].type == candyType; j++) {
        verticalMatches++;
        //console.log("vertivalvv : ("+j+":"+column+")");
      }
      
      return (verticalMatches >= 3 || horizontalMatches >= 3);
    }
    
    var detectPossibleSwaps = function() {
      var set = [];
      
      for(var row = 0; row < $scope.GAME_BOARD.ROWS; row++) {
        for(var column = 0; column < $scope.GAME_BOARD.COLUMNS; column++) {
          
          // If in current position there is a candy.
          var candy = candies[row][column];
          if(candy) {
            
            // Let's go horizontally.
            if(column < $scope.GAME_BOARD.COLUMNS - 1) {
              
              // If there is a candy to the right.
              var other = candies[row][column + 1];
              if(other) {
                
                // Swap them.
                candies[row][column] = other;
                candies[row][column + 1] = candy;
                //logGameBoard();

                // Is either candy part of a chain?
                if(hasChainAtPosition(row, column + 1) || hasChainAtPosition(row, column)) {
                  var swap = new Swap();
                  swap.candyA = candy;
                  swap.candyB = other;
                  set.push(swap);
                  //console.log("added: "+swap.describe());
                }

                // Swap them back.
                candies[row][column] = candy;
                candies[row][column + 1] = other;
                //logGameBoard();
              }
            }
            
            
            // Let's go vertically.
            if(row < $scope.GAME_BOARD.ROWS - 1) {
              
              // If there is a candy to the bottom.
              var other = candies[row + 1][column];
              if(other) {
                
                // Swap them.
                candies[row][column] = other;
                candies[row + 1][column] = candy;
                //logGameBoard();
                
                // Is either candy part of a chain?
                if(hasChainAtPosition(row + 1, column) || hasChainAtPosition(row, column)) {
                  var swap = new Swap();
                  swap.candyA = candy;
                  swap.candyB = other;
                  set.push(swap);
                  //console.log("added: "+swap.describe());
                }
                
                // Swap them back.
                candies[row][column] = candy;
                candies[row + 1][column] = other;
                //logGameBoard();
              }
            }
            
            
          }
        }
      }
      
      possibleSwaps = set;
    }
    
    this.isPossibleSwap = function(swap) {
      return isArrayContainSwap(possibleSwaps, swap);
    }
    
    // This is basically '==' overloading on our Swap class.
    // Testing if an array of Swap objects contains a Swap object.
    var isArrayContainSwap = function(swapArray, swap) {
      var other = null;

      for(var i = 0; i < swapArray.length; i++) {
        other = swapArray[i];
        if(other.candyA.row == swap.candyA.row && 
           other.candyA.column == swap.candyA.column && 
           other.candyB.row == swap.candyB.row && 
           other.candyB.column == swap.candyB.column || 
           other.candyA.row == swap.candyB.row && 
           other.candyA.column == swap.candyB.column && 
           other.candyB.row == swap.candyA.row && 
           other.candyB.column == swap.candyA.column) {
          return true;
        }
      }
      
      return false;
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
          // Make sure we don't have matches while generating:
          // Generate random candy on the current spot and check if 2 spots to the left or above have candies and are not the same.
          // Also check if we even need to generate candy in a spot defined by tiles.
          if(tiles[i][j] == 1) {
            do {
              candyType = random.range(0, $scope.NUM_CANDY_TYPES);
            } while((i >= 2 &&
              tiles[i-1][j] &&
              candies[i-1][j].type == candyType &&
              tiles[i-2][j] &&
              candies[i-2][j].type == candyType)
              ||
              (j >= 2 &&
              tiles[i][j-1] &&
              candies[i][j-1].type == candyType &&
              tiles[i][j-2] &&
              candies[i][j-2].type == candyType));
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
    
    //=========================================================================
    // UTILITY & TEST FUNCTIONS
    //=========================================================================
    
    // For easy logging of game board.
    var logGameBoard = function() {
      var board = [$scope.GAME_BOARD.ROWS];
      for(var row = 0; row < $scope.GAME_BOARD.ROWS; row++) {
        board[row] = [$scope.GAME_BOARD.COLUMNS];
        for(var column = 0; column < $scope.GAME_BOARD.COLUMNS; column++) {
          board[row][column] = candies[row][column].type;
        }
      }
      console.log.apply(console, board);
    }
    
    // instead of randomly generating the game board, we just read in the whole board with candies from a test JSON.
    var createTestGameBoard = function() {
      var set = [];
      candies = $scope.GAME_BOARD.LAYOUT;
      
      for(var i = 0; i < $scope.GAME_BOARD.ROWS; i++) {
        for(var j = 0; j < $scope.GAME_BOARD.COLUMNS; j++) {
          set.push(createCandyAtPosition(i,j,candies[i][j]));
        }
      }
      
      return set;
    }

  }
  
  // ==========================================================================
  
  // Available chains.
  //$scope.chains = [];
  
  // Available swaps.
  //var validSwaps = [];
  
  
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
