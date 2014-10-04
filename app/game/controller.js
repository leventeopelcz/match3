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
  
  // ==========================================================================
  
  // TODO: Unfinished!
  var fillHoles = function() {
    for(i = $scope.level.rows; i > 0; i--) {
      for(j = 0; j < $scope.level.columns; j++) {
        // If it's the board and an empty space.
        if($scope.board[i][j] != -1 && $scope.board[i][j] == -2) {
          // Scan for the next candy upwards.
          for(var scan = i-1; scan > 0; scan--) {
            // If it's a candy.
            if(scan >= 0) {
              $scope.board[i][j] = $scope.board[scan][j];
              $scope.board[scan][j] = -2;
            }
          }
        }
      }
    }
  }

}]);
