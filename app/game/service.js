'use strict';

Game.service('boardData', [function() {
  this.rows = 10;
  this.columns = 10;
  this.candies = [0,1,2,3,4,5];
  this.movesLeft = 15;
  this.score = 0;
}]);
Game.service('random', [function() {
  this.range = function(min, max) {
    return Math.floor((Math.random() * max) + min);
  }
}]);
