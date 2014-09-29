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
      
      // Swap vector.
      var swap = {
        source: null,
        target: null
      };
      
      // Watch for level.
      scope.$watch('level.loaded', function() {
        // If level loaded.
        if(scope.level.loaded) {
          levelLoaded();
        }
      });
      
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
        
        // To enable the use of mouseover or rollover events.
        canvas.enableMouseOver();
        
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
                candyObj.row = i;
                candyObj.column = j;
                candyObj.type = scope.board[i][j];
                candyObj.sourceRect = candies[scope.board[i][j]].sourceRect;
                candyObj.x = j*candyDestinationSize;
                candyObj.y = i*candyDestinationSize;
                candyObj.scaleX = candyScale;
                candyObj.scaleY = candyScale;
                candyObj.on('click', function(evt) {
                  if(!swap.source) {
                    swap.source = evt.target;
                  } else if(!swap.target) {
                    swap.target = evt.target;
                    swap(swap);
                    swap.source = null;
                    swap.target = null;
                  } else {
                    swap.source = null;
                    swap.target = null;
                  }
                });
                /*candyObj.on('rollover', function(evt) {
                  
                });*/
                canvas.addChild(candyObj);
              }
            }
          }
        }
        
        var removeChain = function(idx) {
          scope.removeChain(idx);
          var chain = scope.chains[idx];
          var node;
          var child;
          for(var i = 0; i < chain.length; i++) {
            node = chain[i];
            child = canvas.getChildByName(node[0]+':'+node[1]);
            canvas.removeChild(child);
          }
        }
        
        var swap = function(swapObj) {
          var si = swapObj.source.name.split(':')[0];
          var sj = swapObj.source.name.split(':')[1];
          var ti = swapObj.target.name.split(':')[0];
          var tj = swapObj.target.name.split(':')[1];
          var idx;
          
          // Horizontal and 1 away or vertical and 1 away.
          if(Math.abs(si-ti) == 1 && Math.abs(sj - tj) == 0 || Math.abs(sj - tj) == 1 && Math.abs(si-ti) == 0) {
            // If it's a valid swap...
            var idx = scope.getSwapIndex([[si,sj],[ti,tj]]);
            if(idx) {
              // valid swap code here.
              swapAnimation(swapObj);
              removeChain(idx);
            } else {
              // Swap back the candies.
              invalidSwapAnimation(swapObj);
            }
          }
        }
        
        var invalidSwapAnimation = function(swapObj) {
          createjs.Tween.get(swapObj.source)
          .to(
            {y: swapObj.target.y, x: swapObj.target.x},
            500,
            createjs.Ease.sineIn)
          .to(
            {y: swapObj.source.y, x: swapObj.source.x},
            500,
            createjs.Ease.sineOut);
          createjs.Tween.get(swapObj.target)
          .to(
            {y: swapObj.source.y, x: swapObj.source.x},
            500,
            createjs.Ease.sineIn)
          .to(
            {y: swapObj.target.y, x: swapObj.target.x},
            500,
            createjs.Ease.sineOut);
        }
        
        var swapAnimation = function(swapObj) {
          createjs.Tween.get(swapObj.source)
          .to(
            {y: swapObj.target.y, x: swapObj.target.x},
            500,
            createjs.Ease.sineOut);
          createjs.Tween.get(swapObj.target)
          .to(
            {y: swapObj.source.y, x: swapObj.source.x},
            500,
            createjs.Ease.sineOut);
        }
        
        // Get a random chain.
        var getRandomChain = function() {
          var randomIndex = random.range(0, scope.chains.length);
          return scope.chains[randomIndex];
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
        var highlightAnimation = function(bitmap) {
          createjs.Tween.get(bitmap, {loop: true})
          .to(
            {scaleX:candyScale * 1.1, scaleY:candyScale * 0.7, y: bitmap.y-5, x: bitmap.x-2},
            500,
            createjs.Ease.sineOut)
          .to(
            {scaleX:candyScale, scaleY:candyScale, y: bitmap.y+5},
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
        
        var tick = function(evt) {
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
