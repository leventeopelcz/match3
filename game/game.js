'use strict';

var Game = angular.module('Empower.game', ['ngRoute', 'angular.css.injector'])

Game.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/game', {
    templateUrl: 'game/game.html',
    controller: 'GameController'
  });
}]);
