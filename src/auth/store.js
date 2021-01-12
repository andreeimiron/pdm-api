const dataStore = require('nedb-promise');

class UserStore {
    constructor(props) {
        const { filename, autoload } = props;

        this.store = dataStore({ filename, autoload });
    }

    async findOne(props) {
        return this.store.findOne(props);
    }

    async insert(user) {
        return this.store.insert(user);
    }
}

module.exports = new UserStore({
    filename: './db/users.json',
    autoload: true,
});
