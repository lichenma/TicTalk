'use strict';
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var usernamePage = document.querySelector('#username-page');
var gamePage = document.querySelector('#game-page');

var stompClient = null;
var username=null;
var Id=null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];


async function connect() {
    await sleep(300);
    const Url = '/player/logged'; 
    console.log(Url);
    $.ajax({
        url: Url,
        type:"GET",
        success: function(data){
            username=data.object.userName;

            if(username){

                //usernamePage.classList.add('hidden');
                //gamePage.classList.remove('hidden');
                var socket = new SockJS('/ws');
                stompClient = Stomp.over(socket);
                stompClient.connect({}, onConnected, onError);
            }
        },
        error: function(error){
            console.log(`Error ${error}`);
        }
    })
    //username= document.querySelector('#name').value.trim();
}


function onConnected() {
    //////////////////////////////////////////////////////////////////////////////////
    // the topic we subscribe to will be determined from the url - namely the game Id 
    // we can write up a service call to get it but I don't know if we ened it
    //////////////////////////////////////////////////////////////////////////////////
    
    var Url= window.location.href;
    Id = Url.substring(Url.lastIndexOf("/")+1, Url.length);

    // subscribe to the specific game topic
    stompClient.subscribe('/topic/'+Id, onMessageReceived);

    // send username to server
    stompClient.send("/app/chat.addUser/"+Id,
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )
    angular.element(document.getElementById('game-page')).rootScope().playerId = username;
}


function onError(error) {

}


function sendMessage(event) {

    var messageContent = messageInput.value.trim();
    if (messageContent && stompClient) {

        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };

        stompClient.send("/app/chat.sendMessage/"+Id, {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }

    event.preventDefault();
}


function onMessageReceived(payload) {

    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');
    messageElement.style.fontSize= '0.8em';
    if (message.type === 'JOIN') {

        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';

        console.log(angular.element(document.getElementById('game-page')).scope());
        angular.element(document.getElementById('game-page')).scope().updateConfig();
        angular.element(document.getElementById('game-page')).scope().$apply();

    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content=message.sender + ' left!';
        
    } else if (message.type === 'MOVE') {
        messageElement.classList.add('event-message');
        message.content=message.sender + ' made a move!';

        console.log(angular.element(document.getElementById('game-page')).scope());
        angular.element(document.getElementById('game-page')).scope().update();
        angular.element(document.getElementById('game-page')).scope().$apply();

    } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {

    var hash = 0;
    for (var i=0; i<messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index=Math.abs(hash % colors.length);
    return colors[index];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
//messageForm.addEventListener('submit', connect, true);
connect();