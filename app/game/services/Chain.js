'use strict';

// Chain class.
Game.service('Chain', [function() {
  var Chain = function() {
    var candies = null;
    this.chainType = null;
    this.score = null;
    
    this.addCandy = function(candy) {
      if(!candies) {
        candies = [];
      }
      candies.push(candy);
    }
    
    this.getCandies = function() {
      return candies;
    }
    
    this.getCandy = function(index) {
      return candies[index];
    }
    
    this.length = function() {
      return candies.length;
    }
    
    this.description = function() {
      return '('+ this.chainType + '): ' + candies;
    }
  }
  return Chain;
}]);
