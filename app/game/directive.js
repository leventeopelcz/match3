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
          beginGame();
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
          x = (candies[i].type - 1) * CANDY_SOURCE_SIZE;
          candies[i].image = assetLoader.getResult('candyAtlas');
          candies[i].sourceRect = new createjs.Rectangle(x, y, width, height);
          candies[i].x = candies[i].column * candyDestinationSize + candyDestinationSize/4;
          candies[i].y = candies[i].row * candyDestinationSize + candyDestinationSize/4;
          candies[i].scaleX = candyScale / 2;
          candies[i].scaleY = candyScale / 2;
          candiesLayer.addChild(candies[i]);
          candies[i].alpha = 0;
          
          animateBeginGame(candies[i], function() {
            // anim complete;
            // TODO: not implemented yet (maybe use array of candies instead of singular candy to get last anim complete, as before)
          });
        }
      }
      
      // ======================================================================
      
      var addSpriteForCandy = function(candy) {
        if(candy.bonusType == 4) {
          var x = 0;
        } else {
          var x = (candy.type - 1) * CANDY_SOURCE_SIZE;
        }
        var y = candy.bonusType * CANDY_SOURCE_SIZE;
        var width = CANDY_SOURCE_SIZE;
        var height = CANDY_SOURCE_SIZE;
        
        candy.image = assetLoader.getResult('candyAtlas');
        candy.sourceRect = new createjs.Rectangle(x, y, width, height);
        candy.scaleX = candyScale;
        candy.scaleY = candyScale;
        candiesLayer.addChild(candy);
      }
      
      //=======================================================================
      // Hinting
      //=======================================================================
      
      
      var hintTimeoutPromise = null;
      
      var hintChain = null;
      var originalY = [];
      
      // Highlight a random chain.
      var hint = function() {
        hintChain = scope.level.getRandomMatch();
        for(var i = 0; i < hintChain.length(); i++) {
          var candy = hintChain.getCandy(i);
          originalY[i] = candy.y;
          animateHint(candy);
        }
      }
      
      var stopHint = function() {
        // Put back everything how it was.
        for(var i = 0; i < hintChain.length(); i++) {
          var candy = hintChain.getCandy(i);
          candy.regY = 0;
          candy.scaleY = candyScale;
          candy.y = originalY[i];
          createjs.Tween.removeTweens(candy);
        }
      }

      var animateHint = function(candy) {
        // Set registration point to bottom.
        candy.regY = candy.getBounds().height;
        // Fix offset caused by moving the registration point.
        candy.y = candy.y + candyDestinationSize;
        
        var duration = 200;
        
        var fromY = candy.y;
        var toY = candy.y - candyDestinationSize * 0.1;
        
        var fromScaleY = candy.scaleY;
        var toScaleY = candy.scaleY * 0.8;
        
        createjs.Tween.get(candy, {loop: true})
        .to(
          {y: toY},
          duration,
          createjs.Ease.quadOut)
        .to(
          {y: fromY},
          duration,
          createjs.Ease.quadIn)
        .to(
          {scaleY: toScaleY},
          duration,
          createjs.Ease.quadOut)
        .to(
          {scaleY: fromScaleY},
          duration,
          createjs.Ease.quadIn);
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
        
        if(hintChain) {
          stopHint();
        }
        
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
        
        if(column < swipeFromColumn) {           // swipe left
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
      
      var swap = new Swap();
      
      var trySwap = function(hDelta, vDelta) {
        var toColumn = swipeFromColumn + hDelta;
        var toRow = swipeFromRow + vDelta;
        
        if(toColumn < 0 || toColumn >= scope.GAME_BOARD.COLUMNS) return;
        if(toRow < 0 || toRow >= scope.GAME_BOARD.ROWS) return;
        
        var toCandy = scope.level.candyAtPosition(toRow, toColumn);
        if(!toCandy) return;
        
        var fromCandy = scope.level.candyAtPosition(swipeFromRow, swipeFromColumn);
        
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
        // Stop hint timeout if havent triggered yet.
        $timeout.cancel(hintTimeoutPromise);
        
        var chains = scope.level.removeMatches(swap);
        if(chains.length == 0) {
          beginNextTurn();
          return;
        }
        
        animateMatchedCandies(chains, function() {
          var chain = null;
          for(var i = 0; i < chains.length; i++) {
            chain = chains[i];
            scope.score += chain.score;
          }
          
          animateAddPowerups(chains);
          
          var columns = scope.level.fillHoles();
          animateFallingCandies(columns, function() {
            var columns = scope.level.topUpCandies();
            animateNewCandies(columns, function() {
              handleMatches(); // recursion
            });
          });
        });
      }
      
      var beginNextTurn = function() {
        scope.level.detectPossibleSwaps();
        canvas.mouseEnabled = true;
        scope.movesLeft--;
        scope.$apply();
        hintTimeoutPromise = $timeout(hint, 3000);
        scope.level.resetComboMultiplier();
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
        var totalCandiesToAnimate = 0;
        var candiesToAnimate = 0;
        
        // Get the number of candies we animate.
        for(var i = 0; i < chains.length; i++) {
          var chain = chains[i].getCandies();
          for(var j = 0; j < chain.length; j++) {
            totalCandiesToAnimate++;
          }
        }
        
        for(var i = 0; i < chains.length; i++) {
          var chain = chains[i].getCandies();
          animateScoreForChain(chain);
          for(var j = 0; j < chain.length; j++) {
            var candy = chain[j];
            candiesToAnimate++;
            
            // The candy can be part of two chains but we only want to animate once.
            if(candy) {
              var tween = createjs.Tween.get(candy);
              tween.to(
                {scaleX: 0, scaleY: 0, x: candy.x + candyDestinationSize/2, y: candy.y + candyDestinationSize/2},
                duration,
                createjs.Ease.sineOut);
              
              // If this is the last candy we want to animate, assign a complete event. 
              // So this way we won't call the complete function more than once.
              if(candiesToAnimate == totalCandiesToAnimate) {
                tween.call(function() {
                  candiesLayer.removeChild(candy);
                  animComplete();
                });
              }
              
            }
          }
        }
      }
      
      var animateFallingCandies = function(columns, animComplete) {
        var totalCandiesToAnimate = 0;
        var candiesToAnimate = 0;
        
        // If no candies needs to fall.
        if(columns.length == 0) {
          animComplete();
          return;
        }
        
        // Get the number of candies we animate.
        for(var i = 0; i < columns.length; i++) {
          var array = columns[i];
          for(var j = 0; j < array.length; j++) {
            totalCandiesToAnimate++;
          }
        }
        
        for(var i = 0; i < columns.length; i++) {
          var array = columns[i];
          for(var j = 0; j < array.length; j++) {
            var candy = array[j];
            candiesToAnimate++;
            
            var delay = 100 * j;
            var newY = pointForColumn.getY(candy.row);
            var duration = ((newY - candy.y) / candyDestinationSize) * 200;
            
            var tween = createjs.Tween.get(candy);
            tween
              .wait(delay)
              .to(
                {y: newY},
                duration,
                createjs.Ease.sineOut);
            
            // If this is the last candy we want to animate, assign a complete event. 
            // So this way we won't call the complete function more than once.
            if(candiesToAnimate == totalCandiesToAnimate) {
              tween.call(function() {
                animComplete();
              });
            }
            
          }
        }
      }
      
      var animateNewCandies = function(columns, animComplete) {
        var totalCandiesToAnimate = 0;
        var candiesToAnimate = 0;
        
        // Get the number of candies we animate.
        for(var i = 0; i < columns.length; i++) {
          var array = columns[i];
          for(var j = 0; j < array.length; j++) {
            totalCandiesToAnimate++;
          }
        }
        
        for(var i = 0; i < columns.length; i++) {
          var array = columns[i];
          var startRow = array[0].row - 1;
          
          for(var j = 0; j < array.length; j++) {
            var candy = array[j];
            candiesToAnimate++;
            
            candy.x = pointForColumn.getX(candy.column);
            candy.y = pointForColumn.getY(startRow);
            addSpriteForCandy(candy);
            
            var delay = 200 * (array.length - j - 1);
            var duration = (candy.row - startRow) * 100;
            var newY = pointForColumn.getY(candy.row);
            
            var tween = createjs.Tween.get(candy);
            tween
              .wait(delay)
              .to(
                {y: newY},
                duration,
                createjs.Ease.sineOut);
            
            // If this is the last candy we want to animate, assign a complete event. 
            // So this way we won't call the complete function more than once.
            if(candiesToAnimate == totalCandiesToAnimate) {
              tween.call(function() {
                animComplete();
              });
            }
          }
          
        }
      }
      
      var animateBeginGame = function(candy, animComplete) {
        var duration = 300;
        var randomDelay = random.range(100, 500);
        var realX = candy.column * candyDestinationSize;
        var realY = candy.row * candyDestinationSize;
        
        createjs.Tween.get(candy)
          .wait(randomDelay)
          .to(
            {scaleX: candyScale, scaleY: candyScale, alpha: 1, x: realX, y: realY},
            duration,
            createjs.Ease.sineOut)
          .call(function() {
            animComplete();
          });
      }
      
      var animateAddPowerups = function(chains) {
        if(swap.candyA.bonusType) {
          swap.candyA.x = pointForColumn.getX(swap.candyA.column);
          swap.candyA.y = pointForColumn.getY(swap.candyA.row);
          addSpriteForCandy(swap.candyA);
        } else {
          swap.candyB.x = pointForColumn.getX(swap.candyB.column);
          swap.candyB.y = pointForColumn.getY(swap.candyB.row);
          addSpriteForCandy(swap.candyB);
        }
      }
      
      // ======================================================================
      // SELECTION INDICATOR
      // ======================================================================
      
      var createSelectionIndicatorForCandy = function() {
        var x = CANDY_SOURCE_SIZE;
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
      // SCORING
      // ======================================================================
      
      var animateScoreForChain = function(chain, animComplete) {
        var candy = null;
        var duration = 500;
        var delay = 500;
        
        var animationComplete = function(text) {
          return function() {
            uiLayer.removeChild(text);
            // anim complete.
          }
        }
        
        for(var i = 0; i < chain.length; i++) {
          candy = chain[i];

          var text = customText(scope.GAME_BOARD.BASE_SCORE * scope.level.comboMultiplier);
          
          text.x = candy.x + candyDestinationSize/2;
          text.y = candy.y + candyDestinationSize/2;
          text.regX = text.getBounds().width / 2;
          text.regY = text.getBounds().height / 2
          text.scaleX = 0.3;
          text.scaleY = 0.3;
          text.alpha = 0;
          uiLayer.addChild(text);
          
          createjs.Tween.get(text)
          .to(
            {scaleX: 1.5, scaleY: 1.5, alpha: 1},
            duration,
            createjs.Ease.quadOut)
          .to(
            {scaleX: 1, scaleY: 1, alpha: 1},
            duration,
            createjs.Ease.quadIn)
          .call(animationComplete(text));
        }
      }
      
      // Custom text
      var customText = function(string) {
        var container = new createjs.Container();
        var text = new createjs.Text(string, "40px Lilita One", "#000");
        var gradient = new createjs.Shape();
        
        var height = text.getBounds().height;
        var width = text.getBounds().width;
        
        text.cache(0, 0, width, height);
        
        gradient.graphics.beginLinearGradientFill(["#f7e70a", "#f64400"], [0, 1], 0, 0, 0, height);
        gradient.graphics.drawRect(0, 0, width, height);
        gradient.graphics.endFill();
        
        gradient.filters = [
          new createjs.AlphaMaskFilter(text.cacheCanvas)
        ];
        
        gradient.cache(0, 0, width, height);
        
        var outline = new createjs.Text(string, "40px Lilita One", "#573514");
        outline.outline = 2;
        
        var outline2 = new createjs.Text(string, "40px Lilita One", "#000");
        outline2.outline = 4;
        
        container.addChild(outline2);
        container.addChild(gradient);
        container.addChild(outline);
        
        return container;
      }
      
      // ======================================================================
      
      var beginGame = function() {
        
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

          // After 3 second, highlight a random chain.
          hintTimeoutPromise = $timeout(hint, 3000);
          
          // Canvas ticker for animations.
          var tick = function(evt) {
            canvas.update();
          } 
          createjs.Ticker.addEventListener('tick', tick);
        }
        
        // Createjs asset loader complete handler.
        assetLoader.on('complete', assetsLoaded);        
      }
      
    }
  };
}]);
