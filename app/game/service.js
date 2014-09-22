'use strict';

Game.service('boardData', [function() {
  this.rows = 10;
  this.columns = 10;
  this.candies = [0,1,2];
  
  //utilities
  
  // random Integer
  this.randomInt = function (min, max) {
    return Math.floor((Math.random() * max) + min);
  };
  
}]);
