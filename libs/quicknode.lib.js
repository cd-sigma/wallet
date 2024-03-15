const {Core} = require("@quicknode/sdk");
const _ = require("lodash");

const web3Lib = require("./web3.lib");
const globalLib = require("./global.lib");

const erc20Abi = require("../abi/erc20.abi.json");
const globalKeysEnum = require("../enums/global.keys.enum");

function connect(chain) {
    try {
        if (_.isEmpty(chain)) {
            throw new Error(`Missing args! chain : ${chain}`);
        }

        const nodeUrl = process.env[`QUICKNODE_${chain}_NODE_URL`];
        if (_.isEmpty(nodeUrl)) {
            throw new Error(`Quicknode api key not found in .env for nodeUrl : ${nodeUrl}`);
        }

        globalLib.setGlobalKey(globalKeysEnum.QUICKNODE, new Core({
            endpointUrl: nodeUrl,
            config: {
                addOns: {
                    nftTokenV2: true,
                },
            },
        }));
    } catch (error) {
        throw error;
    }
}

function isConnected() {
    try {
        return !_.isEmpty(globalLib.getGlobalKey(globalKeysEnum.QUICKNODE));
    } catch (error) {
        throw error;
    }
}

function getQuicknodeProvider() {
    try {
        if (!isConnected()) {
            throw new Error(`Quicknode not connected!`)
        }

        return globalLib.getGlobalKey(globalKeysEnum.QUICKNODE);
    } catch (error) {
        throw error;
    }
}

async function getTokenBalances(address) {
    try {
        if (_.isEmpty(address)) {
            throw new Error(`Missing args! address: ${address}`);
        }

        const quicknode = getQuicknodeProvider();
        let tokenBalances = (await quicknode.client.qn_getWalletTokenBalance({wallet: address})).result.map((token) => {
            return {
                address: token.address,
                balance: parseInt(token.totalBalance) / 10 ** (token.decimals ? parseInt(token.decimals) : 0),
                decimals: (token.decimals ? parseInt(token.decimals) : 0),
                rawBalance: BigInt(token.totalBalance),
                symbol: token.symbol
            }
        });

        return tokenBalances;
    } catch (error) {
        throw error;
    }
}


module.exports = {
    connect: connect,
    isConnected: isConnected,
    getTokenBalances: getTokenBalances
}