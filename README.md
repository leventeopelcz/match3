# Install Dependencies

Get Node.js and npm: `http://nodejs.org/`

Now you can install bower
```
npm install -g bower
```

First time run 
```
npm install
```

# Run the Application

Start the server 
```
npm start
```

Now browse to the game: `http://localhost:8000/app/index.html`

# Making different levels

Level layout is stored in the app/level.json file. '0' are empty spaces, '1' are tiles where candies will randomly generate. Make sure to make an empty '0' border all around the gameboard! That is very important. The code needs that empty border to generate the game board properly (although the game won't break just will look broken). You can make as wide or as tall as you like, game will automatically size everything properly. You can even have separated game boards! You can also change all other game aspects from that json file.

# Testing

Just insert ```?debug=test.json``` at the end of the url. The ```test.json``` is the name of the json test file and should be located in the app folder.
The ```test.json``` files ```layout``` can contain these numbers:

* 0: no tile.
* 1-5: the 5 candy type.
* 6: horizontal type 1 special candy
* 7: vertical type 1 special candy
* 8: aoe type 1 special candy
* 9: bomb special candy

The original game board background is turned off in debug mode.

# Game system

* app/game.js: The Game module and routing.
* app/game.html: The actual html for the game.
* app/controller.js: The controller for the game, the glue between view and logic.
* app/directive.js: All the view related functions are here.

More coming soon.