'use strict';

// Level class 
Game.factory('Level', ['random', 'Swap', 'Chain', function(random, Swap, Chain) {
  function Level(data) {
    var candies = [data.ROWS]; // Actually: [data.ROWS][data.COLUMNS]
    
    var tiles = data.LAYOUT;
    
    var possibleSwaps = [];
    
    this.shuffle = function() {
      var set = [];
      
      // In the very rare case that you end up with no possible swaps on the game board (try 3x3) try again.
      do {
        set = crateInitialCandies();
        //set = createTestGameBoard();
        //logGameBoard();
        detectPossibleSwaps();
        
        /*
        for(var i = 0; i < possibleSwaps.length; i++) {
          console.log(possibleSwaps[i].describe());
        }
        */
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
      for(var i = column+1; i < data.COLUMNS && candies[row][i] && candies[row][i].type == candyType; i++) {
        horizontalMatches++;
        //console.log("horizontal>> : ("+row+":"+i+")");
      }
      
      for(var j = row-1; j >= 0 && candies[j][column] && candies[j][column].type == candyType; j--) {
        verticalMatches++;
        //console.log("vertival^^ : ("+j+":"+column+")");
      }
      for(var j = row+1; j < data.ROWS && candies[j][column] && candies[j][column].type == candyType; j++) {
        verticalMatches++;
        //console.log("vertivalvv : ("+j+":"+column+")");
      }
      
      return (verticalMatches >= 3 || horizontalMatches >= 3);
    }
    
    var detectPossibleSwaps = function() {
      var set = [];
      
      for(var row = 0; row < data.ROWS; row++) {
        for(var column = 0; column < data.COLUMNS; column++) {
          
          // If in current position there is a candy.
          var candy = candies[row][column];
          if(candy) {
            
            // Let's go horizontally.
            if(column < data.COLUMNS - 1) {
              
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
            if(row < data.ROWS - 1) {
              
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
      for(var i = 0; i < data.ROWS; i++) {
        candies[i] = [data.COLUMNS];
        for(var j = 0; j < data.COLUMNS; j++) {
          // Make sure we don't have matches while generating:
          // Generate random candy on the current spot and check if 2 spots to the left or above have candies and are not the same.
          // Also check if we even need to generate candy in a spot defined by tiles.
          if(tiles[i][j] == 1) {
            do {
              candyType = random.range(0, data.NUM_CANDY_TYPES);
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
    // CHAIN DETECTION
    //=========================================================================
    
    this.removeMatches = function() {
      var horizontalChains = detectHorizontalMatches();
      var verticalChains = detectVerticalMatches();
      
      /*
      for(var i = 0; i < horizontalChains.length; i++)
        console.log(horizontalChains[i].description());
      for(var i = 0; i < verticalChains.length; i++)
        console.log(verticalChains[i].description());
      */
      
      removeCandies(horizontalChains);
      removeCandies(verticalChains);
      
      return horizontalChains.concat(verticalChains);
    }
    
    var detectHorizontalMatches = function() {
      var set = [];
      
      for(var row = 0; row < data.ROWS; row++) {
        for(var column = 0; column < data.COLUMNS - 2; ) {
          
          if(candies[row][column]) {
            var matchType = candies[row][column].type;
            
            if(candies[row][column + 1] && candies[row][column + 1].type == matchType && 
               candies[row][column + 2] && candies[row][column + 2].type == matchType) {
              var chain = new Chain();
              chain.chainType = 'ChainTypeHorizontal';
              
              do {
                chain.addCandy(candies[row][column]);
                column += 1;
              } while(column < data.COLUMNS && candies[row][column] && candies[row][column].type == matchType);
              
              set.push(chain);
              continue;
            }
            
          }
          
          column += 1;
        }
      }
      return set;
    }
    
    var detectVerticalMatches = function() {
      var set = [];
      
      for(var column = 0; column < data.COLUMNS; column++) {
        for(var row = 0; row < data.ROWS - 2; ) {
          
          if(candies[row][column]) {
            var matchType = candies[row][column].type;
            
            if(candies[row + 1][column] && candies[row + 1][column].type == matchType && 
               candies[row + 2][column] && candies[row + 2][column].type == matchType) {
              var chain = new Chain();
              chain.chainType = 'ChainTypeVertical';
              
              do {
                chain.addCandy(candies[row][column]);
                row += 1;
              } while(row < data.ROWS && candies[row][column] && candies[row][column].type == matchType);
              
              set.push(chain);
              continue;
            }
            
          }
          
          row += 1;
        }
      }
      
      return set;
    }
    
    var removeCandies = function(chains) {
      for(var i = 0; i < chains.length; i++) {
        var cs = chains[i].getCandies();
        for(var j = 0; j < cs.length; j++) {
          var candy = cs[j];
          candies[candy.row][candy.column] = null;
        }
      }
    }
    
    //=========================================================================
    // UTILITY & TEST FUNCTIONS
    //=========================================================================
    
    // For easy logging of game board.
    var logGameBoard = function() {
      var board = [data.ROWS];
      for(var row = 0; row < data.ROWS; row++) {
        board[row] = [data.COLUMNS];
        for(var column = 0; column < data.COLUMNS; column++) {
          if(candies[row][column]) {
            board[row][column] = candies[row][column].type;
          } else {
            board[row][column] = null;
          }
        }
      }
      console.log.apply(console, board);
    }
    
    // instead of randomly generating the game board, we just read in the whole board with candies from a test JSON.
    var createTestGameBoard = function() {
      var set = [];
      candies = data.LAYOUT;
      
      for(var i = 0; i < data.ROWS; i++) {
        for(var j = 0; j < data.COLUMNS; j++) {
          set.push(createCandyAtPosition(i,j,candies[i][j]));
        }
      }
      
      return set;
    }
  }
  return Level;
}]);
