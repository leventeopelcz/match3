'use strict';

Game.controller('GameController', ['$scope', 'random', 'level', function($scope, random, level) {
  
  // candy Ids
  $scope.candiesVector = [0,1,2,3,4,5];
  
  // game board with Ids
  $scope.board = [];
  
  // level data
  $scope.level = {
    rows: null,
    columns: null,
    board: null,
    score: null,
    movesLeft: null,
    loaded: false
  }
  
  // load level
  level.load(function(response) {
    // set level datas
    $scope.level.rows = response.level.length;
    $scope.level.columns = response.level[0].length;
    $scope.level.board = [$scope.rows];
    $scope.level.score = 0;
    $scope.level.movesLeft = response.movesLeft;
    $scope.level.loaded = true;
    
    // generate game board with candy Ids
    for(var i = 0; i < $scope.level.rows; i++) {
      $scope.board[i] = [$scope.level.columns];
      for(var j = 0; j < $scope.level.columns; j++) {
        var randomCandy;
        // make sure we don't have matches while generating:
        // generate random candy on the current spot and check if 2 candies to the left or above are not the same.
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
      }
    }

    // print out game board with candy Ids
    console.log.apply(console, $scope.board);
  });
  
}]);
