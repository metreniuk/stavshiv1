var deckModule = require('./deckModule');
var deck = deckModule.createDeck();
var useful = require('./useful');

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

//add/remove functions

Game.prototype.addBet = function(betVal) {
    this.betSum += betVal;
    return betVal;    
};

Game.prototype.addPlayer = function(player) {
  this.players.push(player);
  console.log("Player with id: " + player.id + " has been added in the game.");
};

Game.prototype.addSpectator = function(spectator) {
  this.spectators.push(spectator)
  console.log("Spectator with id: " + spectator.id + " has been added in the game as a spectator.");
};

Game.prototype.removePlayer = function(playerId) {
  var index;
  this.players.filter(function(el, i) {
    if(el.id == playerId)
        index = i;
  })
  var removedPlayer = this.players.splice(index, 1);
  this.showPlayers();
  console.log("Player with id: " + playerId + " has been removed from the game.");
  this.showPlayers();
  return removedPlayer;
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
    this.initPlayers = useful.arrayRotate(this.initPlayers, 1);
    this.players = this.initPlayers.slice();
    this.currentPlayer = this.players[0];
};

Game.prototype.rotatePlayers = function() {
    this.players = useful.arrayRotate(this.players, 1);
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
    console.log(this.table[i].id + " - " + this.findPlayer(this.table[i].owner).name);
  }
};

Game.prototype.isFree = function() {
  if (this.players.length < 4)
    return true
  else
    return false;
};

module.exports = Game;