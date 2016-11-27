'use strict';

// Chain class.
Game.service('Chain', [function() {
  var Chain = function() {
    this.candies = [];
    this.chainType = null;
    this.score = null;
    
    this.addCandy = function(candy) {
      if(!this.candies) {
        this.candies = [];
      }
      this.candies.push(candy);
    }
    
    this.getCandies = function() {
      return this.candies;
    }
    
    this.getCandy = function(index) {
      return this.candies[index];
    }
    
    this.removeCandy = function(candy) {
      for(var i in this.candies) {
        if(this.candies[i] === candy) {
          this.candies.splice(i, 1);
        }
      }
    }
    
    this.length = function() {
      return this.candies.length;
    }
    
    this.describe = function() {
      return '('+ this.chainType + '): ' + this.candies;
    }
  }
  return Chain;
}]);
