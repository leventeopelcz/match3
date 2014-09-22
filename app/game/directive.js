'use strict';

Game.directive('game', [function() {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs) {
      
      var canvas = element[0];
      
      var candy = {
        sourceSize: 200,
        destinationSize: 60
      };
      
      // watch for level
      scope.$watch('level.loaded', function() {
        // if level loaded
        if(scope.level.loaded) {
          canvas.setAttribute('width', candy.destinationSize * scope.level.columns);
          canvas.setAttribute('height', candy.destinationSize * scope.level.rows);

          // if canvas supported
          if (canvas.getContext) {
            var ctx = canvas.getContext('2d'); // 2d canvas

            var candies = [];

            for(var i = 0; i < scope.candiesVector.length; i++) {
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
              for(var i = 0; i < scope.level.rows; i++) {
                for(var j = 0; j < scope.level.columns; j++) {
                  candies[scope.board[i][j]].draw(i*candy.destinationSize, j*candy.destinationSize);
                }
              }
            }, false);
            img.src = 'images/candies.png';

          } else {
            // canvas-unsupported code here
          }
        }
        
      });
      
    }
  };
}]);
