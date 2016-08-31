//SERVER

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
   

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + "/public"));

http.listen(app.get('port'), function(){
  console.log('listening on :' + app.get('port'));
});





var deckModule = {
    createDeck: function() {
        function Item(value, id) {
            this.value = value;
            this.id = id;
            this.owner = null;
            this.isDouble = function() {
                if(this.value > 20) return true;
            };
        }

        var deck = [
            new Item(27, "00"),
            new Item(1, "01"), new Item(21, "11"),
            new Item(2, "02"), new Item(3, "12"), new Item(22, "22"),
            new Item(3, "03"), new Item(4, "13"), new Item(5, "23"), new Item(23, "33"),
            new Item(4, "04"), new Item(5, "14"), new Item(6, "24"), new Item(7, "34"), new Item(24, "44"),
            new Item(5, "05"), new Item(6, "15"), new Item(7, "25"), new Item(8, "35"), new Item(9, "45"), new Item(25, "55"),
            new Item(6, "06"), new Item(7, "16"), new Item(8, "26"), new Item(9, "36"), new Item(10, "46"), new Item(11, "56"), new Item(26, "66")
        ];
        return deck;
    },
    
    shuffle: function(a) {
        var j, x, i;
        for (i = a.length; i; i -= 1) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
        return a;
    },

    findItem: function(itemId) {

    }
};

function Game(deck) {
    this.deck = deck;
    this.players = [];
    //to keep the correct order
    this.initPlayers = [];
    this.spectators = [];
    this.table = [];
    this.betSum = 0;
    this.readyToStart = false;
    this.currentPlayer = {};
    this.betsOpen = false;
    this.movesOpen = false;
    this.innerCounter = 0;
    this.fullCycle = false;
    this.insideRoundCounter = 0;
    this.roundFinished = false;
    this.roundCounter = 1;
    this.gameFinished = false;
    //to identify if the very first move was a double
    this.firstMove = false;
    this.doubleMode = false;

    this.distrDeck = function() {
        //cloning the initial deck to keep it the same
        var workdeck = this.deck.slice(0);
        workdeck = deckModule.shuffle(workdeck);
        for (var i in this.players) {
            this.players[i].hand = workdeck.splice(0,7);
            //set owners
            for (var j in this.players[i].hand) {
                this.players[i].hand[j].owner = this.players[i].id;
            }
        }
    }
    
    this.askBet = function() {
        var betSum = 0;
        for (var i in this.players) {
            //TODO: implement the asking process
            var bet = parseInt(Math.random() * 10);
            this.players[i].makeBet(bet);
        }
        while (betSum == 7) {
            var bet = parseInt(Math.random() * 10);
            this.players[3].makeBet(bet);
        }
        
    }
    
    this.askMove = function () {
        this.table = [];
        for (var i in this.players) {
            //TODO: implement the asking process
            var choice = this.players[i].hand[0].id;
            this.table[i] = this.players[i].makeMove(choice);
        }
        
    }
    
    this.determineWinner = function() {
        var max = this.table[0].value;
        var maxItem = this.table[0];
        for (var i in this.table) {
            if(this.table[i].value > max) {
                max = this.table[i].value;
                maxItem = this.table[i];
            }
        }
        
        console.log("The biggest item is " + maxItem.id);

        var winnerId = maxItem.owner;

        for (var i in this.players) {
            if(winnerId == this.players[i].id) {
                this.players[i].taken++;
                console.log("Winner: " + this.players[i].name + " id: " + this.players[i].id);

            }
        }

        this.table = [];
        
        //return winner
        return winnerId;
    }
    
    this.distrPoints = function () {
        for (var i in this.players) {
            if(this.players[i].taken == this.players[i].bet) {
                this.players[i].won();
            }
            else {
                this.players[i].lost();
            }
        }
    }
    
    this.gameWinner = function() {
        var max = this.players[0].points;
        var maxPlayer = this.players[0];
        for (var i in this.players) {
            if(this.players[i].points > max) {
                max = this.players[i].points;
                maxPlayer = this.players[i];
                
            }
            console.log("Player: " + this.players[i].name + " id: " + this.players[i].id + "\tpoints:" + this.players[i].points);
        }
        return maxPlayer;
    }
    
    this.gameLooser = function() {
        var min = this.players[0].points;
        var minPlayer = this.players[0];
        for (var i in this.players) {
            if(this.players[i].points < min) {
                min = this.players[i].points;
                minPlayer = this.players[i];
                
            }        }
        return minPlayer;
    }
    
    this.showResults = function() {
        var gameWinner = this.gameWinner();
        var gameLooser = this.gameLooser();
        console.log("Game winner: " + gameWinner.name + " id: " + gameWinner.id + "\tpoints:" + gameWinner.points);
        console.log("Game looser: " + gameLooser.name + " id: " + gameLooser.id + "\tpoints:" + gameLooser.points);
    }
}



Game.prototype.addPlayer = function(player) {
  this.players.push(player);
  console.log("Player with id: " + player.id + " has been added in the game.");
};

Game.prototype.addSpectator = function(spectator) {
  this.spectators.push(spectator)
  console.log("Spectator with id: " + spectator.id + " has been added in the game as a spectator.");
};

