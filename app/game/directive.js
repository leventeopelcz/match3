'use strict';

Game.directive('game', ['$window', function($window) {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs) {
      
      // Get Canvas.
      var canvas = new createjs.Stage(element[0]);
      
      // Candy Atlas
      var candyAtlasSrc = 'images/candies.png';
      
      // Define Candy source size from atlas.
      var candySourceSize = 200;
      
      // Candy scale for displaying.
      var candyScale = 1;
      
      // Max width of game board
      var maxBoardWidth = 600;
      
      // Watch for level.
      scope.$watch('level.loaded', function() {
        // If level loaded.
        if(scope.level.loaded) {
          levelLoaded();
        }
      });
      
      var levelLoaded = function() {
        // Get candy pixel size.
        if($window.innerWidth >= maxBoardWidth) {
          var candyDestinationSize = maxBoardWidth / scope.level.columns;
        } else {
          var candyDestinationSize = $window.innerWidth / scope.level.columns;
        }
        
        // Get candy scale.
        candyScale = candyDestinationSize / candySourceSize;
        
        // Set canavas size.
        element[0].setAttribute('width', candyDestinationSize * scope.level.columns);
        element[0].setAttribute('height', candyDestinationSize * scope.level.rows);
        
        // For holding the real candy objects.
        var candies = [];
        
        // Creating a vector of real candy objects.
        for(var i = 0; i < scope.candiesVector.length; i++) {
          var x = i * candySourceSize;
          var y = 0;
          var width = candySourceSize;
          var height = candySourceSize;
          
          candies[i] = new createjs.Bitmap(candyAtlasSrc);
          candies[i].sourceRect = new createjs.Rectangle(x, y, width, height);
        }
        
        var loadComplete = function() {
          for(var i = 0; i < scope.level.rows; i++) {
            for(var j = 0; j < scope.level.columns; j++) {
              if(scope.board[i][j] != -1) {
                var candyObj = new createjs.Bitmap(candyAtlasSrc);
                candyObj.sourceRect = candies[scope.board[i][j]].sourceRect;
                candyObj.x = j*candyDestinationSize;
                candyObj.y = i*candyDestinationSize;
                candyObj.scaleX = candyScale;
                candyObj.scaleY = candyScale;
                canvas.addChild(candyObj);
              }
            }
          }
          canvas.update();
        }
        
        var loader = new createjs.LoadQueue();
        loader.on('complete', loadComplete);
        loader.loadManifest([
           {id: 'candyAtlas', src:candyAtlasSrc}
        ]);
      }
      
    }
  };
}]);
