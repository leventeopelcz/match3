'use strict';

Game.directive('game', ['boardData', function(boardData) {
  return {
    restrict: 'AE',
    controller: 'GameController',
    link: function(scope, element, attrs) {
      
      var canvas = element[0];
      
      var candy = {
        sourceSize: 200,
        destinationSize: 60
      };
      
      canvas.setAttribute('width', candy.destinationSize * boardData.columns);
      canvas.setAttribute('height', candy.destinationSize * boardData.columns);
      
      // if canvas supported
      if (canvas.getContext) {
        var ctx = canvas.getContext('2d'); // 2d canvas
        
        var candies = boardData.candies;
        
        for(var i = 0; i < candies.length; i++) {
          candies[i] = new function() {
            var x = i * candy.sourceSize;
            var y = 0;
            this.draw = function(posX, posY) {
              return ctx.drawImage(
                img,
                x,
                y,
                candy.sourceSize,
                candy.sourceSize,
                posX,
                posY,
                candy.destinationSize,
                candy.destinationSize);
            };
          }
        }

        var img = new Image();
        img.addEventListener("load", function() {
          for(var i = 0; i < boardData.rows; i++) {
            for(var j = 0; j < boardData.columns; j++) {
              candies[scope.board[i][j]].draw(i*candy.destinationSize, j*candy.destinationSize);
            }
          }
        }, false);
        img.src = 'images/candies.png';
        
      } else {
        // canvas-unsupported code here
      }

    }
  };
}]);

Game.directive('hud', ['boardData', function(boardData) {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs) {
      scope.movesLeft = boardData.movesLeft;
      scope.score = boardData.score;
    }
  };
}]);
