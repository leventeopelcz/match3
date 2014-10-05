'use strict';

Game.directive('game', ['$window', 'random', '$timeout', 'Swap', function($window, random, $timeout, Swap) {
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
      
      // Game layers.
      var candiesLayer = new createjs.Container();
      canvas.addChild(candiesLayer);
      
      var effectsLayer = new createjs.Container();
      canvas.addChild(effectsLayer);
      
      var uiLayer = new createjs.Container();
      canvas.addChild(uiLayer);
      
      // Selection indicator for candies.
      var selectionIndicator = null;
      
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
          candiesLayer.addChild(candies[i]);
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
      
      var pointForColumn = new function() {
        this.getX = function(column) {
          return (column * candyDestinationSize);
        }
        
        this.getY = function(row) {
          return (row * candyDestinationSize);
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
          
          showSelectionIndicatorForCandy(candy);
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
          hideSelectionIndicatorForCandy();
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
        
        if(scope.level.isPossibleSwap(swap)) {
          canvas.mouseEnabled = false;
          scope.level.performSwap(swap);
          animateSwap(swap, function() {
            handleMatches();
          });
        } else {
          canvas.mouseEnabled = false;
          animateInvalidSwap(swap, function() {
            canvas.mouseEnabled = true;
          });
        }
      }
      
      var handleMatches = function() {
        var chains = scope.level.removeMatches();
        animateMatchedCandies(chains, function() {
          canvas.mouseEnabled = true;
          var columns = scope.level.fillHoles();
          animateFallingCandies(columns);
        });
      }
      
      // ======================================================================
      // ANIMATIONS
      // ======================================================================
      
      var animateSwap = function(swap, animComplete) {
        // Always the swapped candy should be visually on top.
        if(candiesLayer.getChildIndex(swap.candyA) < candiesLayer.getChildIndex(swap.candyB)) {
          candiesLayer.swapChildren(swap.candyA, swap.candyB);
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
      
      var animateInvalidSwap = function(swap, animComplete) {
        // Always the swapped candy should be visually on top.
        if(candiesLayer.getChildIndex(swap.candyA) < candiesLayer.getChildIndex(swap.candyB)) {
          candiesLayer.swapChildren(swap.candyA, swap.candyB);
        }
        
        var duration = 300;
        
        createjs.Tween.get(swap.candyA)
        .to(
          {y: swap.candyB.y, x: swap.candyB.x},
          duration,
          createjs.Ease.sineIn)
        .to(
          {y: swap.candyA.y, x: swap.candyA.x},
          duration,
          createjs.Ease.sineOut);
        
        createjs.Tween.get(swap.candyB)
        .to(
          {y: swap.candyA.y, x: swap.candyA.x},
          duration,
          createjs.Ease.sineIn)
        .to(
          {y: swap.candyB.y, x: swap.candyB.x},
          duration,
          createjs.Ease.sineOut)
        .call(animationComplete);
        
        function animationComplete() {
          animComplete();
        }
      }
      
      var animateMatchedCandies = function(chains, animComplete) {
        var duration = 300;
        
        for(var i = 0; i < chains.length; i++) {
          var cs = chains[i].getCandies();
          for(var j = 0; j < cs.length; j++) {
            var candy = cs[j];
            // The candy can be part of two chains but we only want to animate once.
            if(candy) {
              createjs.Tween.get(candy)
              .to(
                {scaleX: 0, scaleY: 0, x: candy.x + candyDestinationSize/2, y: candy.y + candyDestinationSize/2},
                duration,
                createjs.Ease.sineOut)
              .call(function() {
                candiesLayer.removeChild(candy);
                animComplete();
              });
            }
          }
        }
      }
      
      var animateFallingCandies = function(columns, animComplete) {
        var longestDuration = 0;
        var array;
        var candy;
        var newY;
        //var timeLine = createjs.Timeline();
        
        for(var i = 0; i < columns.length; i++) {
          array = columns[i];
          for(var j = 0; j < array.length; j++) {
            candy = array[j];
            
            var delay = 50 + 150 * j;
            newY = pointForColumn.getY(candy.row);
            var duration = ((newY - candy.y) / candyDestinationSize) * 500;
            longestDuration = Math.max(longestDuration, duration + delay);
            
            console.log(duration);
            
            createjs.Tween.get(candy)
            .to(
              {y: newY},
              duration,
              createjs.Ease.sineOut)
            .wait(delay);
          }
        }
      }
      
      // ======================================================================
      // SELECTION INDICATOR
      // ======================================================================
      
      var createSelectionIndicatorForCandy = function() {
        var x = 0;
        var y = 4 * CANDY_SOURCE_SIZE;
        var width = CANDY_SOURCE_SIZE;
        var height = CANDY_SOURCE_SIZE;
        
        selectionIndicator = new createjs.Bitmap();
        selectionIndicator.image = assetLoader.getResult('candyAtlas');
        selectionIndicator.name = 'selectionIndicator';
        selectionIndicator.sourceRect = new createjs.Rectangle(x, y, width, height);
        selectionIndicator.scaleX = candyScale;
        selectionIndicator.scaleY = candyScale;
      }
      
      var showSelectionIndicatorForCandy = function(candy) {
        // If indicator is visible, remove it first.
        var s = uiLayer.getChildByName('selectionIndicator');
        if(s) {
          uiLayer.removeChild(s);
        }
        
        selectionIndicator.x = candy.x;
        selectionIndicator.y = candy.y;
        uiLayer.addChild(selectionIndicator);
      }
      
      var hideSelectionIndicatorForCandy = function() {
        uiLayer.removeChild(selectionIndicator);
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
          
          addSpritesForCandies(scope.level.shuffle());
          
          createSelectionIndicatorForCandy();
          
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
        
        //===========================================================================<<<<<<<<
        //===========================================================================<<<<<<<<
        //===========================================================================<<<<<<<<
        
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
      
    }
  };
}]);
