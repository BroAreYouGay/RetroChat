const WebSocket = require('ws');

// création du serveur websocket sur le port 9999
const server = new WebSocket.Server({ port: 9999 });

// dictionnaires pour stocker les informations des utilisateurs, amis et demandes en attente
const clients = new Map();
const friendsList = new Map();
const pendingFriends = new Map();

// quand un utilisateur se connecte
server.on('connection', (socket) => {
    console.log('un utilisateur s\'est connecté.');

    // quand un message est reçu
    socket.on('message', (message) => {
        const [type, ...data] = message.toString().split(':'); // on découpe le message en type et données

        // si un nouvel utilisateur se connecte
        if (type === 'newUser') {
            const username = data[0]; // nom d'utilisateur
            const avatar = data[1];   // avatar de l'utilisateur
            // on enregistre l'utilisateur et ses données
            clients.set(socket, { username, avatar });
            friendsList.set(username, []); // liste des amis de l'utilisateur
            pendingFriends.set(username, []); // liste des demandes d'amis en attente
            // on envoie la liste des utilisateurs à tous les clients
            broadcastUserList();
        }

        // si un utilisateur envoie un message
        else if (type === 'message') {
            const clientInfo = clients.get(socket); // récupère les informations de l'utilisateur
            if (clientInfo) {
                const { username, avatar } = clientInfo;
                // on diffuse le message à tous les autres utilisateurs
                broadcastMessage(`${username}:${data.join(':')}:${avatar}`);
            }
        }

        // si un utilisateur veut ajouter un ami
        else if (type === 'addFriend') {
            const clientInfo = clients.get(socket); // récupère les informations de l'utilisateur
            if (clientInfo) {
                const { username } = clientInfo;
                const friendName = data[0]; // nom de l'ami
                const friendSocket = Array.from(clients.entries()).find(([, value]) => value.username === friendName); // trouve le socket de l'ami

                // si l'ami existe
                if (friendSocket) {
                    const [friendSocketInstance] = friendSocket;
                    // ajoute la demande dans la liste des demandes en attente
                    pendingFriends.get(friendName).push(username);
                    // envoie la demande à l'ami
                    friendSocketInstance.send(`friendRequest:${username}`);
                    // envoie une confirmation au demandeur
                    socket.send(`addFriendSuccess:${friendName}`);
                } else {
                    // erreur si l'ami n'existe pas
                    socket.send(`addFriendError:${friendName} n'existe pas.`);
                }
            }
        }

        // si un utilisateur accepte la demande d'ami
        else if (type === 'acceptFriend') {
            const clientInfo = clients.get(socket); // récupère les informations de l'utilisateur
            if (clientInfo) {
                const { username } = clientInfo;
                const friendName = data[0]; // nom de l'ami
                const requests = pendingFriends.get(username); // demandes en attente

                // si l'ami est dans la liste des demandes en attente
                if (requests.includes(friendName)) {
                    // ajout de l'ami dans les listes d'amis des deux utilisateurs
                    friendsList.get(username).push(friendName);
                    friendsList.get(friendName).push(username);

                    // suppression de la demande de la liste des demandes en attente
                    pendingFriends.set(username, requests.filter(req => req !== friendName));

                    // envoi de la mise à jour de la liste des amis à l'ami
                    const friendSocket = Array.from(clients.entries()).find(([, value]) => value.username === friendName);
                    if (friendSocket) {
                        const [friendSocketInstance] = friendSocket;
                        sendFriendList(friendSocketInstance, friendName);
                    }

                    // envoi de la mise à jour de la liste des amis au demandeur
                    sendFriendList(socket, username);
                } else {
                    // erreur si l'ami n'a pas demandé à être ami
                    socket.send(`addFriendError:${friendName} n'a pas demandé à être ami.`);
                }
            }
        }

        // si un utilisateur rejette la demande d'ami
        else if (type === 'rejectFriend') {
            const clientInfo = clients.get(socket); // récupère les informations de l'utilisateur
            if (clientInfo) {
                const { username } = clientInfo;
                const friendName = data[0]; // nom de l'ami
                const requests = pendingFriends.get(username); // demandes en attente

                // si l'ami est dans la liste des demandes en attente
                if (requests.includes(friendName)) {
                    // suppression de la demande rejetée
                    pendingFriends.set(username, requests.filter(req => req !== friendName));

                    // envoi de l'info au demandeur que la demande a été rejetée
                    const friendSocket = Array.from(clients.entries()).find(([, value]) => value.username === friendName);
                    if (friendSocket) {
                        const [friendSocketInstance] = friendSocket;
                        friendSocketInstance.send(`addFriendError:${username} a rejeté la demande.`);
                    }
                }
            }
        }

    });

    // quand une connexion est fermée
    socket.on('close', () => {
        const clientInfo = clients.get(socket); // récupère les informations de l'utilisateur
        if (clientInfo) {
            const { username } = clientInfo;
            // supprime l'utilisateur des listes d'amis et de demandes
            friendsList.delete(username);
            pendingFriends.delete(username);
        }
        // supprime l'utilisateur de la liste des clients
        clients.delete(socket);
        // met à jour la liste des utilisateurs connectés
        broadcastUserList();
    });
});

// fonction pour diffuser un message à tous les utilisateurs connectés
function broadcastMessage(message) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// fonction pour diffuser la liste des utilisateurs connectés
function broadcastUserList() {
    const userList = Array.from(clients.values())
        .map(({ username, avatar }) => `${avatar},${username}`)
        .join(';');

    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(`userList:${userList}`);
        }
    });
}

// fonction pour envoyer la liste des amis d'un utilisateur
function sendFriendList(socket, username) {
    const friends = friendsList.get(username) || [];
    const friendListString = friends
        .map(friend => {
            const friendInfo = Array.from(clients.values()).find(user => user.username === friend);
            if (friendInfo) {
                return `${friendInfo.avatar},${friend}`;
            }
            return null;
        })
        .filter(Boolean)
        .join(';');

    socket.send(`friendList:${friendListString}`);
}

// message indiquant que le serveur est en écoute
console.log('serveur websocket en écoute sur ws://localhost:9999');
