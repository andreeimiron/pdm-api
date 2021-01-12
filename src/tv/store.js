const dataStore = require('nedb-promise');

class TvStore {
    constructor(props) {
        const { filename, autoload } = props;

        this.store = dataStore({ filename, autoload });
    }

    async find(props) {
        return this.store.find(props);
    }

    async findOne(props) {
        return this.store.findOne(props);
    }

    async insert(tv) {
        if (
            !tv.manufacturer ||
            !tv.model ||
            !tv.fabricationDate ||
            !tv.price ||
            tv.isSmart === undefined
        ) {
            throw new Error("The following fields are required: 'manufacturer', 'model', 'fabricationDate', 'price', 'isSmart'.");
        }

        tv.version = 1;

        return this.store.insert(tv);
    }

    async update(props, tv) {
        const version = tv.version || 1;
        tv.version = version + 1;

        return this.store.update(props, tv);
    }

    async remove(props) {
        return this.store.remove(props);
    }
}

module.exports = new TvStore({
    filename: './db/tvs.json',
    autoload: true,
});
