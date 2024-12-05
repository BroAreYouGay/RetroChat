const socket = new WebSocket('ws://localhost:9999');

let username = '';  
let selectedAvatar = 'assets/avatar-1.png';  

// quand la connexion WebSocket est ouverte
socket.onopen = () => console.log('connecté au serveur WebSocket');

// fonction pour faire défiler le chat vers le bas
const scrollToBottom = () => {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;  
};

// gestion des messages reçus du serveur
socket.onmessage = event => {
    const data = event.data.split(':');  

    if (data[0] === 'userList') {
        updateUserList(data[1]);  // mise à jour des utilisateurs
    } else if (data[0] === 'friendList') {
        updateFriendsList(data[1].split(';').map(friend => {
            const [avatar, username] = friend.split(',');
            return { avatar, username };
        }));  // mise à jour des amis
    } else if (data.length >= 4) {  
        const [user, message, , userAvatar] = data;
        const messageDiv = document.createElement('div');
        const avatarImg = document.createElement('img');
        
        avatarImg.src = userAvatar.trim() || 'assets/avatar-1.png';
        avatarImg.classList.add('avatar');
        avatarImg.style.width = avatarImg.style.height = '30px';
        avatarImg.style.borderRadius = '50%';
        
        messageDiv.textContent = `${user}: ${message}`;
        messageDiv.prepend(avatarImg);
        
        document.getElementById('messages').appendChild(messageDiv);
        scrollToBottom();
    } else {
        console.error('format de message incorrect:', event.data);
    }
};

// mettre à jour la liste des utilisateurs
const updateUserList = (userDataString) => {
    const userListDiv = document.getElementById('user-list-container');
    userListDiv.innerHTML = '';  

    userDataString.split(';').forEach(userData => {
        const [avatar, user] = userData.split(',');
        const userDiv = document.createElement('div');
        
        const avatarImg = document.createElement('img');
        avatarImg.src = avatar;
        avatarImg.classList.add('avatar');
        avatarImg.style.width = avatarImg.style.height = '30px';
        avatarImg.style.borderRadius = '50%';
        
        userDiv.textContent = user;
        userDiv.prepend(avatarImg);  

        userListDiv.appendChild(userDiv);  
    });
};

// mettre à jour la liste des amis
const updateFriendsList = (friendsData) => {
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
};

// formulaire de connexion
document.getElementById('usernameForm').addEventListener('submit', event => {
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
document.getElementById('formulaire').addEventListener('submit', event => {
    event.preventDefault();
    const message = document.getElementById('message').value;
    socket.send(`message:${message}:${selectedAvatar}`);
    document.getElementById('message').value = '';
    scrollToBottom();
});

// ajouter un ami
document.getElementById('add-friend-btn').addEventListener('click', () => {
    const friendName = document.getElementById('add-friend').value.trim();
    if (friendName) {
        socket.send(`addFriend:${friendName}`);
        document.getElementById('add-friend').value = '';
    }
});
