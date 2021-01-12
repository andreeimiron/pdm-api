const router = require('express').Router();

const tvStore = require('./store');
const { sendNotification } = require('../utils/wss');

const getAll = async (req, res) => {
    const { user } = req;
    const { page: pageString, limit: limitString, search, startDate, endDate, type } = req.query;
    const page = parseInt(pageString);
    const limit = parseInt(limitString);
    const searchValue = search && search.toLowerCase();

    const tvs = await tvStore.find({ userId: user._id });

    if (page && limit) {
        const offset = (page - 1) * limit;

        return res.status(200).send({
            items: tvs.slice(offset, offset + limit),
            totalPages: Math.ceil(tvs.length / limit),
        })
    }

    if (search) {
        return res.status(200).send({
            items: tvs.filter(tv => (
                tv.manufacturer.toLowerCase().includes(searchValue) ||
                tv.model.toLowerCase().includes(searchValue)
            )),
            totalPages: 1
        })
    }

    let tvsCopy = [...tvs];
    let filterApplied = false;
    if (startDate && startDate !== 'undefined') {
        tvsCopy = tvsCopy.filter(tv => new Date(startDate) <= new Date(tv.fabricationDate));
        filterApplied = true;
    }
    if (endDate && endDate !== 'undefined') {
        tvsCopy = tvsCopy.filter(tv => new Date(tv.fabricationDate) <= new Date(endDate));
        filterApplied = true;
    }
    if (type) {
        if (type === 'smart') {
            tvsCopy = tvsCopy.filter(tv => tv.isSmart);
            filterApplied = true;
        }
        if (type === 'nonSmart') {
            tvsCopy = tvsCopy.filter(tv => !tv.isSmart);
            filterApplied = true;
        }
    }

    if (filterApplied) {
        return res.status(200).send({
            items: tvsCopy,
            totalPages: 1,
        });
    }

    res.status(200).send({
        items: tvs,
        totalPages: 1,
    });
};

const getById = async (req, res) => {
    const { user } = req;
    const { id } = req.params;

    const tv = await tvStore.findOne({ _id: id });

    if (tv) {
        if (tv.userId === user._id) {
            res.status(200).send(tv);
        } else {
            res.status(403).send({ message: 'Access forbidden.' })
        }
    } else {
        res.status(404).send({ message: `Tv with id ${id} not found.`});
    }
};

const create = async (req, res) => {
    const { user } = req;
    const { id } = req.params;
    const tv = req.body;

    tv.userId = user._id;
    try {
        const addedTv = await tvStore.insert(tv);
        sendNotification(user._id, { action: 'create', payload: { tv: addedTv }});
        res.status(201).send(addedTv);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
};

const update = async (req, res) => {
    const { user } = req;
    const { id } = req.params;
    const tv = req.body;

    if (tv._id && tv._id !== id) {
        return res.status(400).send({
            message: 'Params id and body id doesn\'t match.',
        });
    }

    if (!user._id) {
        return await create(req, res);
    }

    const newTvVersion = tv.version || 1;
    const storedTv = await tvStore.findOne({ _id: id });
    const storedTvVersion = (storedTv && storedTv.version) || 1;

    if (newTvVersion !== storedTvVersion) {
        const message = `[ERROR] Version conflicts for item with id ${id}! Latest stored version is ${storedTvVersion}. Your payload version is ${newTvVersion}.`;
        return res.status(400).send({
            versionError: true,
            message,
        });
    }

    tv.userId = user._id;
    const updatedCount = await tvStore.update({ _id: id }, tv);

    if (updatedCount === 1) {
        sendNotification(user._id, { action: 'update', payload: { tv }});
        res.status(200).send(tv);
    } else {
        res.status(400).error({ message: 'Resource no longer exists' });
    }
};

const remove = async (req, res) => {
    const { user } = req;
    const { id } = req.params;

    const tv = await tvStore.findOne({ _id: id });

    if (tv && tv.userId === user._id) {
        await tvStore.remove({ _id: id });
        sendNotification(user._id, { action: 'delete', payload: { tv }});
        res.status(204).send("Deleted");
    } else {
        res.status(403).send({ message: 'Access forbidden.' })
    }
};


router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = {
    router
}
