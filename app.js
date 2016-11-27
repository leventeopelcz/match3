'use strict';

// Declare app level module which depends on views, and components
angular.module('Empower', [
  'ngRoute',
  'Empower.game'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/game'});
}]);
