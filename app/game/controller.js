'use strict';

Game.controller('GameController', ['$scope', 'file', 'Swap', 'Level', '$routeParams', 'cssInjector', function($scope, file, Swap, Level, $routeParams, cssInjector) {
  
  // Level data.
  $scope.GAME_BOARD = {
    LAYOUT: null,
    ROWS: null,
    COLUMNS: null,
    SCORE: null,
    MOVES_LEFT: null,
    NUM_CANDY_TYPES: 6,
    BASE_SCORE: null,
    TARGET_SCORE: null,
    REWARDS: null,
    COMBOS: null,
    GAME_OVER: null,
    PERFECT_GAME: null
  }
  
  $scope.levelLoaded = false;
  
  $scope.imageUrl = null;
  
  // This is going to be our new level.
  $scope.level = null;
  
  $scope.movesLeft = null;
  
  $scope.score = null;
  
  $scope.maxScore = null;
  
  $scope.percent = '';
  
  // ==========================================================================
  
  // Load the JSON file that contains the level layout.
  var jsonFile = null;
  var configFile = 'config.json';
  
  if($routeParams.debug) {
    jsonFile = $routeParams.debug;
  } else {
    jsonFile = 'level.json';
  }
  
  file.load(jsonFile, function(response) {
    // Set global level data.
    $scope.GAME_BOARD.LAYOUT = response.layout;
    $scope.GAME_BOARD.ROWS = response.layout.length;
    $scope.GAME_BOARD.COLUMNS = response.layout[0].length;
    $scope.GAME_BOARD.SCORE = response.score;
    $scope.GAME_BOARD.MOVES_LEFT = response.movesLeft;
    $scope.GAME_BOARD.BASE_SCORE = response.baseScore;
    $scope.GAME_BOARD.TARGET_SCORE = response.targetScore;
    $scope.GAME_BOARD.REWARDS = response.rewards;
    $scope.GAME_BOARD.COMBOS = response.combos;
    $scope.GAME_BOARD.GAME_OVER = response.gameOver;
    $scope.GAME_BOARD.PERFECT_GAME = response.perfectGame;
    
    $scope.movesLeft = response.movesLeft;
    $scope.score = response.score;
    $scope.maxScore = response.targetScore;

    // Instantiate our new level.
    $scope.level = new Level($scope.GAME_BOARD);
    
    file.load(configFile, function(response) {
      $scope.imageUrl = response.imageUrl;
      cssInjector.add(response.cssUrl+"theme.css");
      $scope.levelLoaded = true;
    });
    
  });

}]);
