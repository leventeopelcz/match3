'use strict';

Game.controller('GameController', ['$scope', 'file', 'Swap', 'Level', function($scope, file, Swap, Level) {
  
  // Level data.
  $scope.GAME_BOARD = {
    LAYOUT: null,
    ROWS: null,
    COLUMNS: null,
    SCORE: null,
    MOVES_LEFT: null,
    NUM_CANDY_TYPES: 5,
    BASE_SCORE: null
  }
  
  $scope.levelLoaded = false;
  
  // This is going to be our new level.
  $scope.level = null;
  
  $scope.movesLeft = null;
  
  $scope.score = null;
  
  // ==========================================================================
  
  // Load the JSON file that contains the level layout.
  file.load('level_test.json', function(response) {
    // Set global level data.
    $scope.GAME_BOARD.LAYOUT = response.layout;
    $scope.GAME_BOARD.ROWS = response.layout.length;
    $scope.GAME_BOARD.COLUMNS = response.layout[0].length;
    $scope.GAME_BOARD.SCORE = response.score;
    $scope.GAME_BOARD.MOVES_LEFT = response.movesLeft;
    $scope.GAME_BOARD.BASE_SCORE = response.baseScore;
    $scope.levelLoaded = true;
    
    $scope.movesLeft = response.movesLeft;
    $scope.score = response.score;

    // Instantiate our new level.
    $scope.level = new Level($scope.GAME_BOARD);
  });

}]);
