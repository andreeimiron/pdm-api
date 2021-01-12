const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../utils');

const userStore = require('./store');

const createToken = (user) => {
    return jwt.sign(
        {
            _id: user._id,
            username: user.username,
        },
        jwtConfig.secret,
        {
            expiresIn: 60 * 60 * 60,
        });
};

const createUser = async (req, res) => {
    const user = req.body;
    try {
        await userStore.insert(user);
        const token = createToken(user);
        delete user.password;
        user.token = token;
        res.status(201).send(user);
    } catch (error) {
        console.log('error', error);
        res.status(400).send({ message: error.message });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    const user = await userStore.findOne({ username });

    if (!user) {
        return res.status(404).send({
            message: 'User not found'
        });
    }

    if (user.password !== password) {
        return res.status(400).send({
            message: 'Invalid username or password'
        });
    }

    const token = createToken(user);
    delete user.password;
    user.token = token;
    res.status(201).send(user);
};

router.post('/signup', createUser);
router.post('/login', login);

module.exports = {
    router
};
