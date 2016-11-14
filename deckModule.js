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
module.exports = deckModule;