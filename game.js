
var deckModule = {
    createItems: function() {
        function Item(value, id) {
            this.value = value;
            this.id = id;
            this.owner = null;
        }
        
        var deck = [
                [new Item(27, "00")],
                [new Item(1, "01"), new Item(21, "11")],
                [new Item(2, "02"), new Item(3, "12"), new Item(22, "22")],
                [new Item(3, "03"), new Item(4, "13"), new Item(5, "23"), new Item(23, "33")],
                [new Item(4, "04"), new Item(5, "14"), new Item(6, "24"), new Item(7, "34"), new Item(24, "44")],
                [new Item(5, "05"), new Item(6, "15"), new Item(7, "25"), new Item(8, "35"), new Item(9, "45"), new Item(25, "55")],
                [new Item(6, "06"), new Item(7, "16"), new Item(8, "26"), new Item(9, "36"), new Item(10, "46"), new Item(11, "56"), new Item(26, "66")]
            ];
        return deck;
    },
    
    createDeck: function() {
        var items = this.createItems();
        var deck = [];
        
        for (var i = 0; i < items.length; i++) {
            for (var j = 0; j < items[i].length; j++) {
                deck.push(items[i][j]);
            }
        }
        deck = this.shuffle(deck);
        
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
    }
};

function Game(players) {
    this.players = players;
    this.table = [];
    
    this.distrDeck = function(deck) {
        //cloning the initial deck to keep it the same
        var workdeck = deck.slice(0);
        workdeck = deckModule.shuffle(workdeck);
        for (var i in this.players) {
            this.players[i].hand = workdeck.splice(0,7);
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
        
        var winnerId = maxItem.owner;
        for (var i in this.players) {
            if(winnerId == this.players[i].id) {
                this.players[i].taken++;
                console.log("winner: " + this.players[i].name + " id: " + this.players[i].id);
            }
        }
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

function Player(id, name) {
    this.id = id;
    this.name = name;
    this.bet = 0;
    this.taken = 0;
    this.points = 0;
    this.currentPlayer = false;
    this.hand = [];
    
    this.makeBet = function(bet) {
        this.bet = bet;
    }
    
    this.makeMove = function(choice) {
        var workhand = this.hand.slice(0);
        for (var i in workhand) {
            if (choice == workhand[i].id) {
                //splice return an array even if there is one el - good lesson!
                var arr = workhand.splice(i, 1);
                this.hand.shift();
                return arr[0];
            }
        }
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


var player1 = new Player(1, 'alex');
var player2 = new Player(2, 'dan');
var player3 = new Player(3, 'eugen');
var player4 = new Player(4, 'dima');

var players = [player1, player2, player3, player4];

var game = new Game(players);

var items = deckModule.createItems();

var deck = deckModule.createDeck();

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
/*
game.askMove();

game.determineWinner();
*/

//TESTING
/*
//deck
    for(var i in deck) {
        process.stdout.write(deck[i].value + " "); 
    }
    
    console.log("length: " + deck.length);

//hand
console.log("hand:");
    for (var i in game.players) {
        for(var j in game.players[i].hand) {
            process.stdout.write(game.players[i].hand[j].value + " "); 
        }
        console.log(game.players[i].hand.length);
    }
*/

//bet process
