'use strict';

Game.controller('GameController', ['$scope', 'random', 'level', function($scope, random, level) {
  
  // Candy Ids.
  $scope.candiesVector = [0,1,2,3,4,5];
  
  // Game board with Ids.
  $scope.board = [];
  
  // Level data.
  $scope.level = {
    board: null,
    rows: null,
    columns: null,
    score: null,
    movesLeft: null,
    loaded: false
  }
  
  // Load level.
  level.load(function(response) {
    // set level datas
    $scope.level.board = response.board;
    $scope.level.rows = response.board.length;
    $scope.level.columns = response.board[0].length;
    $scope.level.score = 0;
    $scope.level.movesLeft = response.movesLeft;
    $scope.level.loaded = true;
    
    // Generate game board with candy Ids.
    for(var i = 0; i < $scope.level.rows; i++) {
      $scope.board[i] = [$scope.level.columns];
      for(var j = 0; j < $scope.level.columns; j++) {
        var randomCandy;
        // Make sure we don't have matches while generating:
        // Generate random candy on the current spot and check if 2 candies to the left or above are not the same.
        // Also check if we even need to generate candy in a spot defined by the level.board.
        if($scope.level.board[i][j] != 0) {
          do {
            randomCandy = random.range(0, $scope.candiesVector.length);
            $scope.board[i][j] = $scope.candiesVector[randomCandy];
          } while((i >= 2 &&
            $scope.board[i - 1][j] == $scope.candiesVector[randomCandy] &&
            $scope.board[i - 2][j] == $scope.candiesVector[randomCandy])
            ||
            (j >= 2 &&
            $scope.board[i][j - 1] == $scope.candiesVector[randomCandy] &&
            $scope.board[i][j - 2] == $scope.candiesVector[randomCandy]));
        } else {
          $scope.board[i][j] = -1;
        }
      }
    }

    // pPint out game board with candy Ids.
    console.log.apply(console, $scope.board);
  });
  
}]);
