# How to install

You will need angular to be able to run the game. So just bootstrap angular, copy over the app/game, app/images, app/stylesheets, app/vendors, app/level.json and make sure all is linked up.
Make sure the Game module is injected and loaded, rename it if necessary.

# Making different levels

Level layout is stored in the app/level.json file. '0' are empty spaces, '1' are tiles where candies will randomly generate. Make sure to make an empty '0' border all around the gameboard! That is very important. The code needs that empty border to generate the game board properly (although the game won't break just will look broken). You can make as wide or as tall as you like, game will automatically size everything properly. You can even have separated game boards! You can also change all other game aspects from that json file.

# Testing

Just insert ```?debug=test.json``` at the end of the url. The ```test.json``` is the name of the json test file and should be located in the app folder.
The ```test.json``` files ```layout``` can contain these numbers:
* 1-5: the 5 candy type.
* 6: horizontal type 1 special candy
* 7: vertical type 1 special candy
* 8: aoe type 1 special candy
* 9: bomb special candy

The game will look a bit off (margin-top: -30px, margin-left: -30px) and the game board background is wrong, don't worry about it. It is caused because you can't have 0's in the test.json, thus it will generate a messed up board bg and the game board will get offset by the css. But the game works normally.

# Game system

* app/game.js: The Game module and routing.
* app/game.html: The actual html for the game.
* app/controller.js: The controller for the game, the glue between view and logic.
* app/directive.js: All the view related functions are here.

More coming soon.