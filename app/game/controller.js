'use strict';

Game.controller('GameController', ['$scope', 'file', 'Swap', 'Level', function($scope, file, Swap, Level) {
  
  // Level data.
  $scope.GAME_BOARD = {
    LAYOUT: null,
    ROWS: null,
    COLUMNS: null,
    SCORE: null,
    MOVES_LEFT: null,
    NUM_CANDY_TYPES: 5
  }
  
  // Level loaded.
  $scope.levelLoaded = false;
  
  // This is going to be our new level.
  $scope.level = null;
  
  // ==========================================================================
  
  // Load the JSON file that contains the level layout.
  file.load('level.json', function(response) {
    // Set global level data.
    $scope.GAME_BOARD.LAYOUT = response.layout;
    $scope.GAME_BOARD.ROWS = response.layout.length;
    $scope.GAME_BOARD.COLUMNS = response.layout[0].length;
    $scope.GAME_BOARD.SCORE = response.score;
    $scope.GAME_BOARD.MOVES_LEFT = response.movesLeft;
    $scope.levelLoaded = true;

    // Instantiate our new level.
    $scope.level = new Level($scope.GAME_BOARD);
  });

}]);
