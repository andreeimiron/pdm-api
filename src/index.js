const express = require('express');
const bodyParser = require('body-parser');
const http = require('http')
const WebSocket = require('ws');
const cors = require('cors');

const { router: authRouter } = require('./auth');
const { router: tvRouter } = require('./tv');
const { authMiddleware } = require('./utils/auth');
const { initWss } = require('./utils/wss');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

initWss(wss);
const port = 8000;

app.use(bodyParser.json());
app.use(cors());

app.use('/auth', authRouter);

// Private routes
app.use('/tv', authMiddleware, tvRouter);

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
});
