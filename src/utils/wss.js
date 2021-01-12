const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { jwtConfig } = require('./constants');

let wss;

const initWss = (value) => {
    wss = value;
    wss.on('connection', ws => {
        ws.on('message', message => {
            const { type, payload: { token } } = JSON.parse(message);
            if (type !== 'authorization') {
                ws.close();
                return;
            }
            try {
                ws.user = jwt.verify(token, jwtConfig.secret);
            } catch (err) {
                ws.close();
            }
        })
    });
};

const sendNotification = (userId, data) => {
    if (!wss) {
        return;
    }

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.user && userId === client.user._id) {
            client.send(JSON.stringify(data));
        }
    });
};

module.exports = {
    initWss,
    sendNotification,
};
