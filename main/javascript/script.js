const socket = new WebSocket('ws://localhost:9999');

let username = '';  
let selectedAvatar = 'assets/avatar-1.png';  

// lorsque la connexion WebSocket est ouverte
socket.onopen = () => console.log('connecté au serveur websocket');

// fonction pour faire défiler l'écran jusqu'en bas des messages
const scrollToBottom = () => {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;  
};

// gestion des messages reçus du serveur
socket.onmessage = event => {
    const data = event.data.split(':');  

    // selon le type de message reçu
    switch (data[0]) {
        case 'userList':
            updateUserList(data[1]);  
            break;
        case 'friendList':
            const friends = data[1]
                .split(';')
                .filter(friend => friend) // évite les entrées vides
                .map(friend => {
                    const [avatar, username] = friend.split(',');
                    return { avatar, username };
                });
            updateFriendsList(friends);  
            break;
        case 'addFriendSuccess':
            alert(`demande d'ami envoyée avec succès à ${data[1]}`);
            break;
        case 'addFriendError':
            alert(`erreur : ${data[1]}`);
            break;
        case 'friendRequest':
            // affiche la demande d'ami reçue
            const requester = data[1];
            showFriendRequest(requester);
            break;
        default:
            if (data.length >= 4) {  
                const [user, message, , userAvatar] = data;
                displayMessage(user, message, userAvatar);
            } else {
                console.error('format de message incorrect:', event.data);
            }
            break;
    }
};

// met à jour la liste des utilisateurs
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

// met à jour la liste des amis
const updateFriendsList = (friendsData) => {
    const friendsListDiv = document.getElementById('friends-list-container');
    friendsListDiv.innerHTML = '';  

    friendsData.forEach(friend => {
        const friendDiv = document.createElement('div');
        friendDiv.classList.add('friend');
        
        const avatarImg = document.createElement('img');
        avatarImg.src = friend.avatar;
        avatarImg.style.width = avatarImg.style.height = '30px';
        avatarImg.style.borderRadius = '50%';
        
        const nameDiv = document.createElement('div');
        nameDiv.textContent = friend.username;
        
        friendDiv.appendChild(avatarImg);
        friendDiv.appendChild(nameDiv);
        friendsListDiv.appendChild(friendDiv);
    });
};

// affichage des messages dans la fenêtre de chat
const displayMessage = (user, message, avatar) => {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    const avatarImg = document.createElement('img');
    
    avatarImg.src = avatar || 'assets/avatar-1.png';
    avatarImg.classList.add('avatar');
    avatarImg.style.width = avatarImg.style.height = '30px';
    avatarImg.style.borderRadius = '50%';
    
    messageDiv.textContent = `${user}: ${message}`;
    messageDiv.prepend(avatarImg);
    
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
};

// formulaire pour l'inscription de l'utilisateur
document.getElementById('usernameForm').addEventListener('submit', event => {
    event.preventDefault();
    username = document.getElementById('username').value;

    if (username.trim()) {
        socket.send(`newUser:${username}:${selectedAvatar}`);
        document.getElementById('usernameForm').style.display = 'none';
        document.getElementById('formulaire').style.display = 'block';
    } else {
        alert('veuillez entrer un pseudo valide.');
    }
});

// sélection de l'avatar
document.querySelectorAll('.avatar-option').forEach(avatar => {
    avatar.addEventListener('click', function() {
        document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
        this.classList.add('selected');
        selectedAvatar = this.getAttribute('data-avatar');
    });
});

// envoi d'un message
document.getElementById('formulaire').addEventListener('submit', event => {
    event.preventDefault();
    const message = document.getElementById('message').value;
    socket.send(`message:${message}:${selectedAvatar}`);
    document.getElementById('message').value = '';
    scrollToBottom();
});

// envoi de la demande d'ami
document.getElementById('addFriendForm').addEventListener('submit', event => {
    event.preventDefault();
    const friendName = document.getElementById('friend-username').value.trim();
    console.log('tentative d’ajout d’ami :', friendName);

    if (friendName) {
        socket.send(`addFriend:${friendName}`);
        console.log('demande envoyée au serveur');
        document.getElementById('friend-username').value = '';
    } else {
        console.log('nom d’ami non valide ou vide');
    }
});

// affichage de la demande d'ami reçue
const showFriendRequest = (requester) => {
    const requestsListDiv = document.getElementById('friend-requests-list');
    const requestDiv = document.createElement('div');
    requestDiv.classList.add('friend-request');
    requestDiv.textContent = `${requester} vous a envoyé une demande d'ami`;

    // boutons d'acceptation et de refus
    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'accepter';
    acceptBtn.addEventListener('click', () => handleFriendRequest(requester, 'accept'));

    const rejectBtn = document.createElement('button');
    rejectBtn.textContent = 'refuser';
    rejectBtn.addEventListener('click', () => handleFriendRequest(requester, 'reject'));

    requestDiv.appendChild(acceptBtn);
    requestDiv.appendChild(rejectBtn);
    
    requestsListDiv.appendChild(requestDiv);
};

// traitement des demandes d'ami (accepter ou refuser)
const handleFriendRequest = (requester, action) => {
    if (action === 'accept') {
        socket.send(`acceptFriend:${requester}`);
    } else if (action === 'reject') {
        socket.send(`rejectFriend:${requester}`);
    }

    // supprime la demande d'ami après avoir accepté ou refusé
    const requestDiv = Array.from(document.querySelectorAll('.friend-request'))
        .find(div => div.textContent.includes(requester)); // trouve la demande d'ami par son texte
    if (requestDiv) {
        requestDiv.remove(); // supprime l'élément de la demande d'ami
    }
};
