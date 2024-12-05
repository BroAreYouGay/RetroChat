const WebSocket = require('ws');  // on importe la bibliothèque WebSocket

// crée un serveur WebSocket qui écoute sur le port 9999
const server = new WebSocket.Server({ port: 9999 });

const clients = new Map();  // crée une Map pour stocker les utilisateurs connectés, avec leur socket
const friendsList = new Map();  // Map pour stocker les amis de chaque utilisateur

// lorsque un utilisateur se connecte au serveur
server.on('connection', (socket) => {
    console.log('un utilisateur s\'est connecté.');  // affiche dans la console qu'un utilisateur s'est connecté

    // écouter les messages envoyés par l'utilisateur
    socket.on('message', (message) => {
        const [type, ...data] = message.toString().split(':');  // on divise le message en parties séparées par ":"

        if (type === 'newUser') {  // si le type du message est "newUser", c'est un nouvel utilisateur
            const username = data[0];  // récupère le nom d'utilisateur
            const avatar = data[1];  // récupère l'avatar de l'utilisateur
            clients.set(socket, { username, avatar });  // on stocke l'utilisateur et son avatar
            friendsList.set(username, []);  // initialiser la liste des amis de l'utilisateur

            // diffuser la liste des utilisateurs connectés à tous les clients
            broadcastUserList();
        } else if (type === 'message') {  // sinon, c'est un message d'un utilisateur
            const clientInfo = clients.get(socket);  // récupère les informations de l'utilisateur
            if (clientInfo) {  // si l'utilisateur existe
                const { username, avatar } = clientInfo;  // on extrait le nom d'utilisateur et l'avatar

                // diffuser le message à tous les utilisateurs
                broadcastMessage(`${username}:${data.join(':')}:${avatar}`);
            }
        } else if (type === 'addFriend') {  // si le message est de type "addFriend"
            const clientInfo = clients.get(socket);  // récupère les informations de l'utilisateur
            if (clientInfo) {
                const { username } = clientInfo;
                const friendName = data[0];  // nom de l'ami à ajouter
                
                // Si l'ami est valide et pas déjà dans la liste des amis
                if (friendName && friendName !== username && !friendsList.get(username).includes(friendName)) {
                    // Ajouter l'ami à la liste
                    friendsList.get(username).push(friendName);
                    // Envoyer la nouvelle liste d'amis à l'utilisateur
                    sendFriendList(socket, username);
                    // Diffuser la liste des amis aux autres utilisateurs
                    broadcastFriendList();
                }
            }
        }
    });

    // lorsque l'utilisateur se déconnecte
    socket.on('close', () => {
        console.log('un utilisateur s\'est déconnecté.');  // on affiche que l'utilisateur s'est déconnecté
        const clientInfo = clients.get(socket);
        if (clientInfo) {
            // Supprimer l'utilisateur de la liste des clients et des amis
            const { username } = clientInfo;
            friendsList.delete(username);  // retirer l'utilisateur des amis
        }
        clients.delete(socket);  // on retire l'utilisateur de la liste des clients
        broadcastUserList();  // on met à jour la liste des utilisateurs pour tous les clients
    });
});

// fonction pour diffuser un message à tous les clients connectés
function broadcastMessage(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {  // vérifier si le client est connecté
            client.send(message);  // envoyer le message au client
        }
    });
}

// fonction pour diffuser la liste des utilisateurs connectés
function broadcastUserList() {
    // on crée une liste d'utilisateurs avec leur avatar et nom
    const userList = Array.from(clients.values())
        .map(({ username, avatar }) => `${avatar},${username}`)
        .join(';');

    // envoyer la liste des utilisateurs à tous les clients
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(`userList:${userList}`);
        }
    });
}

// fonction pour envoyer la liste d'amis à un utilisateur
function sendFriendList(socket, username) {
    const friends = friendsList.get(username);
    const friendListString = friends.join(';');  // convertit la liste des amis en chaîne de caractères

    // envoyer la liste des amis au client
    socket.send(`friendList:${friendListString}`);
}

// fonction pour diffuser la liste des amis à tous les utilisateurs
function broadcastFriendList() {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            const clientInfo = clients.get(client);
            if (clientInfo) {
                const { username } = clientInfo;
                const friends = friendsList.get(username);
                const friendListString = friends.join(';');
                client.send(`friendList:${friendListString}`);
            }
        }
    });
}

console.log('serveur websocket en écoute sur ws://localhost:9999');  // afficher que le serveur est bien en marche
