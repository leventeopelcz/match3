'use strict';

Game.controller('GameController', ['$scope', 'boardData', function($scope, boardData) {
  var rows = boardData.rows;
  var columns = boardData.columns;
  var candies = boardData.candies;
  
  // create the table
  $scope.board = [rows];
  
  for(var i = 0; i < rows; i++) {
    $scope.board[i] = [columns];
    for(var j = 0; j < columns; j++) {
      $scope.board[i][j] = candies[boardData.randomInt(0, candies.length)];
    }
  }
  
  // print out the table
  console.log.apply(console, $scope.board);
  
}]);
