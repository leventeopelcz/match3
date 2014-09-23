'use strict';

Game.directive('game', [function() {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs) {
      
      // Get Canvas.
      var canvas = element[0];
      
      // Define Candy source size from atlas and the size we would like it to show up on canvas.
      var candy = {
        sourceSize: 200,
        destinationSize: 60
      };
      
      // Watch for level.
      scope.$watch('level.loaded', function() {
        // If level loaded.
        if(scope.level.loaded) {
          // Set canvas size.
          // TODO: Make this responsive!
          canvas.setAttribute('width', candy.destinationSize * scope.level.columns);
          canvas.setAttribute('height', candy.destinationSize * scope.level.rows);

          // If canvas supported.
          if (canvas.getContext) {
            var ctx = canvas.getContext('2d'); // 2d canvas
            
            // For holding the real candy objects.
            var candies = [];
            
            // Creating a vector of real candy objects.
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
            
            // Specifying the image atlas.
            var img = new Image();
            img.src = 'images/candies.png';
            
            // If atlas loaded, draw the game board and candies on canvas.
            img.addEventListener("load", function() {
              for(var i = 0; i < scope.level.rows; i++) {
                for(var j = 0; j < scope.level.columns; j++) {
                  if(scope.board[i][j] != -1) {
                    candies[scope.board[i][j]].draw(j*candy.destinationSize, i*candy.destinationSize);
                  }
                }
              }
            }, false);

          } else {
            // canvas-unsupported code here
          }
        }
      });
      
    }
  };
}]);
