function Player(id, name, spectator) {
    this.id = id;
    this.name = name || "newPlayer";
    this.spectator = spectator || false;
    this.bet = 0;
    this.taken = 0;
    this.points = 0;
    this.currentPlayer = false;
    this.hand = [];
    
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

module.exports = Player;