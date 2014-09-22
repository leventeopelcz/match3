'use strict';

Game.controller('GameController', ['$scope', 'boardData', 'random', function($scope, boardData, random) {
  var rows = boardData.rows;
  var columns = boardData.columns;
  var candies = boardData.candies;
  
  // create the table
  $scope.board = [rows];
  
  for(var i = 0; i < rows; i++) {
    $scope.board[i] = [columns];
    for(var j = 0; j < columns; j++) {
      var randomCandy;
      do {
        randomCandy = random.range(0, candies.length);
        $scope.board[i][j] = candies[randomCandy];
      } while((i >= 2 &&
        $scope.board[i - 1][j] == candies[randomCandy] &&
        $scope.board[i - 2][j] == candies[randomCandy])
        ||
        (j >= 2 &&
        $scope.board[i][j - 1] == candies[randomCandy] &&
        $scope.board[i][j - 2] == candies[randomCandy]));
    }
  }
  
  // print out the table
  console.log.apply(console, $scope.board);
  
}]);
