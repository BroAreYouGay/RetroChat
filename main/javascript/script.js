const socket = new WebSocket('ws://localhost:9999');

let username = '';  
let selectedAvatar = 'assets/avatar-1.png';  
let friends = [];  

//quand la connexion WebSocket est ouverte
socket.onopen = function() {
    console.log('Connecté au serveur WebSocket');
};

// fonction pour faire défiler le chat vers le bas
function scrollToBottom() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;  
}

// quand un message est reçu du serveur
socket.onmessage = function(event) {
    const data = event.data.split(':');  

    if (data[0] === 'userList') {  
        updateUserList(data[1]);  
    } else if (data[0] === 'friendList') {  
        const friendsData = data[1].split(';').map(friendData => {
            const [avatar, username] = friendData.split(',');
            return { avatar, username };
        });
        updateFriendsList(friendsData);  // mise à jour de la liste des amis
    } else if (data.length >= 4) {  
        const user = data[0];
        const message = data[1];
        const userAvatar = data[3];

        const messageDiv = document.createElement('div');
        const avatarImg = document.createElement('img');
        avatarImg.src = userAvatar && userAvatar.trim() !== '' ? userAvatar : 'assets/avatar-1.png';
        avatarImg.classList.add('avatar');
        
        avatarImg.style.width = '30px';
        avatarImg.style.height = '30px';
        avatarImg.style.borderRadius = '50%';
        
        messageDiv.textContent = `${user}: ${message}`;
        messageDiv.prepend(avatarImg);
        
        document.getElementById('messages').appendChild(messageDiv);
        scrollToBottom();
    } else {
        console.error('Format de message incorrect:', event.data);
    }
};

// Fonction pour mettre à jour la liste des utilisateurs
function updateUserList(userDataString) {
    const userListDiv = document.getElementById('user-list-container');
    userListDiv.innerHTML = '';  

    const users = userDataString.split(';');  
    users.forEach(userData => {
        const [avatar, user] = userData.split(',');
        const userDiv = document.createElement('div');
        
        const avatarImg = document.createElement('img');
        avatarImg.src = avatar;
        avatarImg.classList.add('avatar');
        
        avatarImg.style.width = '30px';
        avatarImg.style.height = '30px';
        avatarImg.style.borderRadius = '50%';
        
        userDiv.textContent = user;
        userDiv.prepend(avatarImg);  

        userListDiv.appendChild(userDiv);  
    });
}

//fonction pour mettre à jour la liste des amis
function updateFriendsList(friendsData) {
    const friendsListDiv = document.getElementById('friends-list-container');
    friendsListDiv.innerHTML = '';  

    friendsData.forEach(friend => {
        const friendDiv = document.createElement('div');
        friendDiv.classList.add('friend');
        
        const avatarImg = document.createElement('img');
        avatarImg.src = friend.avatar;
        
        const nameDiv = document.createElement('div');
        nameDiv.textContent = friend.username;
        
        friendDiv.appendChild(avatarImg);
        friendDiv.appendChild(nameDiv);
        friendsListDiv.appendChild(friendDiv);
    });
}

// formulaire de connexion
document.getElementById('usernameForm').addEventListener('submit', function(event) {
    event.preventDefault();
    username = document.getElementById('username').value;
    socket.send(`newUser:${username}:${selectedAvatar}`);
    document.getElementById('usernameForm').style.display = 'none';
    document.getElementById('formulaire').style.display = 'block';
});

// sélection de l'avatar
document.querySelectorAll('.avatar-option').forEach(avatar => {
    avatar.addEventListener('click', function() {
        document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
        this.classList.add('selected');
        selectedAvatar = this.getAttribute('data-avatar');
    });
});

// envoyer un message
document.getElementById('formulaire').addEventListener('submit', function(event) {
    event.preventDefault();
    const message = document.getElementById('message').value;
    socket.send(`message:${message}:${selectedAvatar}`);
    document.getElementById('message').value = '';
    scrollToBottom();
});

// ajouter un ami
document.getElementById('add-friend-btn').addEventListener('click', function() {
    const friendName = document.getElementById('add-friend').value.trim();
    if (friendName) {
        socket.send(`addFriend:${friendName}`);
        document.getElementById('add-friend').value = '';
    }
});
