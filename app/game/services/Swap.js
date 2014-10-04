'use strict';

// Swap class 
Game.factory('Swap', [function() {
  var Swap = function() {
    this.candyA = null;
    this.candyB = null;

    this.describe = function() {
      return 'Swap '+this.candyA+ ' with '+this.candyB;
    }
  }
  return Swap;
}]);
