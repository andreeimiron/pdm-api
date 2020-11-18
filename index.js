const express = require('express');
const http = require('http')
const bodyParser = require('body-parser');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const port = 8000;

app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const wss = new WebSocket.Server({ server });
const sendNotification = (data) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

const tvs = [{
    id: 1,
    manufacturer: 'Samsung',
    model: '50TUS7853',
    isSmart: false,
    fabricationDate: new Date('02-10-2019'),
    price: 499
}, {
    id: 2,
    manufacturer: 'Samsung',
    model: '43TUS6804',
    isSmart: true,
    fabricationDate: new Date('10-10-2019'),
    price: 399
}, {
    id: 3,
    manufacturer: 'Philips',
    model: '43PHT8005',
    isSmart: true,
    fabricationDate: new Date('06-06-2020'),
    price: 539
}, {
    id: 4,
    manufacturer: 'LG',
    model: '32LWG6000',
    isSmart: false,
    fabricationDate: new Date('07-08-2020'),
    price: 299
}];

// CRUD Operations

const addTv = ({ manufacturer, model, isSmart, fabricationDate, price }) => {
    const newTv = {
        id: tvs[tvs.length - 1].id + 1,
        manufacturer,
        model,
        isSmart,
        fabricationDate,
        price
    };

    tvs.push(newTv);
    return newTv;
};

const getTv = (id) => tvs.find(tv => tv.id === id);

const updateTv = ({ id, manufacturer, model, isSmart, fabricationDate, price }) => {
    const index = tvs.findIndex(tv => tv.id === id);
    const tv = tvs[index];
    const updatedTv = {
        ...tv,
        manufacturer: manufacturer || tv.manufacturer,
        model: model || tv.model,
        isSmart: isSmart !== undefined ? isSmart : tv.isSmart,
        fabricationDate: fabricationDate ? new Date(fabricationDate) : tv.fabricationDate,
        price: price || tv.price,
    };

    tvs[index] = updatedTv;
    return updatedTv;
};

const deleteTv = (id) => {
    const index = tvs.findIndex(tv => tv.id === id);

    if (index === -1) {
        return;
    }

    tvs.splice(index, 1);
};

//  ROUTES
app.get('/tv', (req, res) => {
    res.status(200).send({
        success: true,
        data: tvs || [],
    });
});

app.get('/tv/:id', (req, res) => {
    const tv = getTv(parseInt(req.params.id));

    if (!tv) {
        return res.send({
            success: false,
            error: 'No resource found.',
        });
    }

    res.status(200).send({
        success: true,
        data: tv,
    });
});

app.post('/tv', (req, res) => {
    if (!req.body.manufacturer || !req.body.model || req.body.isSmart === undefined || !req.body.fabricationDate || !req.body.price) {
        return res.send({
            success: false,
            error: 'Fields required: manufacturer, model, isSmart, fabricationDate, price',
        });
    }

    const newTv = addTv({
        manufacturer: req.body.manufacturer,
        model: req.body.model,
        isSmart: req.body.isSmart,
        fabricationDate: new Date(req.body.fabricationDate),
        price: req.body.price,
    })

    sendNotification({ action: 'create', payload: { tv: newTv }});
    res.status(201).send({
        success: true,
        data: newTv,
    });
});

app.put('/tv/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const tv = getTv(id);

    if (!tv) {
        return res.send({
            success: false,
            error: 'No resource found. update',
        });
    }

    const updatedTv = updateTv({
        id: id,
        manufacturer: req.body.manufacturer,
        model: req.body.model,
        isSmart: req.body.isSmart,
        fabricationDate: req.body.fabricationDate,
        price: req.body.price,
    })
    sendNotification({ action: 'update', payload: { tv: updatedTv }});
    res.status(200).send({
        success: true,
        data: updatedTv,
    });
});

app.delete('/tv/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const tv = getTv(id);

    if (!tv) {
        return res.status(404).send({
            success: false,
            error: 'No resource found.',
        });
    }

    deleteTv(id);
    sendNotification({ action: 'delete', payload: { tv }});
    res.status(200).send({
        success: true,
        data: tv
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
