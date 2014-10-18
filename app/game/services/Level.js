'use strict';


// NOTE: same match in chains more than once? Double check this.

// Level class 
Game.factory('Level', ['random', 'Swap', 'Chain', function(random, Swap, Chain) {
  function Level(data) {
    var candies = [data.ROWS]; // Actually: [data.ROWS][data.COLUMNS]
    
    var tiles = data.LAYOUT;
    
    var possibleSwaps = [];
    
    var possibleChains = [];
    
    this.shuffle = function() {
      var set = [];
      
      // Uncomment to test with predifined gameboard.
      /*
      set = createTestGameBoard();
      this.detectPossibleSwaps();
      
      return set;
      */
      
      // In the very rare case that you end up with no possible swaps on the game board (try 3x3) try again.

      do {
        set = crateInitialCandies();
        this.detectPossibleSwaps();
      } while(possibleSwaps.length == 0);
      
      return set;
    }
    
    var hasChainAtPosition = function(row, column) {
      var candyType = candies[row][column].type;
      var horizontalMatches = 1;
      var verticalMatches = 1;
      var horizontalChain = new Chain();
      var verticalChain = new Chain();
      
      for(var i = column-1; i >= 0 && candies[row][i] && candies[row][i].type == candyType; i--) {
        horizontalMatches++;
        horizontalChain.addCandy(candies[row][i]);
        //console.log("horizontal<< : ("+row+":"+i+")");
      }
      for(var i = column+1; i < data.COLUMNS && candies[row][i] && candies[row][i].type == candyType; i++) {
        horizontalMatches++;
        horizontalChain.addCandy(candies[row][i]);
        //console.log("horizontal>> : ("+row+":"+i+")");
      }
      
      if(horizontalMatches >= 3) {
        horizontalChain.chainType = 'ChainTypeHorizontal';
        return horizontalChain;
      } else {
        horizontalChain = null;
      }
      
      for(var j = row-1; j >= 0 && candies[j][column] && candies[j][column].type == candyType; j--) {
        verticalMatches++;
        verticalChain.addCandy(candies[j][column]);
        //console.log("vertival^^ : ("+j+":"+column+")");
      }
      for(var j = row+1; j < data.ROWS && candies[j][column] && candies[j][column].type == candyType; j++) {
        verticalMatches++;
        verticalChain.addCandy(candies[j][column]);
        //console.log("vertivalvv : ("+j+":"+column+")");
      }
      
      if(verticalMatches >= 3) {
        verticalChain.chainType = 'ChainTypeVertical';
        return verticalChain;
      } else {
        verticalChain = null;
      }
    }
    
    this.detectPossibleSwaps = function() {
      var set = [];
      possibleChains = [];
      
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
                var chain = hasChainAtPosition(row, column + 1);
                if(chain) {
                  var swap = new Swap();
                  swap.candyA = candy;
                  swap.candyB = other;
                  set.push(swap);
                  
                  chain.addCandy(candies[row][column+1]);
                  possibleChains.push(chain);
                }
                
                var chain = hasChainAtPosition(row, column);
                if(chain) {
                  var swap = new Swap();
                  swap.candyA = candy;
                  swap.candyB = other;
                  set.push(swap);
                  
                  chain.addCandy(candies[row][column]);
                  possibleChains.push(chain);
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
                var chain = hasChainAtPosition(row + 1, column);
                if(chain) {
                  var swap = new Swap();
                  swap.candyA = candy;
                  swap.candyB = other;
                  set.push(swap);
                  
                  chain.addCandy(candies[row + 1][column]);
                  possibleChains.push(chain);
                }
                
                var chain = hasChainAtPosition(row, column);
                if(chain) {
                  var swap = new Swap();
                  swap.candyA = candy;
                  swap.candyB = other;
                  set.push(swap);
                  
                  chain.addCandy(candies[row][column]);
                  possibleChains.push(chain);
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
              candyType = random.range(1, data.NUM_CANDY_TYPES);
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
    
    var createCandyAtPosition = function(row, column, type, bonusType) {
      var candy = new createjs.Bitmap();
      candy.name = row + ':' + column;
      candy.row = row;
      candy.column = column;
      candy.type = type;
      candy.bonusType = (bonusType || null);
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
    // POWERUPS
    //=========================================================================
    
    this.findCorrectCandyInChain = function(chain, swap) {
      
      console.log(chain.candies);
      console.log(swap.candyA);
      console.log(swap.candyB);
      
      for(var i in chain.candies) {
        if(chain.candies[i] === swap.candyA) {
          return swap.candyA;
        }
        if(chain.candies[i] === swap.candyB) {
          return swap.candyB;
        }
      }
      return null;
    }
    
    this.addPowerup = function(chain, candy) {
      var bonusType = 0;
      
      console.log(chain.candies);
      console.log(candy);
        
      // Adding line sepcial
      if(chain.candies.length == 4) {
        if(chain.chainType == 'ChainTypeHorizontal') {
          bonusType = 1;
        }
        if(chain.chainType == 'ChainTypeVertical') {
          bonusType = 2;
        }
        candies[candy.row][candy.column] = createCandyAtPosition(candy.row, candy.column, candy.type, bonusType);
      }

      // Adding L special
      if((chain.candies.length == 5 || chain.candies.length == 6) && chain.chainType == 'ChainTypeL') {
        bonusType = 3;
        candies[candy.row][candy.column] = createCandyAtPosition(candy.row, candy.column, candy.type, bonusType);
      }

      // Adding bomb sepcial
      if(chain.candies.length >= 5 && (chain.chainType == 'ChainTypeHorizontal' || chain.chainType == 'ChainTypeVertical') ||
         chain.candies.length >= 7 && chain.chainType == 'ChainTypeL') {
        bonusType = 4;
        candies[candy.row][candy.column] = createCandyAtPosition(candy.row, candy.column, -1, bonusType);
      }
      
      return candies[candy.row][candy.column];
    }
    
    var detectPowerupChains = function(powerups) {
      var set = [];
      var powerup = null;
      
      for(var i in powerups) {
        powerup = powerups[i];
        var chain = new Chain();
        
        // Horizontally
        if(powerup.bonusType === 1) {
          for(var column = 0; column < data.COLUMNS; column++) {
            // Add all candies to chain except powerup (watch out for gaps).
            if(candies[powerup.row][column] !== powerup && tiles[powerup.row][column]) {
              chain.candies.push(candies[powerup.row][column]);
            }
          }
        }
        
        // Vertically
        if(powerup.bonusType === 2) {
          for(var row = 0; row < data.ROWS; row++) {
            // Add all candies to chain except powerup.
            if(candies[row][powerup.column] !== powerup  && tiles[row][powerup.column]) {
              chain.candies.push(candies[row][powerup.column]);
            }
          }
        }
        
        // L Shape
        if(powerup.bonusType === 3) {
          for(var row = powerup.row - 1; row < powerup.row + 2; row++) {
            for(var column = powerup.column - 1; column < powerup.column + 2; column++) {
              // Add all candies to chain except powerup.
              if(row < data.ROWS && column < data.COLUMNS && candies[row][column] !== powerup && tiles[row][column]) {
                chain.candies.push(candies[row][column]);
              }
            }
          }
        }
        
        // Bomb
        if(powerup.bonusType === 4) {
          for(var row = 0; row < data.ROWS; row++) {
            for(var column = 0; column < data.COLUMNS; column++) {
              // Add all candies to chain except powerup.
              // && candy.type === swipe.type
              if(candies[row][column] !== powerup && tiles[row][column]) {
                //chain.candies.push(candies[row][column]);
              }
            }
          }
        }
        
        chain.chainType = 'ChainTypePowerup';
        set.push(chain);
      }
   
      return set;
    }
    
    var detectPowerupInChains = function(chains) {
      var set = [];
      
      for(var i in chains) {
        var chain = chains[i];
        for(var j in chain.candies) {
          var candy = chain.candies[j];
          
          // If it's a special candy.
          if(candy.bonusType) {
            set.push(candy);
          }
          
        }
      }
      
      return set;
    }
    
    //=========================================================================
    // CHAIN DETECTION
    //=========================================================================
    
    this.removeMatches = function(swap) {
      var horizontalChains = detectHorizontalMatches();
      var verticalChains = detectVerticalMatches();
      var lChains = detectLMatches(horizontalChains, verticalChains);
      
      
      var horizontalPowerups = detectPowerupInChains(horizontalChains);
      var verticalPowerups = detectPowerupInChains(verticalChains);
      var lPowerups = detectPowerupInChains(lChains);
      
      var horizontalPowerupChains = detectPowerupChains(horizontalPowerups);
      var verticalPowerupChains = detectPowerupChains(verticalPowerups);
      var lPowerupChains = detectPowerupChains(lPowerups);
      
      
      removeCandies(horizontalChains);
      removeCandies(verticalChains);
      removeCandies(lChains);
      
      
      removeCandies(horizontalPowerupChains);
      removeCandies(verticalPowerupChains);
      removeCandies(lPowerupChains);
      
      
      calculateScores(horizontalChains);
      calculateScores(verticalChains);
      calculateScores(lChains);
      
      
      calculateScores(horizontalPowerupChains);
      calculateScores(verticalPowerupChains);
      calculateScores(lPowerupChains);
      
      console.log('==========================');
      
      return horizontalChains.concat(verticalChains).concat(lChains).concat(horizontalPowerupChains).concat(verticalPowerupChains).concat(lPowerupChains);
    }
    
    this.getRandomMatch = function() {
      var randomIndex = random.range(0, possibleChains.length);
      return possibleChains[randomIndex];
    }
    
    var detectLMatches = function(horizontalChains, verticalChains) {
      var set = [];
      
      var chain = null;
      for(var i = 0; i < horizontalChains.length; i++) {
        chain = horizontalChains[i].getCandies();
        for(var j = 0; j < chain.length; j++) {
          var obj = getChainContainingCandy(verticalChains, chain[j]);
          if(obj) {
            // We want to add chain not an array of 1 chain.
            var part2 = horizontalChains.splice(i,1)[0];
            
            var part1 = obj.chain;
            part1.removeCandy(obj.candy);
            part2.removeCandy(obj.candy);

            var lchain = new Chain();
            lchain.chainType = 'ChainTypeL';
            
            lchain.candies = part1.candies.concat(part2.candies);
            lchain.candies.push(obj.candy);
            
            set.push(lchain);
          }
        }
      }
      
      return set;
    }
    
    // TODO: better naming for this function
    var getChainContainingCandy = function(chains, candy) {
      var chain = null;
      for(var i = 0; i < chains.length; i++) {
        chain = chains[i].getCandies();
        for(var j = 0; j < chain.length; j++) {
          if(chain[j] === candy) {
            // We want to return a chain not an array of 1 chain and the candy.
            return {
              'chain': chains.splice(i,1)[0],
              'candy': candy
            }
          }
        }
      }
      return null;
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
      for(var i in chains) {
        var chain = chains[i];
        for(var j in chain.candies) {
          var candy = chain.candies[j];
          candies[candy.row][candy.column] = null;
        }
      }
    }
    
    this.fillHoles = function() {
      var columns = [];
      
      for(var column = 0; column < data.COLUMNS; column++) {
        var array = null;
        for(var row = data.ROWS - 1; row >= 0; row--) {
          
          // If there should be a candy but there isn't.
          if(tiles[row][column] != 0 && !candies[row][column]) {
            for(var lookup = row - 1; lookup >= 0 ; lookup--) {
              
              var candy = candies[lookup][column];
              if(candy) {
                candies[lookup][column] = null;
                candies[row][column] = candy;
                candy.row = row;
                candy.name = row + ':' + candy.column;
                
                if(!array) {
                  array = [];
                  columns.push(array);
                }
                array.push(candy);
                
                break;
              }
              
            }
          }
          
        }
      }
      
      return columns;
    }
    
    this.topUpCandies = function() {
      var columns = [];
      var candyType = null;
      
      for(var column = 0; column < data.COLUMNS; column++) {
        var array = null;
        for(var row = 0; row < data.ROWS && !candies[row][column]; row++) {
          
          if(tiles[row][column] != 0) {
            // Don't be the same type as the last one to prevent too many freebie matches.
            do {
              var newCandyType = random.range(1, data.NUM_CANDY_TYPES);
            } while(newCandyType === candyType);
            
            candyType = newCandyType;
            
            var candy = createCandyAtPosition(row, column, candyType);
            
            if(!array) {
              array = [];
              columns.push(array);
            }
            array.push(candy);
          }
          
        }
      }
      
      return columns;
    }
    
    //=========================================================================
    // SCORES
    //=========================================================================
    
    this.comboMultiplier = 1;
    var me = this;
    
    this.resetComboMultiplier = function() {
      this.comboMultiplier = 1;
    } 
    
    var calculateScores = function(chains) {
      var chain = null;
      
      for(var i in chains) {
        chain = chains[i];
        chain.score = data.BASE_SCORE * me.comboMultiplier * chain.candies.length;
        me.comboMultiplier++;
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
            board[row][column] = -1;
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
