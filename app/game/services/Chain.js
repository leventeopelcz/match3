'use strict';

// Chain class.
Game.service('Chain', [function() {
  var Chain = function() {
    var candies = null;
    this.chainType = null;
    
    this.addCandy = function(candy) {
      if(!candies) {
        candies = [];
      }
      candies.push(candy);
    }
    
    this.getCandies = function() {
      return candies;
    }
    
    this.description = function() {
      return '('+ this.chainType + '): ' + candies;
    }
  }
  return Chain;
}]);
