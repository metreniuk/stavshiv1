$(document).on('click', '.player-main .item', function() {
  $('.table').append(this);
  $(this).attr("data-new", 'true');
  $('.player-main .item').prop('disabled', true);
  //enable move button
  $('.move-btn').prop('disabled', false);
});

$(document).on('click', '.table .item', function() {
  $('.player-main .player-hand').append(this);
  $(this).removeAttr("data-new");
  $('.player-main .item').prop('disabled', false);
  //controling move
  $('.player-main').find('[data-controled="yes"]').prop('disabled', true);
  //disable move button
  $('.move-btn').prop('disabled', true);
});

var socket = io();
        socket.emit('connection');
        console.log('I am connected!');

        var mainPlayer = {};
        
        var opponents = [];
        
        var betSum = 10;
        var doubleMode = false;
        $('.move-btn').prop('disabled', true);
        $(document).ready(function() {
            $('#game-view').hide();

            //ready
            $("#readyBtn").click(function() {
                console.log('Ready!');
                socket.emit('ready', $("#nickname").val());
                $("#readyBtn").prop('disabled', true);   
            });  

            //BET
            $('#bet-btn').click(function() {
                socket.emit("betDone", $('#bet-val').val());
                $('.bet-section').hide();
                $('.player-main .bets').html("");
                var html = "<span class='bets-value'><span class='bets-taken'></span><span class='bets-made'>" + $('#bet-val').val() + "</span></span><p>Stavca</p>";
                $('.player-main .bets').append(html);
                console.log("My bet is " + $('#bet-val').val());
                mainPlayer.bet = $('#bet-val').val();
            });  

            //control bet
            $('#bet-val').change(function(){
                console.log("bet-val changed");
                if(parseInt($('#bet-val').val()) + betSum == 7) {
                    $('#bet-btn').prop('disabled', true);
                    console.log("The sum of all bets shouldn't be equal 7");
                } else {
                    $('#bet-btn').prop('disabled', false);    
                }
                    
            });

            //MOVE
            $('.player-main').on('click', '.move-btn', function () {
                console.log('btn clicked!');
                var currentItem = $('.table .item[data-new="true"]'); 
                console.log(currentItem);
                if(currentItem.attr('data-new')){
                    socket.emit('makeMove', currentItem.attr("data-id"));    
                    console.log("Your move is " + currentItem.attr("data-id"));
                    $('.table .item').prop('disabled', true);
                    $('.player-main .item').prop('disabled', true);
                }
                $('.move-btn').prop('disabled', true);
            });
        });

        //socket logic

        socket.on('setMainPlayer', function (newPlayer) {
            mainPlayer = newPlayer;
        });

        socket.on('sitToTable', function (player, opponentsInGame){
            //things to hide
            $('#intro').hide();
            $('.bet-section').hide();

            $('.player-main').attr('data-id', player.id);

            //"sitting" already existing opponents to table
            opponents = opponentsInGame;
            renderStartOpponents(opponents);

            $('#game-view').show();
            $('.player-main .player-name').text(player.name);
        });

        socket.on('opponentConnected', function (opponent) {
            opponents.push(opponent);
            console.log("Opponent " + opponent.name + " joined the game!");
            switch(opponents.length) {
                case 1:
                    $('#opponent0').find('.player-name').text(opponent.name);
                    $('#opponent0').attr('data-id', opponent.id);
                    $('#opponent0').addClass('active');
                    break;
                case 2:
                    $('#opponent1').find('.player-name').text(opponent.name);
                    $('#opponent1').attr('data-id', opponent.id);
                    $('#opponent1').addClass('active');
                    break;
                case 3:
                    $('#opponent2').find('.player-name').text(opponent.name);
                    $('#opponent2').attr('data-id', opponent.id);
                    $('#opponent2').addClass('active');
                    break;
            }
            console.log(opponents);
        });

        socket.on('opponentDisconnectedAfterStart', function (opponentId) {
            alert("Jucatorul " + findOpponent(opponentId).name + " a iesit din joc!");
            removeOpponent(opponentId);
            console.log("Opponent with id " + opponentId + " has been removed");
            socket.emit('restartGame');
            location.reload();
        });

        socket.on('opponentDisconnectedBeforeStart', function (opponentId) {
            removeOpponent(opponentId);
            $('.opponent-box').filter('[data-id="' + opponentId + '"]').find('.player-name').text("");
            $('.opponent-box').filter('[data-id="' + opponentId + '"]').find('.player-hand').html("");
            $('.opponent-box').filter('[data-id="' + opponentId + '"]').find('.player-info').html("");
            $('.opponent-box').filter('[data-id="' + opponentId + '"]').removeClass('active');
            $('.opponent-box').filter('[data-id="' + opponentId + '"]').removeAttr('data-id');
            console.log("Opponent with id " + opponentId + " has been removed");
        });

        socket.on('setHand', function (hand) {
            mainPlayer.hand = hand;
            console.log('My hand is: ');
            for (var i in mainPlayer.hand) {
                //set owner
                mainPlayer.hand[i].owner = mainPlayer.id;
                //draw player's hand with item's id in data-id
                var currentId = mainPlayer.hand[i].id;
                $('.player-main .player-hand').append(itemsHtml[currentId]);
                $('.player-main .item').prop('disabled', true);
                
                $('.opponent-box.active .player-hand').append("<div class='item'></div>");
            }

        });


        //bet process
        socket.on('askBet', function () {
            console.log('Make your bet!');
            $('.bet-section').show();
        });

        //opponent actions
        socket.on('opponentBet', function (opponentId, betVal) {
            console.log("Opponent with id " + opponentId + " just made a " + betVal + " bet");
            var html = '<span class="bets-value"><span class="bets-taken"></span><span class="bets-made">' + betVal + '</span></span><p>stavca</p>';
            $('.opponent-box').filter('[data-id="' + opponentId + '"]').find('.player-info .bets').html(html);
        });

        socket.on('opponentMove', function (opponentId, itemId) {
            $('.opponent-box').filter('[data-id="' + opponentId + '"]').find('.player-hand .item:last-child').remove();
            $('.table').append(itemsHtml[itemId]);
            $('.table').find('[data-id="' + itemId + '"]').prop('disabled', true);
        });

        //move process
        socket.on('askMove', function () {
            console.log("It's your turn. Make your best move!");
            $('.player-main .item').prop('disabled', false);
        });

        //control events
        socket.on('controlBet', function (gameBetSum) {
            betSum = gameBetSum;
            console.log(betSum);
        });

        socket.on('controlMove', function (gameDoubleMode){
            console.log('Control move event');
            if(gameDoubleMode){
                console.log("Now is a double mode");

                var noDoubles = true;
                //check on doubles in hand
                $('.player-main .player-hand .item').each(function() {
                    if ($(this).attr("data-id") == "00" || $(this).attr("data-id") == "11" || 
                        $(this).attr("data-id") == "22" || $(this).attr("data-id") == "33" ||
                        $(this).attr("data-id") == "44" || $(this).attr("data-id") == "55" ||
                        $(this).attr("data-id") == "66") {
                        noDoubles = false;
                    }
                });
                //disable no double items if there is doubles in hand
                if (!noDoubles) {
                    $('.player-main .player-hand .item').each(function () {
                        if($(this).attr("data-id") != "00" && $(this).attr("data-id") != "11" && 
                            $(this).attr("data-id") != "22" && $(this).attr("data-id") != "33" && 
                            $(this).attr("data-id") != "44" && $(this).attr("data-id") != "55" &&
                            $(this).attr("data-id") != "66") {
                            //need to disable this buttons
                            $(this).prop('disabled', true);
                            $(this).attr('data-controled', 'yes');
                        }
                    });    
                }   
            }  
        });

        socket.on('endCycle', function(winnerId, taken) {
            $('.table').html("");
            console.log("end of cycle");
            console.log(winnerId);
            $('.player-box').filter('[data-id="' + winnerId + '"]').find('.bets-taken').html(taken + '/');
        });

        socket.on('endRound' , function (players) {
            console.log('Round finished!');
            for (var i in players) {
                var player = $('.player-box').filter('[data-id="' + players[i].id + '"]');
                player.find('.bets-value').html('');
                player.find('.bets p').html('');
                player.find('.score').html('<span>' + players[i].points + '</span><p>points</p>');
                console.log(players[i] + ' ' + players[i].points);
                var mainPlayer = $('.player-main').filter('[data-id="' + players[i].id + '"]')
            }

        });
