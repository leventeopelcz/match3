'use strict';

Game.directive('game', ['$window', 'random', '$timeout', function($window, random, $timeout) {
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
      
      // Get a random chain.
      var getRandomChain = function() {
        var randomIndex = random.range(0, scope.chains.length);
        return scope.chains[randomIndex];
      }
      
      // Level loaded.
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
        
        // A vector of the different candies.
        var candies = [];
        
        // Creating a vector of different candies.
        for(var i = 0; i < scope.candiesVector.length; i++) {
          var x = i * candySourceSize;
          var y = 0;
          var width = candySourceSize;
          var height = candySourceSize;
          
          candies[i] = new createjs.Bitmap(candyAtlasSrc);
          candies[i].sourceRect = new createjs.Rectangle(x, y, width, height);
        }
        
        // Populate board with candies.
        var populateBoard = function() {
          for(var i = 0; i < scope.level.rows; i++) {
            for(var j = 0; j < scope.level.columns; j++) {
              if(scope.board[i][j] != -1) {
                var candyObj = new createjs.Bitmap(candyAtlasSrc);
                candyObj.name = i+':'+j;
                candyObj.sourceRect = candies[scope.board[i][j]].sourceRect;
                candyObj.x = j*candyDestinationSize;
                candyObj.y = i*candyDestinationSize;
                candyObj.scaleX = candyScale;
                candyObj.scaleY = candyScale;
                canvas.addChild(candyObj);
              }
            }
          }
        }
        
        // Highlight a random candy chain.
        var highlightRandomChain = function() {
          var chain = getRandomChain();
          for(var i = 0; i < chain.length; i++) {
            var child = canvas.getChildByName(chain[i][0]+':'+chain[i][1]);
            highlightAnimation(child);
          }
        }
        
        // Highlight animation for candies in a chain.
        var highlightAnimation = function(obj) {
          createjs.Tween.get(obj, {loop: true})
          .to(
            {scaleX:candyScale * 1.1, scaleY:candyScale * 0.7, y: obj.y-5, x: obj.x-2},
            500,
            createjs.Ease.sineOut)
          .to(
            {scaleX:candyScale, scaleY:candyScale, y: obj.y+5},
            500,
            createjs.Ease.sineIn);
        }
        
        // Assets loaded by createjs.
        var loadComplete = function() {
          
          // Populate the board with candies.
          populateBoard();
          
          // After 3 second, highlight a random chain.
          $timeout(highlightRandomChain, 3000);
          
          createjs.Ticker.addEventListener('tick', tick);
        }
        
        var tick = function(event) {
          canvas.update();
        } 
        
        // Createjs asset loader.
        var loader = new createjs.LoadQueue();
        loader.on('complete', loadComplete);
        loader.loadManifest([
           {id: 'candyAtlas', src:candyAtlasSrc}
        ]);
      }
      
    }
  };
}]);
