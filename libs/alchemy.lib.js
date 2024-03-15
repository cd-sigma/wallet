const _ = require("lodash");
const {Network, Alchemy} = require("alchemy-sdk");

const web3Lib = require("./web3.lib");
const globalLib = require("./global.lib");

const erc20Abi = require("../abi/erc20.abi.json");
const globalKeysEnum = require("../enums/global.keys.enum");

function connect(apiKey) {
    try {
        if (_.isEmpty(apiKey)) {
            throw new Error(`Missing args! apiKey: ${apiKey}`);
        }

        globalLib.setGlobalKey(globalKeysEnum.ALCHEMY, new Alchemy({
            apiKey: apiKey,
            network: Network.ETH_SEPOLIA,
        }));
    } catch (error) {
        throw error;
    }
}

function isConnected() {
    try {
        return !_.isEmpty(globalLib.getGlobalKey(globalKeysEnum.ALCHEMY));
    } catch (error) {
        throw error;
    }
}

function getAlchemyProvider() {
    try {
        if (!isConnected()) {
            throw new Error(`Alchemy not connected!`)
        }

        return globalLib.getGlobalKey(globalKeysEnum.ALCHEMY);
    } catch (error) {
        throw error;
    }
}

async function getTokenBalances(address) {
    try {
        if (_.isEmpty(address)) {
            throw new Error(`Missing args! address: ${address}`);
        }

        const web3 = web3Lib.getWeb3Provider();
        const alchemy = getAlchemyProvider();
        let tokenBalances = (await alchemy.core.getTokenBalances(address)).tokenBalances.map((token) => {
            return {
                address: token.contractAddress,
                balance: parseInt(token.tokenBalance)
            }
        });

        const tokenDecimalsCalls = [];
        const tokenSymbolCalls = [];
        tokenBalances.forEach((tokenBalance) => {
            const token = new web3.eth.Contract(erc20Abi, tokenBalance.address);
            tokenDecimalsCalls.push(token.methods.decimals().call());
            tokenSymbolCalls.push(token.methods.symbol().call());
        })
        const tokenDecimals = await Promise.all(tokenDecimalsCalls);
        const tokenSymbols = await Promise.all(tokenSymbolCalls);

        tokenBalances = tokenBalances.map((tokenBalance, index) => {
            return {
                address: tokenBalance.address,
                symbol: tokenSymbols[index],
                decimals: tokenDecimals[index],
                rawBalance: BigInt(tokenBalance.balance),
                balance: tokenBalance.balance / 10 ** tokenDecimals[index],
            }
        })
        tokenBalances = tokenBalances.filter(token => token.balance !== 0)

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