/*
        socket.on('showBets' , function (players) {
            console.log("Bets");
            $('#playersBets .players-names').html("");
            $('#playersBets').append('<tr></tr>');
            for(var i in players) {
                $('#playersBets .players-names').append("<th>" + players[i].name + "</th>");
                $('#playersBets tr:last').append("<td>" + players[i].bet + "</td>");
            }
        });

*/

        function findOpponent(opponentId) {
            for(var i in opponents) {
                if(opponentId == opponents[i].id)
                    return opponents[i];
            }
        }

        function removeOpponent(opponentId) {
              var index;
              opponents.filter(function(el, i) {
                if(el.id == opponentId)
                    index = i;
              });
              var removedOpponent = opponents.splice(index, 1);
              console.log("Player with id: " + opponentId + " has been removed from the game.");
              return removedOpponent;
        }

        function renderStartOpponents(opponents) {
            for(var i in opponents){
                var opponentByIndex = "#opponent" + i;
                $(opponentByIndex).find('.player-name').text(opponents[i].name);
                $(opponentByIndex).attr('data-id', opponents[i].id);
                $(opponentByIndex).addClass('active');


            }
        }
var itemsHtml = {
            "00": '<div class="item item-00" data-id="00"><div class="half half-0"></div><div class="delimeter"></div><div class="half half-0"></div></div>',
            "01": '<div class="item item-01" data-id="01"><div class="half half-1"><div class="dot"></div></div><div class="delimeter"></div><div class="half half-0"></div></div>',
            "02": '<div class="item item-02" data-id="02"><div class="half half-2"><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-0"></div></div>',
            "03": '<div class="item item-03" data-id="03"><div class="half half-3"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-0"></div></div>',
            "04": '<div class="item item-04" data-id="04"><div class="half half-4"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-0"></div></div>',
            "05": '<div class="item item-05" data-id="05"><div class="half half-5"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-0"></div></div>',
            "06": '<div class="item item-06" data-id="06"><div class="half half-6"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-0"></div></div>',
            "16": '<div class="item item-16" data-id="16"><div class="half half-6"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-1"><div class="dot"></div></div></div>',
            "26": '<div class="item item-26" data-id="26"><div class="half half-6"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-2"><div class="dot"></div><div class="dot"></div></div></div>',
            "36": '<div class="item item-36" data-id="36"><div class="half half-6"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-3"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "46": '<div class="item item-46" data-id="46"><div class="half half-6"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-4"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "56": '<div class="item item-56" data-id="56"><div class="half half-6"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-5"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "66": '<div class="item item-66" data-id="66"><div class="half half-6"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-6"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "15": '<div class="item item-15" data-id="15"><div class="half half-5"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-1"><div class="dot"></div></div></div>',
            "25": '<div class="item item-25" data-id="25"><div class="half half-5"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-2"><div class="dot"></div><div class="dot"></div></div></div>',
            "35": '<div class="item item-35" data-id="35"><div class="half half-5"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-3"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "45": '<div class="item item-45" data-id="45"><div class="half half-5"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-4"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "55": '<div class="item item-55" data-id="55"><div class="half half-5"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-5"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "14": '<div class="item item-14" data-id="14"><div class="half half-4"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-1"><div class="dot"></div></div></div>',
            "24": '<div class="item item-24" data-id="24"><div class="half half-4"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-2"><div class="dot"></div><div class="dot"></div></div></div>',
            "34": '<div class="item item-34" data-id="34"><div class="half half-4"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-3"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "44": '<div class="item item-44" data-id="44"><div class="half half-4"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-4"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "13": '<div class="item item-13" data-id="13"><div class="half half-3"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-1"><div class="dot"></div></div></div>',
            "23": '<div class="item item-23" data-id="23"><div class="half half-3"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-2"><div class="dot"></div><div class="dot"></div></div></div>',
            "33": '<div class="item item-33" data-id="33"><div class="half half-3"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-3"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>',
            "12": '<div class="item item-12" data-id="12"><div class="half half-2"><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-1"><div class="dot"></div></div></div>',
            "22": '<div class="item item-22" data-id="22"><div class="half half-2"><div class="dot"></div><div class="dot"></div></div><div class="delimeter"></div><div class="half half-2"><div class="dot"></div><div class="dot"></div></div></div>',
            "11": '<div class="item item-11" data-id="11"><div class="half half-1"><div class="dot"></div></div><div class="delimeter"></div><div class="half half-1"><div class="dot"></div></div></div>',



        };