'use strict';


// NOTE: same match in chains more than once? Double check this.

// Level class 
Game.factory('Level', ['random', 'Swap', 'Chain', '$routeParams', function(random, Swap, Chain, $routeParams) {
  function Level(data) {
    var candies = [data.ROWS]; // Actually: [data.ROWS][data.COLUMNS]
    
    var tiles = data.LAYOUT;
    
    var possibleSwaps = [];
    
    var possibleChains = [];
    
    this.shuffle = function() {
      var set = [];
      
      if($routeParams.debug) {
        // Test with predifined gameboard.
        set = createTestGameBoard();
        this.detectPossibleSwaps();
      } else {
        // In the very rare case that you end up with no possible swaps on the game board (try 3x3) try again.
        do {
          set = crateInitialCandies();
          this.detectPossibleSwaps();
        } while(possibleSwaps.length == 0);
      }
      
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
                
                // If both of them are a powerups
                if((candy.bonusType === 4 || other.bonusType === 4) || candy.bonusType && other.bonusType) {
                  var swap = new Swap();
                  swap.candyA = candy;
                  swap.candyB = other;
                  set.push(swap);
                  
                  var horizontalChain = new Chain();
                  horizontalChain.addCandy(candy);
                  horizontalChain.addCandy(other);
                  possibleChains.push(horizontalChain);
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
                
                // If both of them are powerups
                if((candy.bonusType === 4 || other.bonusType === 4) || candy.bonusType && other.bonusType) {
                  var swap = new Swap();
                  swap.candyA = candy;
                  swap.candyB = other;
                  set.push(swap);
                  
                  var verticalChain = new Chain();
                  verticalChain.addCandy(candy);
                  verticalChain.addCandy(other);
                  possibleChains.push(verticalChain);
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
    
    var removeDuplicates = function(arrayToRemoveFrom, arrayToRemove) {
      for(var i in arrayToRemoveFrom) {
        for(var j in arrayToRemove) {
          if(arrayToRemoveFrom[i] === arrayToRemove[j]) {
            arrayToRemoveFrom.splice(i, 1);
          }
        }
      }
    }
    
    var detectPowerupChains = function(powerups) {
      var set = [];
      var powerup = null;
      var newPowerups = []; // powerups we found in powerupchain and they need to be triggered.
      var allPowerups = []; // store all powerups to counter infinite loops
      
      do {
      
        for(var i in powerups) {
          powerup = powerups[i];
          var chain = new Chain();

          // Horizontally
          if(powerup.bonusType === 1) {
            for(var column = 0; column < data.COLUMNS; column++) {
              // Add all candies to chain except powerup (watch out for gaps).
              if(tiles[powerup.row][column]) {
                chain.candies.push(candies[powerup.row][column]);
                if(candies[powerup.row][column] !== powerup && candies[powerup.row][column].bonusType) {
                  newPowerups.push(candies[powerup.row][column]);
                }
              }

            }
          }

          // Vertically
          if(powerup.bonusType === 2) {
            for(var row = 0; row < data.ROWS; row++) {
              // Add all candies to chain except powerup.
              if(tiles[row][powerup.column]) {
                chain.candies.push(candies[row][powerup.column]);
                if(candies[row][powerup.column] !== powerup && candies[row][powerup.column].bonusType) {
                  newPowerups.push(candies[row][powerup.column]);
                }
              }
            }
          }

          // L Shape
          if(powerup.bonusType === 3) {
            for(var row = powerup.row - 1; row < powerup.row + 2; row++) {
              for(var column = powerup.column - 1; column < powerup.column + 2; column++) {
                // Add all candies to chain except powerup.
                if(row < data.ROWS && column < data.COLUMNS && tiles[row][column]) {
                  chain.candies.push(candies[row][column]);
                  if(candies[row][column] !== powerup && candies[row][column].bonusType) {
                    newPowerups.push(candies[row][column]);
                  }
                }
              }
            }
          }

          // Bomb NOTE: THis needs work! Doesnt work if it's triggered, not swapped
          if(powerup.bonusType === 4) {
            for(var row = 0; row < data.ROWS; row++) {
              for(var column = 0; column < data.COLUMNS; column++) {
                if(tiles[row][column] && candies[row][column].type === powerup.type) {
                  console.log(powerup.type);
                  chain.candies.push(candies[row][column]);
                }
              }
            }
          }

          chain.chainType = 'ChainTypePowerup';
          set.push(chain);
        }
        
        allPowerups = allPowerups.concat(powerups);
        powerups = newPowerups;
        removeDuplicates(powerups, allPowerups);
        newPowerups = [];
        
      } while(powerups.length > 0);

      return set;
    }
    
    var bombSwappedWithCandy = function(bomb, candy) {
      var chain = new Chain();
      chain.chainType = 'ChainTypePowerup';
      
      chain.candies.push(bomb);
      for(var row = 0; row < data.ROWS; row++) {
        for(var column = 0; column < data.COLUMNS; column++) {
          if(tiles[row][column] && candies[row][column].type === candy.type) {
            chain.candies.push(candies[row][column]);
          }
        }
      }
      
      return chain;
    }
    
    var bombSwappedWithBomb = function() {
      var chain = new Chain();
      chain.chainType = 'ChainTypePowerup';
      
      for(var row = 0; row < data.ROWS; row++) {
        for(var column = 0; column < data.COLUMNS; column++) {
          if(tiles[row][column]) {
            chain.candies.push(candies[row][column]);
          }
        }
      }
      
      return chain;
    }
    
    var bombSwappedWithStriped = function(bomb, stripedCandy) {
      var chain = new Chain();
      chain.chainType = 'ChainTypePowerup';
      
      chain.candies.push(bomb);
      for(var row = 0; row < data.ROWS; row++) {
        for(var column = 0; column < data.COLUMNS; column++) {
          if(tiles[row][column] && candies[row][column].type === stripedCandy.type) {
            candies[row][column].bonusType = stripedCandy.bonusType;
            chain.candies.push(candies[row][column]);
          }
        }
      }
      
      return chain;
    }
    
    var bombSwappedWithWrapped = function(bomb, wrappedCandy) {
      var chain = new Chain();
      chain.chainType = 'ChainTypePowerup';
      
      do {
        var randomType = random.range(1, data.NUM_CANDY_TYPES);
      } while(randomType === wrappedCandy.type);
      
      chain.candies.push(bomb);
      for(var row = 0; row < data.ROWS; row++) {
        for(var column = 0; column < data.COLUMNS; column++) {
          if(tiles[row][column] && (candies[row][column].type === wrappedCandy.type || candies[row][column].type === randomType)) {
            chain.candies.push(candies[row][column]);
          }
        }
      }
      
      return chain;
    }
    
    var stripedSwappedWithStriped = function(stripes) {
      var chain = new Chain();
      chain.chainType = 'ChainTypePowerup';
      
      for(var i in stripes) {
        // Horizontal
        if(stripes[i].bonusType === 1) {
          for(var column = 0; column < data.COLUMNS; column++) {
            if(tiles[stripes[i].row][column]) {
              chain.candies.push(candies[stripes[i].row][column]);
            }
          }
        }
        // Vertical
        if(stripes[i].bonusType === 2) {
          for(var row = 0; row < data.ROWS; row++) {
            if(tiles[row][stripes[i].column]) {
              chain.candies.push(candies[row][stripes[i].column]);
            }
          }
        }
      }
      
      return chain;
    }
    
    var stripedSwappedWithWrapped = function(stripedCandy, wrappedCandy) {
      var chain = new Chain();
      chain.chainType = 'ChainTypePowerup';
      
      // Horizontal
      for(var row = stripedCandy.row - 1; row <= stripedCandy.row + 1; row++) {
        if(row > 0 && row < data.ROWS) {
          for(var column = 0; column < data.COLUMNS; column++) {
            if(tiles[row][column]) {
              chain.candies.push(candies[row][column]);
            }
          }
        }
      }
      
      // Vertical
      for(var column = stripedCandy.column - 1; column <= stripedCandy.column + 1; column++) {
        if(column > 0 && column < data.COLUMNS) {
          for(var row = 0; row < data.ROWS; row++) {
            if(tiles[row][column]) {
              chain.candies.push(candies[row][column]);
            }
          }
        }
      }
      
      return chain;
    }
    
    var wrappedSwappedWidthWrapped = function(swap) {
      var chain = new Chain();
      chain.chainType = 'ChainTypePowerup';
      
      var wrappedCandy = null;
      var horizontalOffset = 0;
      var verticalOffset = 0;
      
      // Horizontal swap
      if(swap.candyA.column < swap.candyB.column) {
        wrappedCandy = swap.candyA;
        horizontalOffset = 1;
      } else if(swap.candyA.column > swap.candyB.column) {
        wrappedCandy = swap.candyB;
        horizontalOffset = 1;
      }
      
      // Vertical swap
      if(swap.candyA.row < swap.candyB.row) {
        wrappedCandy = swap.candyA;
        verticalOffset = 1;
      } else if(swap.candyA.row > swap.candyB.row) {
        wrappedCandy = swap.candyB;
        verticalOffset = 1;
      }
      
      for(var row = wrappedCandy.row - 2; row <= wrappedCandy.row + 2 + verticalOffset; row++) {
        for(var column = wrappedCandy.column - 2; column <= wrappedCandy.column + 2 + horizontalOffset; column++) {
          if(row > 0 && row < data.ROWS && column > 0 && column < data.COLUMNS && tiles[row][column]) {
            chain.candies.push(candies[row][column]);
          }
        }
      }
      
      return chain;
    }
    
    var detectSwapPowerupChains = function(swap) {
      var set = [];
      
      // Bomb with candy
      if(swap.candyA.bonusType === 4 && !swap.candyB.bonusType) {
        console.log('bomb and candy');
        set.push(bombSwappedWithCandy(swap.candyA, swap.candyB));
      }
      if(swap.candyB.bonusType === 4 && !swap.candyA.bonusType) {
        set.push(bombSwappedWithCandy(swap.candyB, swap.candyA));
      }
      
      // Bomb with bomb
      if(swap.candyA.bonusType === 4 && swap.candyB.bonusType === 4) {
        set.push(bombSwappedWithBomb());
        console.log('bomb width bomb');
      }
      
      // Bomb with striped
      if(swap.candyA.bonusType === 4 && (swap.candyB.bonusType === 1 || swap.candyB.bonusType === 2)) {
        set.push(bombSwappedWithStriped(swap.candyA, swap.candyB));
        console.log('bomb width striped');
      }
      if(swap.candyB.bonusType === 4 && (swap.candyA.bonusType === 1 || swap.candyA.bonusType === 2)) {
        set.push(bombSwappedWithStriped(swap.candyB, swap.candyA));
      }
      
      // Bomb with wrapped
      if(swap.candyA.bonusType === 4 && swap.candyB.bonusType === 3) {
        set.push(bombSwappedWithWrapped(swap.candyA, swap.candyB));
        console.log('bomb width wrapped');
      }
      if(swap.candyB.bonusType === 4 && swap.candyA.bonusType === 3) {
        set.push(bombSwappedWithWrapped(swap.candyB, swap.candyA));
      }
      
      // Striped with striped
      if((swap.candyA.bonusType === 1 || swap.candyA.bonusType === 2) && (swap.candyB.bonusType === 1 || swap.candyB.bonusType === 2)) {
        set.push(stripedSwappedWithStriped([swap.candyA, swap.candyB]));
      }
      
      // Striped with wrapped
      if((swap.candyA.bonusType === 1 || swap.candyA.bonusType === 2) && swap.candyB.bonusType === 3) {
        set.push(stripedSwappedWithWrapped(swap.candyA, swap.candyB));
      }
      if((swap.candyB.bonusType === 1 || swap.candyB.bonusType === 2) && swap.candyA.bonusType === 3) {
        set.push(stripedSwappedWithWrapped(swap.candyB, swap.candyA));
      }
      
      // Wrapped with wrapped
      if(swap.candyA.bonusType === 3 && swap.candyB.bonusType === 3) {
        set.push(wrappedSwappedWidthWrapped(swap));
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
      
      // Special case if it's a bomb.
      var swapPowerupChains = [];
      if(swap) {
        swapPowerupChains = detectSwapPowerupChains(swap);
      }
      
      console.log(swapPowerupChains);
      
      var horizontalChains = detectHorizontalMatches();
      var verticalChains = detectVerticalMatches();
      var lChains = detectLMatches(horizontalChains, verticalChains);

      
      var horizontalPowerups = detectPowerupInChains(horizontalChains);
      var verticalPowerups = detectPowerupInChains(verticalChains);
      var lPowerups = detectPowerupInChains(lChains);
      
      
      var horizontalPowerupChains = detectPowerupChains(horizontalPowerups);
      var verticalPowerupChains = detectPowerupChains(verticalPowerups);
      var lPowerupChains = detectPowerupChains(lPowerups);
      
      var swapPowerups = detectPowerupInChains(swapPowerupChains);
      var triggeredSwapPowerupChains = detectPowerupChains(swapPowerups);
      
      // get all powerup chains (duplicates)
      var allPowerupChains = horizontalPowerupChains.concat(verticalPowerupChains).concat(lPowerupChains).concat(swapPowerupChains).concat(triggeredSwapPowerupChains);
      
      // get all candies from these chains (duplicates)
      var allPowerupCandies= [];
      allPowerupChains.map(function(chain) {
        chain.candies.map(function(candy) {
          allPowerupCandies.push(candy);
        });
      });
      
      // remove duplicates
      var uniqueCandies = allPowerupCandies.filter(function(elem, pos) {
        return allPowerupCandies.indexOf(elem) == pos;
      });
      
      // create the unique powerup chain 
      var uniquePowerupChains = [];
      
      if(uniqueCandies.length > 0) {
        var chain = new Chain();
        chain.chainType = 'ChainTypePowerup';
        chain.candies = uniqueCandies;
        
        // Remove duplicates from other chains (hor, vert, L)
        horizontalChains.map(function(c) {
          c.candies.map(function(candy) {
            chain.removeCandy(candy);
          });
        });
        
        verticalChains.map(function(c) {
          c.candies.map(function(candy) {
            chain.removeCandy(candy);
          });
        });
        
        lChains.map(function(c) {
          c.candies.map(function(candy) {
            chain.removeCandy(candy);
          });
        });
        
        console.log(uniqueCandies);
        
        uniquePowerupChains.push(chain);
      }
      
      removeCandies(horizontalChains);
      removeCandies(verticalChains);
      removeCandies(lChains);
      
      removeCandies(uniquePowerupChains);
      
      
      calculateScores(horizontalChains);
      calculateScores(verticalChains);
      calculateScores(lChains);
      
      calculateScores(uniquePowerupChains);
      
      console.log(uniquePowerupChains);
      console.log(horizontalChains);
      console.log(verticalChains);
      
      return horizontalChains.concat(verticalChains).concat(lChains).concat(uniquePowerupChains);
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
          //console.log(candies[candy.row][candy.column]);
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
    
    this.comboMultiplier = 0;
    var me = this;
    
    this.resetComboMultiplier = function() {
      this.comboMultiplier = 0;
    } 
    
    var calculateScores = function(chains) {
      var chain = null;
      
      for(var i in chains) {
        chain = chains[i];
        chain.score = (data.BASE_SCORE + (20 * me.comboMultiplier)) * chain.candies.length;
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
          // Horizontal
          if(candies[i][j] === 6) {
            set.push(createCandyAtPosition(i,j,1,1));
          } else
          // Vertical
          if(candies[i][j] === 7) {
            set.push(createCandyAtPosition(i,j,1,2));
          } else
          // AOE
          if(candies[i][j] === 8) {
            set.push(createCandyAtPosition(i,j,1,3));
          } else
          // Bomb
          if(candies[i][j] === 9) {
            set.push(createCandyAtPosition(i,j,null,4));
          } else if(candies[i][j] !== 0){
            set.push(createCandyAtPosition(i,j,candies[i][j]));
          }
        }
      }
      
      return set;
    }
  }
  
  return Level;
}]);
