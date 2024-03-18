const Web3 = require("web3");
const _ = require("lodash");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const globalLib = require("../libs/global.lib");

const chainEnum = require("../enums/chain.enum");
const globalKeysEnum = require("../enums/global.keys.enum");

function connect(rpcUrl) {
    try {
        if (_.isEmpty(rpcUrl)) {
            throw new Error(`Missing args! rpcUrl: ${rpcUrl}`);
        }

        if (!rpcUrl.startsWith("ws")) {
            throw new Error(`The given rpcUrl is not web socket url! rpcUrl :${rpcUrl}`);
        }

        globalLib.setGlobalKey(globalKeysEnum.WEB3, new Web3(rpcUrl, {
            reconnect: {
                auto: true,
                delay: 1000, // ms
                onTimeout: false,
            },
            timeout: 5000, // ms
            clientConfig: {
                maxReceivedFrameSize: 10000000000,
                maxReceivedMessageSize: 10000000000,
                keepalive: true,
                keepaliveInterval: 1000, // ms
                dropConnectionOnKeepaliveTimeout: true,
                keepaliveGracePeriod: 4000, // ms
            },
        }))
    } catch (error) {
        throw error;
    }
}

function connectWithWallet(chain, privateKey) {
    try {
        if (_.isEmpty(chain) || _.isEmpty(privateKey)) {
            throw new Error(`Missing args! chain: ${chain} privateKey: ${privateKey}`);
        }

        let rpcUrl = process.env[`${chain}_NODE_URL`];
        if (_.isEmpty(rpcUrl)) {
            throw new Error(`Node URL not found in .env for chain ${chain}`);
        }

        let provider = new HDWalletProvider({
            privateKeys: [privateKey],
            providerOrUrl: rpcUrl
        });
        globalLib.setGlobalKey(globalKeysEnum.WEB3, new Web3(provider));
    } catch (error) {
        throw error;
    }
}

function isConnected() {
    try {
        return !_.isEmpty(globalLib.getGlobalKey(globalKeysEnum.WEB3));
    } catch (error) {
        throw error;
    }
}

function getWeb3Provider() {
    try {
        if (!isConnected()) {
            throw new Error(`Web3 not connected!`);
        }

        return globalLib.getGlobalKey(globalKeysEnum.WEB3);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    connect: connect,
    isConnected: isConnected,
    getWeb3Provider: getWeb3Provider,
    connectWithWallet: connectWithWallet,
}