//SERVER

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);   


var deckModule = require('./src/js/deckModule');
var deck = deckModule.createDeck();
var Game = require('./src/js/game');
var Player = require('./src/js/player');
var useful = require('./src/js/useful');
var game = new Game(deck);

app.set('port', (process.env.PORT || 5000));

app.use(express.static("./public"));

http.listen(app.get('port'), function(){
  console.log('listening on :' + app.get('port'));
});

io.on('connection', function (client) {  
  
  client.on('restartGame', function () {
    game = new Game(deck);
  });  

  client.on('connection', function() {
    console.log("user with id: " + client.id + " has been connected.");
    
  });

  client.on('disconnect', function() {
    console.log("Client with id " + client.id + " has been disconnected");
    game.removePlayer(client.id);
    if(game.readyToStart)
        client.broadcast.emit('opponentDisconnectedAfterStart', client.id)
    else
        client.broadcast.emit('opponentDisconnectedBeforeStart', client.id)
  })

  client.on('ready', function(nickname) {
    if(game.isFree()) {
      var newPlayer = new Player(client.id, nickname, false); 
      //it's important that this 'emit' is before addPlayer method
      client.emit('sitToTable', newPlayer, game.players);
      game.addPlayer(newPlayer);
      client.emit('setMainPlayer', newPlayer);
      
      /*
      game.addPlayer(newPlayer);
      game.addPlayer(newPlayer);
      game.addPlayer(newPlayer);
      */
      
      game.showPlayers();
      client.broadcast.emit("opponentConnected", newPlayer);

      if(game.players.length == 2 ) {
         game.readyToStart = true;
         //Game begins!
         console.log("The game begins!");
         game.betsOpen = true;
         game.currentPlayer = game.players[0];
         console.log("Current player is " + game.currentPlayer.name);  //works

         game.initPlayers = game.players.slice();

         //start the very first round
         game.distrDeck();

         //distr deck and emit it
         for( var i in game.players) {
            io.to(game.players[i].id).emit('setHand', game.players[i].hand);   
         }
         
         //askBet for the current player
         io.to(game.currentPlayer.id).emit('askBet');
      }
    } else {
      game.addSpectator(new Player(client.id, nickname, true))
      game.showPlayers();
    };
  });

  client.on('betDone', function (betVal) {
    console.log("Current player's bet is ");
    console.log(game.addBet(game.findPlayer(client.id).makeBet(parseInt(betVal))));
    client.broadcast.emit('opponentBet', client.id, betVal);
    game.nextPlayer();
    
    //control last bet to not equal 7
    if(game.innerCounter == game.players.length - 1){
        console.log(game.betSum);
        io.to(game.currentPlayer.id).emit('controlBet', game.betSum);
    }
        


    //finishing bet process and starting move process
    if(game.fullCycle == true) {
        game.fullCycle = false;
        game.finishBets();

        io.sockets.emit('showBets', game.players);

        //first move
        game.firstMove = true;
        io.to(game.currentPlayer.id).emit('askMove');
        console.log("Moving process started!");
    } else {
        io.to(game.currentPlayer.id).emit('askBet');
        game.showPlayersBets();
        console.log("Inner counter in bets: " + game.innerCounter);    
    }
  });

  client.on('makeMove', function(itemId) {

    var item = game.findItem(itemId);
    console.log("Player " + game.findPlayer(item.owner).name + " add to table " + item.id);
    game.findPlayer(item.owner).makeMove(item, game);

    //dealing with doubleMode
    if(game.firstMove == true) {
        game.firstMove = false;
        if( item.isDouble() ) game.doubleMode = true;
    }

    game.nextPlayer();

    client.broadcast.emit('opponentMove', client.id, itemId);

    if(game.fullCycle == true) {
        game.fullCycle = false;
        game.doubleMode = false;
        //next move will be first
        game.firstMove == true;
        game.finishMoves();
        game.showTable();
        console.log("inner counter " + game.innerCounter);

        //this method returns winnerId

        var winnerId = game.determineWinner();
        var taken = game.findPlayer(winnerId).taken
        io.sockets.emit('endCycle', winnerId, taken);
        console.log();
        //rotate players array so winner move first
        for(var i in game.players) {
            if(game.players[i].id == winnerId){
                game.showPlayers();
                useful.arrayRotate(game.players, i);
                //set current player
                game.currentPlayer = game.players[0];
                console.log("Array rotated by " + i);
                game.showPlayers();
            }
                

        }

        game.insideRoundCounter++;

        //end of the round
        if(game.insideRoundCounter == 7) {
            //show that round is finished
            game.roundFinished = true;
            game.insideRoundCounter = 0;
            
            console.log("Round " + game.roundCounter + " is finished!");
            game.distrPoints();
            io.sockets.emit('endRound', game.players);
            game.showPlayersPoints();

            // at the end of a round
            game.roundCounter++;
            
            
            //end of the game
            if(game.roundCounter > 3) {

                console.log("The game is finished!");
                game.showPlayersPoints();
                io.sockets.emit("endGame", game.players);

            } else {  
                
                game.distrDeck();

                 //distr deck and emit it
                 for( var i in game.players) {
                    io.to(game.players[i].id).emit('setHand', game.players[i].hand);   
                 }
            

            //start a new round
            //keep the correct order
            game.rotateInitPlayers();

            console.log("This is round nr. " + game.roundCounter);
            game.removeBets();
            io.to(game.currentPlayer.id).emit('askBet');
            }

        } else {
            io.to(game.currentPlayer.id).emit('askMove');
            io.to(game.currentPlayer.id).emit('controlMove', game.doubleMode);
            game.firstMove = true;

        }

    } else {
        io.to(game.currentPlayer.id).emit('askMove');
        io.to(game.currentPlayer.id).emit('controlMove', game.doubleMode);
        
        game.showTable();
        console.log("inner counter " + game.innerCounter);    
    }
  
  })


});
