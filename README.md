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

# Themes

There is a config.json that has an image assets url and a css url in it. For some image assets you need to change the urls in the css file too to take effect.
Also extended the level.json file with all the text that can appear in the game.
So all you need to do is replace the image and css assets and apply the proper url for them to use a new theme.
