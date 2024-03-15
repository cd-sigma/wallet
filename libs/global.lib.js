const _ = require("lodash");
const globalKeysEnum = require("../enums/global.keys.enum");


function setGlobalKey(key, value) {
    try {
        if (_.isEmpty(key) || _.isNil(value)) {
            throw new Error(`Missing args! key: ${key} value: ${value}`);
        }

        if (!Object.values(globalKeysEnum).includes(key)) {
            throw new Error(`Key not in global keys enum! key: ${key}`);
        }

        global[key] = value
    } catch (error) {
        throw error
    }
}

function getGlobalKey(key) {
    try {
        if (_.isEmpty(key) ) {
            throw new Error(`Missing args! key: ${key} `);
        }

        if (!Object.values(globalKeysEnum).includes(key)) {
            throw new Error(`Key not in global keys enum! key: ${key}`);
        }

        return global[key]
    } catch (error) {
        throw error
    }
}

function deleteGlobalKey(key) {
    try {
        if (_.isEmpty(key)) {
            throw new Error(`Key ${key} is empty`)
        }

        delete global[key]
    } catch (error) {
        throw error
    }
}

module.exports = {
    setGlobalKey: setGlobalKey,
    getGlobalKey: getGlobalKey,
    deleteGlobalKey: deleteGlobalKey,
}
