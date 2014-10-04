'use strict';

// Service for loading the level data from json.
Game.service('file', ['$http', function($http) {
  var httpConfig = {
    cache: true
  }; 
  this.load = function(filedir, callback) {
    $http.get(filedir, httpConfig).then(function(response) {
      callback(response.data);
    });
  }
}]);

// Utility service for random integer.
Game.service('random', [function() {
  this.range = function(min, max) {
    return Math.floor((Math.random() * max) + min);
  }
}]);


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