//"find" functions

Game.prototype.findPlayer = function(playerId) {
    for(var i in this.players) {
        if(playerId == this.players[i].id)
            return this.players[i];
    }
};

Game.prototype.findItem = function(itemId) {
    for(var i in this.deck) {
        if(itemId == this.deck[i].id)
            return this.deck[i];
    }
};

Game.prototype.rotateInitPlayers = function() {
    this.initPlayers = arrayRotate(this.initPlayers, 1);
    this.players = this.initPlayers.slice();
    this.currentPlayer = this.players[0];
};

Game.prototype.rotatePlayers = function() {
    this.players = arrayRotate(this.players, 1);
    this.currentPlayer = this.players[0];
};

Game.prototype.nextPlayer = function() {
    this.rotatePlayers();
    this.innerCounter++;
    this.checkFullCycle(this.players.length);
};

Game.prototype.checkFullCycle = function(numOfPlayers) {
    if(this.innerCounter == numOfPlayers) {
        this.innerCounter = 0;
        this.fullCycle = true;
    }
};

Game.prototype.addBet = function(betVal) {
    this.betSum += betVal;
    return betVal;    
};

//"start"/"finish" functions

Game.prototype.finishBets = function() {
    this.betsOpen = false;
    this.movesOpen = true;
};

Game.prototype.finishMoves = function() {
    this.movesOpen = false;
};

Game.prototype.removeBets = function() {
    for(var i in this.players[i]) {
        this.players[i].bet = 0;
    }
};

//"show" functions

Game.prototype.showPlayers = function() {
  console.log("Players:");
  for(var i in this.players) {
    console.log(this.players[i].name)
  }
};

Game.prototype.showPlayersBets = function() {
  console.log("Players bets:");
  for(var i in this.players) {
    console.log(this.players[i].name + " - " + this.players[i].bet);
  }
};

Game.prototype.showPlayersPoints = function() {
  console.log("Players points:");
  for(var i in this.players) {
    console.log(this.players[i].name + " - " + this.players[i].points + " with the bet " + this.players[i].bet);
  }
};

Game.prototype.showTable = function() {
  console.log("Table:");
  for(var i in this.table) {
    console.log(this.table[i].id + " - " + game.findPlayer(this.table[i].owner).name);
  }
};

Game.prototype.isFree = function() {
  if (this.players.length < 4)
    return true
  else
    return false;
};

function Player(id, name, spectator) {
    this.id = id;
    this.name = name;
    this.bet = 0;
    this.taken = 0;
    this.points = 0;
    this.currentPlayer = false;
    this.hand = [];
    this.spectator = spectator;
    
    this.makeBet = function(bet) {
        return this.bet = bet;
    }
    
    this.makeMove = function(item, game) {
        game.table.push(item);
    }
    
    this.won = function() {
        this.points += this.bet * 10;
        if(this.bet == 0) this.points += 10;
    }
    
    this.lost = function() {
        this.points -= this.bet * 10;
        if(this.bet == 0) this.points -= 10;
    }
    
}


var game = new Game(deckModule.createDeck());

io.on('connection', function (client) {  
  
  client.on('connection', function() {
    console.log("user with id: " + client.id + " has been connected.");
    
  });

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

    client.broadcast.emit('opponentMove', client.id);

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
        console.log();
        //rotate players array so winner move first
        for(var i in game.players) {
            if(game.players[i].id == winnerId){
                game.showPlayers();
                arrayRotate(game.players, i);
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
            io.sockets.emit('showPoints', game.players);
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


//Usefull functions
function arrayRotate(arr, count) {
  count -= arr.length * Math.floor(count / arr.length);
  arr.push.apply(arr, arr.splice(0, count));
  return arr;
}

/*
//Game
for (var r = 0; r < 2; r++) {

    console.log("\t\t Round " + r + ":");
    game.distrDeck(deck);

    game.askBet();
    //Round
    for (var i = 0; i < 7; i++) {
        console.log("hand:");
        for (var k in game.players) {
            console.log("player: " + game.players[k].name + " id: " + game.players[k].id + "\n");
            for(var p in game.players[k].hand) {
                process.stdout.write(game.players[k].hand[p].id + " "); 
            }
            process.stdout.write("\nlength: " + game.players[k].hand.length + "\n");
        }
        console.log("\tCycle " + i + ":");
        game.askMove();
        console.log("\ntable");
        for (var j in game.table) {
            process.stdout.write(game.table[j].id + " ");
        }
        console.log("\n");
    }
    game.determineWinner();
        
    game.distrPoints();

    console.log("\nbets");
    for (var i in game.players) {
        process.stdout.write(game.players[i].bet + " ");
    }
    console.log("\n");
    
    //taken
    console.log("\ntaken");
        for (var i in game.players) {
            process.stdout.write(game.players[i].taken + " ");
        }
    console.log("\n");
    
    //distr points
    console.log("\npoints");
    for (var i in game.players) {
        process.stdout.write(game.players[i].points + " ");
    }
    console.log("\n");
}
game.showResults();
*/
Object.size = function(obj) {  
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};