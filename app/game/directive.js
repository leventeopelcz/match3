'use strict';

Game.directive('game', ['$window', 'random', '$timeout', function($window, random, $timeout) {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs) {
      
      // Get Canvas.
      var canvas = new createjs.Stage(element[0]);
      
      // Define Candy source size from atlas.
      var CANDY_SOURCE_SIZE = 200;
      
      // This will be calculated depending on the screen size and level layout.
      var candyDestinationSize;
      
      // Candy scale for displaying, default is 1.
      var candyScale = 1;
      
      // Max width of game board.
      var maxBoardWidth = 600;
      
      // CreateJS asset loader.
      var assetLoader = new createjs.LoadQueue();
      
      // ======================================================================
      
      // Assets to load.
      assetLoader.loadManifest([
         {id: 'candyAtlas', src:'images/candies.png'}
      ]);
      
      // ======================================================================
      
      // If level data is loaded.
      scope.$watch('levelLoaded', function() {
        if(scope.levelLoaded) {
          levelLoaded();
        }
      });
      
      // ======================================================================
      
      // Adds the sprites for the candies.
      var addSpritesForCandies = function(candies) {
        var x;
        var y = 0;
        var width = CANDY_SOURCE_SIZE;
        var height = CANDY_SOURCE_SIZE;
        
        for(var i = 0; i < candies.length; i++) {
          x = candies[i].type * CANDY_SOURCE_SIZE;
          candies[i].image = assetLoader.getResult('candyAtlas');
          candies[i].sourceRect = new createjs.Rectangle(x, y, width, height);
          candies[i].x = candies[i].column * candyDestinationSize;
          candies[i].y = candies[i].row * candyDestinationSize;
          candies[i].scaleX = candyScale;
          candies[i].scaleY = candyScale;
          canvas.addChild(candies[i]);
        }
        
        canvas.update();
      }
      
      // ======================================================================
      
      // Interactivity functions.
      
      var swipeFromRow = null;
      var swipeFromColumn = null;
      
      var convertPoint = new function() {
        var column = null;
        var row = null;
        
        this.getRow = function(y) {
          if(y >= 0 && y < scope.GAME_BOARD.ROWS * candyDestinationSize) {
            row = Math.floor(y / candyDestinationSize);
          }
          return row;
        }
        
        this.getColumn = function(x) {
          if(x >= 0 && x < scope.GAME_BOARD.COLUMNS * candyDestinationSize) {
            column = Math.floor(x / candyDestinationSize);
          }
          return column;
        }
      } 
      
      var touchesBegan = function(evt) {
        if(!canvas.mouseEnabled) return;
        
        var row = convertPoint.getRow(evt.stageY);
        var column = convertPoint.getColumn(evt.stageX);
        var candy = scope.level.candyAtPosition(row, column);
        
        if(candy) {
          swipeFromRow = row;
          swipeFromColumn = column;
        }
      }
      
      var touchesMoved = function(evt) {
        if(swipeFromRow === null) return;
        
        var row = convertPoint.getRow(evt.stageY);
        var column = convertPoint.getColumn(evt.stageX);
        
        var hDelta = 0;
        var vDelta = 0;
        
        if(column < swipeFromColumn) {          // swipe left
          hDelta = -1;
        } else if (column > swipeFromColumn) {   // swipe right
          hDelta = 1;
        } else if (row < swipeFromRow) {         // swipe down
          vDelta = -1;
        } else if (row > swipeFromRow) {         // swipe up
          vDelta = 1;
        }
        
        if (hDelta != 0 || vDelta != 0) {
          trySwap(hDelta, vDelta);
          swipeFromRow = null;
        } 
      }
      
      /*
      var touchesEnded = function(evt) {
        swipeFromRow = null;
        swipeFromColumn = null;
      }
      */
      
      var trySwap = function(hDelta, vDelta) {
        var toColumn = swipeFromColumn + hDelta;
        var toRow = swipeFromRow + vDelta;
        
        if(toColumn < 0 || toColumn >= scope.GAME_BOARD.COLUMNS) return;
        if(toRow < 0 || toRow >= scope.GAME_BOARD.ROWS) return;
        
        var toCandy = scope.level.candyAtPosition(toRow, toColumn);
        if(!toCandy) return;
        
        var fromCandy = scope.level.candyAtPosition(swipeFromRow, swipeFromColumn);
        
        var swap = new Swap();
        swap.candyA = fromCandy;
        swap.candyB = toCandy;
        
        canvas.mouseEnabled = false;
        scope.level.performSwap(swap);
        animateSwap(swap, function() {
          canvas.mouseEnabled = true;
        });
        
      }
      
      // ======================================================================
      // SWAP CLASS
      // ======================================================================

      function Swap() {
        this.candyA = null;
        this.candyB = null;

        this.describe = function() {
          return 'Swap '+this.candyA+ ' with '+this.candyB;
        }
      }
      
      // ======================================================================
      // ANIMATIONS
      // ======================================================================
      
      var animateSwap = function(swap, animComplete) {
        // Always the swapped candy should be visually on top.
        if(canvas.getChildIndex(swap.candyA) < canvas.getChildIndex(swap.candyB)) {
          canvas.swapChildren(swap.candyA, swap.candyB);
        }
        
        var duration = 300;
        
        createjs.Tween.get(swap.candyA)
        .to(
          {y: swap.candyB.y, x: swap.candyB.x},
          duration,
          createjs.Ease.sineOut);
        
        createjs.Tween.get(swap.candyB)
        .to(
          {y: swap.candyA.y, x: swap.candyA.x},
          duration,
          createjs.Ease.sineOut)
        .call(animationComplete); 
        
        function animationComplete() {
          animComplete();
        }
      }
      
      // ======================================================================
      
      // "controller"
      
      // Level data is loaded.
      var levelLoaded = function() {
        
        // Assets loaded by createjs.
        var assetsLoaded = function() {
          
          // Get candy pixel size.
          if($window.innerWidth >= maxBoardWidth) {
            candyDestinationSize = maxBoardWidth / scope.GAME_BOARD.COLUMNS;
          } else {
            candyDestinationSize = $window.innerWidth / scope.GAME_BOARD.COLUMNS;
          }

          // Get candy scale.
          candyScale = candyDestinationSize / CANDY_SOURCE_SIZE;

          // Set canavas size.
          element[0].setAttribute('width', candyDestinationSize * scope.GAME_BOARD.COLUMNS);
          element[0].setAttribute('height', candyDestinationSize * scope.GAME_BOARD.ROWS);

          // Candy container to hold all the candies (can think about it as a layer).
          var candiesLayer = new createjs.Container();
          
          addSpritesForCandies(scope.level.shuffle());
          
          // Enable touch.
          createjs.Touch.enable(canvas);
          
          // To enable the use of mouseover or rollover events.
          canvas.enableMouseOver();
          
          // Interactivity handlers.
          canvas.on('stagemousedown', touchesBegan);
          canvas.on('stagemousemove', touchesMoved);
          //canvas.on('stagemouseup', touchesEnded);
          

          // Building an array of swap pairs and chains.
          //scope.buildSwapsAndChains(canvas);

          // After 3 second, highlight a random chain.
          //$timeout(highlightRandomChain, 3000);
          
          // Canvas ticker for animations.
          var tick = function(evt) {
            canvas.update();
          } 
          createjs.Ticker.addEventListener('tick', tick);
        }
        
        // Createjs asset loader complete handler.
        assetLoader.on('complete', assetsLoaded);
        
        
        /*
        // Creating a vector of different candies.
        for(var i = 0; i < scope.candiesVector.length; i++) {
          var x = i * CANDY_SOURCE_SIZE;
          var y = 0;
          var width = CANDY_SOURCE_SIZE;
          var height = CANDY_SOURCE_SIZE;
          
          candies[i] = new createjs.Bitmap(candyAtlasSrc);
          candies[i].sourceRect = new createjs.Rectangle(x, y, width, height);
        }
        
        // Populate board with candies.
        var populateBoard = function() {
          for(var i = 0; i < scope.level.rows; i++) {
            for(var j = 0; j < scope.level.columns; j++) {
              if(scope.board[i][j] > -1) {
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
              
                canvas.addChild(candyObj);
              }
            }
          }
        }
        */
        
        var removeChain = function(idx) {
          var chain = scope.chains[idx];
          
          // Remove candies and chain members from board.
          for(var i = 0; i < chain.length; i++) {
            canvas.removeChild(chain[i]);
            scope.board[chain[i].row][chain[i].column] = -2;
          }
        }
        
        var swap = function(swapObj) {
          var si = swapObj.source.row;
          var sj = swapObj.source.column;
          var ti = swapObj.target.row;
          var tj = swapObj.target.column;
          var idx;
          
          // Horizontal and 1 away or vertical and 1 away.
          if(Math.abs(si-ti) == 1 && Math.abs(sj - tj) == 0 || Math.abs(sj - tj) == 1 && Math.abs(si-ti) == 0) {
            // If this pair is in the validSwaps array means it is a valid swap.
            var obj = scope.getSwapIndex([swapObj.source, swapObj.target]);
            if(obj) {
              // valid swap code here.
              swapAnimation(swapObj);
              
              removeChain(obj.index);
              
              
              // Swap the removed and the swapped on board.
              var original = scope.board[swapObj.source.row][swapObj.source.column];
              scope.board[swapObj.source.row][swapObj.source.column] = scope.board[swapObj.target.row][swapObj.target.column];
              scope.board[swapObj.target.row][swapObj.target.column] = original;
              
              
              
              // Update swaps and chains after a valid swap.
              scope.buildSwapsAndChains(canvas);
            } else {
              // Swap back the candies.
              invalidSwapAnimation(swapObj);
            }
            
            swap.source = null;
            swap.target = null;
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
        
        /*
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
        */
        
        // Get a random chain.
        var getRandomChain = function() {
          var randomIndex = random.range(0, scope.chains.length);
          return scope.chains[randomIndex];
        }

        // Highlight a random chain.
        var highlightRandomChain = function() {
          var chain = getRandomChain();
          for(var i = 0; i < chain.length; i++) {
            highlightAnimation(chain[i]);
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
        
      }
      
      // Swap vector.
      var swap = {
        source: null,
        target: null
      };
      
    }
  };
}]);
