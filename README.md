# How to install

You will need angular to be able to run the game. So just bootstrap angular, copy over the app/game, app/images, app/stylesheets, app/vendors, app/level.json and make sure all is linked up.
Make sure the Game module is injected and loaded, rename it if necessary.

# Making different levels

Level layout is stored in the app/level.json file. '0' are empty spaces, '1' are tiles where candies will randomly generate. Make sure to make an empty '0' border all around the gameboard! That is very important. The code needs that empty border to generate the game board properly (although the game won't break just will look broken). You can make as wide or as tall as you like, game will automatically size everything properly. You can even have separated game boards! You can also change all other game aspects from that json file.

# Game system

app/game.js: The Game module and routing.
app/game.html: The actual html for the game.
app/controller.js: The controller for the game, the glue between view and logic.
app/directive.js: All the view related functions are here.

More coming soon.