'use strict';

// FIXME: Cancel swipe outside canvas?

Game.directive('game', ['$window', 'random', '$timeout', 'Swap', function($window, random, $timeout, Swap) {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs) {
      
      // Get Canvas.
      var canvas = new createjs.Stage(element[0]);
      
      // Canvas dimensions.
      var CANVAS_WIDTH = null;
      var CANVAS_HEIGHT = null;
      
      // Define Candy source size from atlas.
      var CANDY_SOURCE_SIZE = 200;
      
      // This will be calculated depending on the screen size and level layout.
      var candyDestinationSize;
      
      // Candy scale for displaying, default is 1.
      var candyScale = 1;
      
      // Max width of game board.
      var maxBoardWidth = 810;
      
      // CreateJS asset loader.
      var assetLoader = new createjs.LoadQueue();
      
      // Game layers.
      var gameBoardLayer = new createjs.Container();
      canvas.addChild(gameBoardLayer);
      
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
        {id: 'candyAtlas', src:'images/candies.png'},
        {id: 'removeEffect', src:'images/effect_sprite.png'},
        {id: 'effectsAtlas', src:'images/effects.png'},
        {id: 'Tile1', src:'images/Tile1.png'},
        {id: 'Tile2', src:'images/Tile2.png'},
        {src: 'vendors/raphael-min.js'},
        {src: 'vendors/Lilita_One_400.font.js'}
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
        for(var i in candies) {
          candies[i].x = candies[i].column * candyDestinationSize + candyDestinationSize / 4;
          candies[i].y = candies[i].row * candyDestinationSize + candyDestinationSize / 4;
          addSpriteForCandy(candies[i]);
          
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
      
      // ======================================================================
      
      var addSpriteEffect = function(x, y) {
        var data = {
          images: [assetLoader.getResult('removeEffect')],
          frames: {width:200, height:200, regX:100, regY:100, count:10}
        }
        
        var spriteSheet = new createjs.SpriteSheet(data);
        var sprite = new createjs.Sprite(spriteSheet);
        
        sprite.x = x + candyDestinationSize/2;
        sprite.y = y + candyDestinationSize/2;
        
        sprite.scaleX = candyScale * 2.5;
        sprite.scaleY = candyScale * 2.5;
        
        sprite.on('animationend', function(evt) {
          evt.remove();
          effectsLayer.removeChild(sprite);
        });
        
        effectsLayer.addChild(sprite);
        
        sprite.play();
      }
      
      //=======================================================================
      // Hinting
      //=======================================================================
      
      var hint = null;
      
      var Hint = function() {
        var hintChain = scope.level.getRandomMatch();
        
        var hintTimeoutPromise = $timeout(function() {
          for(var i = 0; i < hintChain.length(); i++) {
            var candy = hintChain.getCandy(i);
            animateHint(candy);
          }
        }, 3000);
        
        this.stopHint = function() {
          // Put back everything how it was.
          for(var i = 0; i < hintChain.length(); i++) {
            var candy = hintChain.getCandy(i);
            candy.regY = 0;
            candy.scaleY = candyScale;
            candy.y = pointForColumn.getY(candy.row);
            createjs.Tween.removeTweens(candy);
          }
        }
        
        this.cancelHint = function() {
          this.stopHint();
          $timeout.cancel(hintTimeoutPromise);
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
        
        hint.stopHint();
        
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
      
      var swap = null;
      
      var trySwap = function(hDelta, vDelta) {
        var toColumn = swipeFromColumn + hDelta;
        var toRow = swipeFromRow + vDelta;
        
        if(toColumn < 0 || toColumn >= scope.GAME_BOARD.COLUMNS) return;
        if(toRow < 0 || toRow >= scope.GAME_BOARD.ROWS) return;
        
        var toCandy = scope.level.candyAtPosition(toRow, toColumn);
        if(!toCandy) return;
        
        var fromCandy = scope.level.candyAtPosition(swipeFromRow, swipeFromColumn);
        
        swap = new Swap();
        swap.candyA = fromCandy;
        swap.candyB = toCandy;
        
        if(scope.level.isPossibleSwap(swap)) {
          canvas.mouseEnabled = false;
          hint.cancelHint();
          scope.level.performSwap(swap);
          animateSwap(swap, function() {
            scope.movesLeft--;
            scope.$apply();
            handleMatches();
          });
        } else {
          canvas.mouseEnabled = false;
          hint.cancelHint();
          animateInvalidSwap(swap, function() {
            canvas.mouseEnabled = true;
            hint = new Hint();
          });
        }
      }
      
      // For 'Cash Blast!', 'Wind Fall!', 'Gold Rush!', etc.
      var matchesNumber = 0;
      
      var handleMatches = function() {
        
        var chains = scope.level.removeMatches(swap);
        if(chains.length == 0) {
          beginNextTurn();
          return;
        }
        
        matchesNumber += chains.length;
        
        animateMatchedCandies(chains, function() {
          var chain = null;
          for(var i = 0; i < chains.length; i++) {
            chain = chains[i];
            scope.score += chain.score;
            
            if((scope.score / scope.maxScore) * 100 <= 100) {
              scope.percent = (scope.score / scope.maxScore) * 100;
            } else {
              scope.percent = 100;
            }
            
          }
          
          var columns = scope.level.fillHoles();
          animateFallingCandies(columns, function() {
            var columns = scope.level.topUpCandies();
            animateNewCandies(columns, function() {
              swap = null;
              handleMatches(); // recursion
            });
          });
        });
        
      }
      
      var beginNextTurn = function() {
        animateEndText(matchesNumber, function() {
          
          scope.level.detectPossibleSwaps();
          scope.level.resetComboMultiplier();
          canvas.mouseEnabled = true;
          hint = new Hint();
          matchesNumber = 0;
          
          if(scope.movesLeft === 0 && scope.score < scope.maxScore) {
            // game over
            canvas.mouseEnabled = false;
            hint.cancelHint();
            animateGameOver();
          } else if(scope.score >= scope.maxScore) {
            // perfect game
            canvas.mouseEnabled = false;
            hint.cancelHint();
            animateEndGame();
          }
          
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
        
        var animationComplete = function(candy) {
          return function() {
            candiesLayer.removeChild(candy);
          }
        }
        
        for(var i = 0; i < chains.length; i++) {
          var chain = chains[i];
          
          animateScoreForChain(chain);
          
          if(chain.candies.length > 3 && chain.chainType != 'ChainTypePowerup') {
            var candy = chain.candies[0];
            
            for(var j in chain.candies) {
              var c = chain.candies[j];
              
              if(swap && (c === swap.candyA || c === swap.candyB)) {
                candy = scope.level.findCorrectCandyInChain(chain, swap);
                break;
              }
            }
            
            if(!candy) {
              candy = chain.candies[0];
            }
            
            var powerup = scope.level.addPowerup(chain, candy);
            
            $timeout(animateAddPowerup(powerup), duration);
          }
          
          for(var j = 0; j < chain.candies.length; j++) {
            var candy = chain.candies[j];

            // The candy can be part of two chains but we only want to animate once.
            if(candy) {

              if(candy.bonusType) {
                // this is a special candy, add effect
                if(candy.bonusType == 4) {
                  animateBombExplode(candy, chain);
                } else {
                  animatePowerupExplode(candy);
                }
              }

              addSpriteEffect(candy.x, candy.y);

              createjs.Tween.get(candy)
              .to(
                {scaleX: 0, scaleY: 0, x: candy.x + candyDestinationSize/2, y: candy.y + candyDestinationSize/2},
                duration,
                createjs.Ease.sineOut)
              .call(animationComplete(candy));
            }
          } 
          
        }
        
        $timeout(animComplete, duration);
      }
      
      var animateFallingCandies = function(columns, animComplete) {
        // If no candies needs to fall.
        if(columns.length == 0) {
          animComplete();
          return;
        }
        
        for(var i = 0; i < columns.length; i++) {
          var array = columns[i];
          for(var j = 0; j < array.length; j++) {
            var candy = array[j];
            
            var newY = pointForColumn.getY(candy.row);
            var duration = Math.sqrt((Math.abs(candy.y - newY) / candyDestinationSize) * 400000);
            
            var tween = createjs.Tween.get(candy);
            tween
              .to(
                {y: newY},
                duration,
                createjs.Ease.bounceOut);
          }
        }
        
        $timeout(animComplete, 0);
      }
      
      var animateNewCandies = function(columns, animComplete) {
        var longestDuration = 0;
        
        for(var i = 0; i < columns.length; i++) {
          var array = columns[i];
          var startRow = 0;
          startRow -= array.length - 1;
          
          for(var j = 0; j < array.length; j++) {
            var candy = array[j];
            
            candy.x = pointForColumn.getX(candy.column);
            candy.y = pointForColumn.getY(startRow);
            addSpriteForCandy(candy);
            
            var newY = pointForColumn.getY(candy.row);
            var duration = Math.sqrt((Math.abs(candy.y - newY) / candyDestinationSize) * 400000);
            
            startRow++;
            
            if(longestDuration < duration) {
              longestDuration = duration;
            }
            
            var tween = createjs.Tween.get(candy);
            tween
              .to(
                {y: newY},
                duration,
                createjs.Ease.bounceOut);
          }
          
        }
        
        $timeout(animComplete, longestDuration);
      }
      
      var animateBeginGame = function(candy, animComplete) {
        var duration = 300;
        var randomDelay = random.range(100, 500);
        var realX = candy.column * candyDestinationSize;
        var realY = candy.row * candyDestinationSize;
        
        // Initialize
        candy.scaleX = candyScale / 2;
        candy.scaleY = candyScale / 2;
        candy.alpha = 0;
        
        // Animate
        createjs.Tween.get(candy)
          .wait(randomDelay)
          .to(
            {scaleX: candyScale, scaleY: candyScale, alpha: 1, x: realX, y: realY},
            duration,
            createjs.Ease.sineOut);
        
        // longest delay can be.
        $timeout(animComplete, duration + 500);
      }
      
      var animateEndGame = function() {
        var text = customText('Perfect Game!', candyDestinationSize+'px', 'Lilita One');
        
        text.x = CANVAS_WIDTH / 2;
        text.y = CANVAS_HEIGHT / 2;
        text.regX = text.getBounds().width / 2;
        text.regY = text.getBounds().height / 2;
        text.scaleX = 0;
        text.scaleY = 0;
        text.alpha = 0;
        
        var destinationScale = CANVAS_WIDTH / text.getBounds().width / 1.5;
        
        uiLayer.addChild(text);

        createjs.Tween.get(text)
        .to(
          {scaleX: destinationScale, scaleY: destinationScale, alpha: 1},
          1000,
          createjs.Ease.bounceOut);
        
        for(var row = 0; row < scope.GAME_BOARD.ROWS; row++) {
          for(var column = 0; column < scope.GAME_BOARD.COLUMNS; column++) {
            var candy = scope.level.candyAtPosition(row, column);
            if(candy) {
              var randomDuration = random.range(100, 500);
              var realX = candy.column * candyDestinationSize;
              var realY = candy.row * candyDestinationSize;

              createjs.Tween.get(candy, {loop: true})
              .to(
                {scaleX: 0.8 * candyScale, scaleY: 0.8 * candyScale, alpha: 0.5, x: realX, y: realY},
                randomDuration,
                createjs.Ease.sineIn)
              .to(
                {scaleX: candyScale, scaleY: candyScale, alpha: 1, x: realX, y: realY},
                randomDuration,
                createjs.Ease.sineOut);
            }
          }
        }
      }
      
      var animateGameOver = function() {
        var text = customText('Game Over!', candyDestinationSize+'px', 'Lilita One');
        
        text.x = CANVAS_WIDTH / 2;
        text.y = CANVAS_HEIGHT / 2;
        text.regX = text.getBounds().width / 2;
        text.regY = text.getBounds().height / 2;
        text.scaleX = 0;
        text.scaleY = 0;
        text.alpha = 0;
        
        var destinationScale = CANVAS_WIDTH / text.getBounds().width / 1.5;
        
        uiLayer.addChild(text);

        createjs.Tween.get(text)
        .to(
          {scaleX: destinationScale, scaleY: destinationScale, alpha: 1},
          1000,
          createjs.Ease.bounceOut);
      }
      
      var animateAddPowerup = function(candy) {
        return function() {
          candy.x = pointForColumn.getX(candy.column);
          candy.y = pointForColumn.getY(candy.row);
          addSpriteForCandy(candy);
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
      // TEXT ANIMATIONS
      // ======================================================================
      
      var animateEndText = function(matches, animComplete) {
        if(matches <= 1) {
          animComplete();
          return;
        }
        
        if(matches > 4) {
          var string = 'Cha-Ching!';
        } else if(matches > 3) {
          var string = 'Gold Rush!';
        } else if(matches > 2) {
          var string = 'Windfall!';
        } else if(matches > 1) {
          var string = 'Cash Blast!';
        }
        
        var text = customText(string, candyDestinationSize+'px', 'Lilita One');
        var destinationScale = CANVAS_WIDTH / text.getBounds().width / 1.5;
        
        text.x = CANVAS_WIDTH / 2;
        text.y = CANVAS_HEIGHT / 2;
        text.regX = text.getBounds().width / 2;
        text.regY = text.getBounds().height / 2;
        text.scaleX = destinationScale;
        text.scaleY = destinationScale;
        text.alpha = 0;
        
        uiLayer.addChild(text);

        createjs.Tween.get(text)
        .to(
          {alpha: 1},
          700,
          createjs.Ease.cubicOut)
        .wait(200)
        .to(
          {alpha: 0},
          700,
          createjs.Ease.cubicOut)
        .call(function() {
          uiLayer.removeChild(text);
          animComplete();
        });
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
        
        for(var i = 0; i < chain.candies.length; i++) {
          candy = chain.candies[i];
          
          var text = customText(chain.score / chain.candies.length, candyDestinationSize+'px', 'Lilita One');
          
          text.x = candy.x + candyDestinationSize/2;
          text.y = candy.y + candyDestinationSize/2;
          text.regX = text.getBounds().width / 2;
          text.regY = text.getBounds().height / 2;
          text.scaleX = 0.65;
          text.scaleY = 0.65;
          text.alpha = 0;
          uiLayer.addChild(text);
          
          createjs.Tween.get(text)
          .to(
            {alpha: 1},
            duration,
            createjs.Ease.quadOut)
          .to(
            {alpha: 0},
            duration,
            createjs.Ease.quadIn)
          .call(animationComplete(text));
        }
      }
      
      // Custom text
      var customText = function(string, fontSize, fontFamily) {
        var container = new createjs.Container();
        var text = new createjs.Text(string, fontSize+' '+fontFamily, "#000");
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
        
        var outline = new createjs.Text(string, fontSize+' '+fontFamily, "#573514");
        outline.outline = candyDestinationSize * 0.05; // 5% border depending on candy size.
        
        var outline2 = new createjs.Text(string, fontSize+' '+fontFamily, "#000");
        outline2.outline = candyDestinationSize * 0.1; // 10% border depending on candy size.
        
        container.addChild(outline2);
        container.addChild(gradient);
        container.addChild(outline);
        
        return container;
      }
      
      // ======================================================================
      // POWERUP EFFECT ANIMATIONS
      // ======================================================================
      
      
      // General effect bitmap creation.
      var createSpriteforEffect = function(name, img, sourceRect, x, y, scaleX, scaleY, alpha, rotation) {
        var effect = new createjs.Bitmap();
        effect.image = assetLoader.getResult(img);
        effect.name = name;
        effect.sourceRect = sourceRect;
        effect.scaleX = scaleX;
        effect.scaleY = scaleY;
        
        if(alpha) {
          effect.alpha = alpha;
        }
        
        if(rotation) {
          effect.rotation = rotation;
        }

        effect.x = x;
        effect.y = y;
        effect.regX = effect.getBounds().width / 2;
        effect.regY = effect.getBounds().height / 2;
        
        return effect;
      }
      
      // Animating the different explosions.
      var animatePowerupExplode = function(powerup) {
        var x = 0;
        var y = CANDY_SOURCE_SIZE;
        var width = CANDY_SOURCE_SIZE * 2;
        var height = CANDY_SOURCE_SIZE * 2;

        var powerupCenterX = powerup.x + candyDestinationSize / 2;
        var powerupCenterY = powerup.y + candyDestinationSize / 2;
        
        //---------------------------------------------------------------------
        // Powerup explosion
        //---------------------------------------------------------------------
        
        var boom = createSpriteforEffect(
          'boom', 
          'effectsAtlas', 
          new createjs.Rectangle(x, y, width, height),
          powerupCenterX,
          powerupCenterY,
          candyScale * 0.3,
          candyScale * 0.3,
          0
        );
        
        effectsLayer.addChild(boom);
        
        var duration = 300;
        
        createjs.Tween.get(boom)
        .to(
          {scaleX: candyScale, scaleY: candyScale, alpha: 0.7},
          duration,
          createjs.Ease.quadOut)
        .to(
          {scaleX: candyScale * 0.7, scaleY: candyScale * 0.7, alpha: 0},
          duration,
          createjs.Ease.quadIn)
        .call(function() {
          effectsLayer.removeChild(boom);
          // anim end
        });
        
        //---------------------------------------------------------------------
        // Horizontal explosion
        //---------------------------------------------------------------------
        
        if(powerup.bonusType == 1) {
          x = 0;
          y = 0;
          width = CANDY_SOURCE_SIZE * 3;
          height = CANDY_SOURCE_SIZE;
          
          var wooshRight = createSpriteforEffect(
            'wooshRight', 
            'effectsAtlas', 
            new createjs.Rectangle(x, y, width, height),
            powerupCenterX,
            powerupCenterY,
            candyScale * 0.3,
            candyScale * 0.3,
            0.3
          );
          
          var wooshLeft = createSpriteforEffect(
            'wooshLeft', 
            'effectsAtlas', 
            new createjs.Rectangle(x, y, width, height),
            powerupCenterX,
            powerupCenterY,
            candyScale * 0.3,
            candyScale * 0.3,
            0.3,
            180
          );

          effectsLayer.addChild(wooshRight);
          effectsLayer.addChild(wooshLeft);
          
          // NOTE: make these durations 'responsive', they depend on canvas size!!!
          duration = 2500;
        
          createjs.Tween.get(wooshRight)
          .to(
            {scaleX: candyScale, scaleY: candyScale, alpha: 1, x: wooshRight.x + candyDestinationSize},
            100,
            createjs.Ease.linear)
          .to(
            {x: wooshRight.x + CANVAS_WIDTH},
            duration,
            createjs.Ease.quadOut)
          .call(function() {
            effectsLayer.removeChild(wooshRight);
            // anim end
          });
          
          createjs.Tween.get(wooshLeft)
          .to(
            {scaleX: candyScale, scaleY: candyScale, alpha: 1, x: wooshLeft.x - candyDestinationSize},
            100,
            createjs.Ease.linear)
          .to(
            {x: wooshLeft.x - CANVAS_WIDTH},
            duration,
            createjs.Ease.quadOut)
          .call(function() {
            effectsLayer.removeChild(wooshLeft);
            // anim end
          });
        }
        
        //---------------------------------------------------------------------
        // Vertical explosion
        //---------------------------------------------------------------------
        
        if(powerup.bonusType == 2) {
          x = 0;
          y = 0;
          width = CANDY_SOURCE_SIZE * 3;
          height = CANDY_SOURCE_SIZE;
          
          var wooshUp = createSpriteforEffect(
            'wooshUp', 
            'effectsAtlas', 
            new createjs.Rectangle(x, y, width, height),
            powerupCenterX,
            powerupCenterY,
            candyScale * 0.3,
            candyScale * 0.3,
            0.3,
            90
          );
          
          var wooshDown = createSpriteforEffect(
            'wooshDown', 
            'effectsAtlas', 
            new createjs.Rectangle(x, y, width, height),
            powerupCenterX,
            powerupCenterY,
            candyScale * 0.3,
            candyScale * 0.3,
            0.3,
            270
          );

          effectsLayer.addChild(wooshUp);
          effectsLayer.addChild(wooshDown);
          
          // NOTE: make these durations 'responsive', they depend on canvas size!!!
          duration = 2500;
          
          createjs.Tween.get(wooshUp)
          .to(
            {scaleX: candyScale, scaleY: candyScale, alpha: 1, y: wooshUp.y + candyDestinationSize},
            100,
            createjs.Ease.linear)
          .to(
            {y: wooshUp.y + CANVAS_HEIGHT},
            duration,
            createjs.Ease.quadOut)
          .call(function() {
            effectsLayer.removeChild(wooshUp);
            // anim end
          });
          
          createjs.Tween.get(wooshDown)
          .to(
            {scaleX: candyScale, scaleY: candyScale, alpha: 1, y: wooshDown.y - candyDestinationSize},
            100,
            createjs.Ease.linear)
          .to(
            {y: wooshDown.y - CANVAS_HEIGHT},
            duration,
            createjs.Ease.quadOut)
          .call(function() {
            effectsLayer.removeChild(wooshDown);
            // anim end
          });
        }
        
      }
      
      //-----------------------------------------------------------------------
      // Bomb explosion
      //-----------------------------------------------------------------------
      
      var animateBombExplode = function(powerup, chain) {
        var x = 0;
        var y = CANDY_SOURCE_SIZE * 3;
        var width = CANDY_SOURCE_SIZE * 4;
        var height = CANDY_SOURCE_SIZE;
        
        var powerupCenterX = powerup.x + candyDestinationSize / 2;
        var powerupCenterY = powerup.y + candyDestinationSize / 2;
        
        var deltaY = 0;
        var deltaX = 0;
        var angle = 0;

        var distance = 0;
        
        var animationComplete = function(effect) {
          return function() {
            effectsLayer.removeChild(effect);
            // anim complete.
          }
        }
        
        for(var i in chain.candies) {
          var candy = chain.candies[i];
          
          if (candy !== powerup) {
            deltaY = candy.y - powerup.y;
            deltaX = candy.x - powerup.x;

            angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

            distance = Math.sqrt(Math.pow(powerup.x - candy.x, 2) + Math.pow(powerup.y - candy.y, 2));

            var boomWoosh = createSpriteforEffect(
              'boomWoosh', 
              'effectsAtlas', 
              new createjs.Rectangle(x, y, width, height),
              powerupCenterX,
              powerupCenterY,
              candyScale * 0.3,
              candyScale * 0.3,
              0,
              angle
            );
            
            boomWoosh.regX = 0;

            effectsLayer.addChild(boomWoosh);
            
            var duration = random.range(50, 200);

            createjs.Tween.get(boomWoosh)
            .to(
              {scaleX: 0, scaleY: 0, alpha: 0},
              duration,
              createjs.Ease.quadIn)
            .to(
              {scaleX: (distance / candyDestinationSize / 4) * candyScale, scaleY: candyScale, alpha: 1},
              duration,
              createjs.Ease.quadIn)
            .to(
              {scaleX: 0, scaleY: 0, alpha: 0},
              duration,
              createjs.Ease.quadIn)
            .call(animationComplete(boomWoosh));
          }
          
        }
      }
      
      // ======================================================================
      
      var createGameBoard = function() {
        
        for(var row = 0; row < scope.GAME_BOARD.ROWS; row++) {
          for(var column = 0; column < scope.GAME_BOARD.COLUMNS; column++) {

            var bottomLeft     = (column > 0) && (row < scope.GAME_BOARD.ROWS) && scope.level.tileAtPosition(row, column - 1);

            var topLeft  = (column > 0) && (row > 0) && scope.level.tileAtPosition(row - 1, column - 1);

            var bottomRight    = (column < scope.GAME_BOARD.COLUMNS) && (row < scope.GAME_BOARD.ROWS) && scope.level.tileAtPosition(row, column);

            var topRight = (column < scope.GAME_BOARD.COLUMNS) && (row > 0) && scope.level.tileAtPosition(row - 1, column);

            // The tiles are named from 0 to 15, according to the bitmask that is
            // made by combining these four values.
            var value = topLeft | topRight << 1 | bottomLeft << 2 | bottomRight << 3;
            var tile = new createjs.Bitmap();
            
            switch(value) {
              // Konvex Corners
              case 1:
                tile.image = assetLoader.getResult('Tile1');
                tile.sourceRect = new createjs.Rectangle(CANDY_SOURCE_SIZE * 2, CANDY_SOURCE_SIZE * 2, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              case 2:
                tile.image = assetLoader.getResult('Tile1');
                tile.sourceRect = new createjs.Rectangle(0, CANDY_SOURCE_SIZE * 2, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              case 4:
                tile.image = assetLoader.getResult('Tile1');
                tile.sourceRect = new createjs.Rectangle(CANDY_SOURCE_SIZE * 2, 0, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              case 8:
                tile.image = assetLoader.getResult('Tile1');
                tile.sourceRect = new createjs.Rectangle(0, 0, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              
              // Edges
              case 3:
                tile.image = assetLoader.getResult('Tile1');
                tile.sourceRect = new createjs.Rectangle(CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE * 2, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              case 5:
                tile.image = assetLoader.getResult('Tile1');
                tile.sourceRect = new createjs.Rectangle(CANDY_SOURCE_SIZE * 2, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              case 10:
                tile.image = assetLoader.getResult('Tile1');
                tile.sourceRect = new createjs.Rectangle(0, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              case 12:
                tile.image = assetLoader.getResult('Tile1');
                tile.sourceRect = new createjs.Rectangle(CANDY_SOURCE_SIZE, 0, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              
              // Fill
              case 15:
                tile.image = assetLoader.getResult('Tile1');
                tile.sourceRect = new createjs.Rectangle(CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;

              // Konkav Corners
              case 7:
                tile.image = assetLoader.getResult('Tile2');
                tile.sourceRect = new createjs.Rectangle(0, 0, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              case 11:
                tile.image = assetLoader.getResult('Tile2');
                tile.sourceRect = new createjs.Rectangle(CANDY_SOURCE_SIZE, 0, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              case 13:
                tile.image = assetLoader.getResult('Tile2');
                tile.sourceRect = new createjs.Rectangle(0, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
              case 14:
                tile.image = assetLoader.getResult('Tile2');
                tile.sourceRect = new createjs.Rectangle(CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE, CANDY_SOURCE_SIZE);
              break;
            }

            tile.scaleX = candyScale;
            tile.scaleY = candyScale;
            tile.x = pointForColumn.getX(column) - candyDestinationSize / 2;
            tile.y = pointForColumn.getY(row) - candyDestinationSize / 2;

            gameBoardLayer.addChild(tile);
                  
          }
        }
        
      }
      
      // ======================================================================
      
      var beginGame = function() {
        
        // Assets loaded by createjs.
        var assetsLoaded = function() {
          
          // Hide loading panel.
          document.getElementById('minigame-loading').style.display = 'none';
          
          var dpr = window.devicePixelRatio || 1;
          var bsr = window.webkitBackingStorePixelRatio ||
                    window.mozBackingStorePixelRatio ||
                    window.msBackingStorePixelRatio ||
                    window.backingStorePixelRatio || 1;

          var scale = dpr / bsr;

          var width = $window.innerWidth * scale;
          
          // Get candy pixel size.
          if(width >= maxBoardWidth) {
            candyDestinationSize = maxBoardWidth / scope.GAME_BOARD.COLUMNS;
          } else {
            candyDestinationSize = width / scope.GAME_BOARD.COLUMNS;
          }

          // Get candy scale.
          candyScale = candyDestinationSize / CANDY_SOURCE_SIZE;

          // Set canvas size.
          CANVAS_WIDTH = candyDestinationSize * scope.GAME_BOARD.COLUMNS;
          CANVAS_HEIGHT = candyDestinationSize * scope.GAME_BOARD.ROWS;
          
          element[0].setAttribute('width', CANVAS_WIDTH);
          element[0].setAttribute('height', CANVAS_HEIGHT);
          
          createGameBoard();
          
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

          // Show a random hint.
          hint = new Hint();
          
          // Canvas ticker for animations.
          var tick = function(evt) {
            canvas.update();
          }
          createjs.Ticker.setFPS(60);
          createjs.Ticker.addEventListener('tick', tick);
          
          
          // NOTE: Old code, from previous game!
          // To display progressbar icons and text in the HUD.
          angular.forEach(scope.GAME_BOARD.REWARDS, function(val, i) {
            var x_offset_of_icon = 13;
            var x_offset_of_text = 48;
            
            var el = angular.element(document.querySelector("#"+val.name));
            var paper = new Raphael(val.name, el.offsetWidth, el.offsetHeight);
            paper.image('images/gold-icon.png', x_offset_of_icon, paper.height/2 - 17, 30, 31);
            var font = paper.getFont('Lilita One');
            
            paper.print(x_offset_of_text, paper.height/2 - 2, val.value, font, 30).attr({transform:"t0,3", fill:"#552f0b"});
            paper.print(x_offset_of_text, paper.height/2 - 2, val.value, font, 30).attr({"fill": "90-#FC7E0B-#FDFE38"});
          });
          
        }
        
        // Createjs asset loader complete handler.
        assetLoader.on('complete', assetsLoaded);
        // Createjs loading assets error.
        assetLoader.on('error', function(){
          document.getElementById('minigame-loading-error').style.display = 'block';
        });
        
      }
      
    }
  };
}]);
