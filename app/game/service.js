'use strict';

// Service for loading the level data from json.
Game.service('level', ['$http', function($http) {
  var httpConfig = {
    cache: true
  }; 
  this.load = function(callback) {
    $http.get('level.json', httpConfig).then(function(response) {
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
