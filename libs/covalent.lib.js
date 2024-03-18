const _ = require("lodash");
const axios = require("axios");

const covalentChainEnum = require("../enums/covalent.chain.enum");

async function getTokenBalances(address, chain) {
    try {
        if (_.isEmpty(address) || _.isEmpty(chain)) {
            throw new Error(`Missing args! address: ${address} chain: ${chain}`);
        }
        const apiKey = process.env['COVALENT_API_KEY'];
        if (_.isEmpty(apiKey)) {
            throw new Error(`Covalent api key missing in .env!`)
        }

        const covalentChainSlug = covalentChainEnum[chain];
        if (_.isEmpty(covalentChainEnum)) {
            throw new Error(`Covalent chain slug not found for chain: ${chain}`)
        }

        const response = await axios.get(`https://api.covalenthq.com/v1/${covalentChainSlug}/address/${address}/balances_v2/?nft=false&no-spam=false`, {
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                username: apiKey
            }
        });

        if (_.isEmpty(response) || _.isEmpty(response.data) || _.isEmpty(response.data.data) || _.isEmpty(response.data.data.items)) {
            throw new Error(`Invalid response from covalent!`)
        }

        let tokenBalances = response.data.data.items.map((item) => {
            const decimals = item.contract_decimals ? parseInt(item.contract_decimals) : 0;
            const balance = parseInt(item.balance) / 10 ** decimals;
            return {
                address: item.contract_address,
                balance: balance,
                decimals: decimals,
                rawBalance: BigInt(item.balance),
                symbol: item.contract_ticker_symbol,
                usdValue: item.quote_rate ? balance * item.quote_rate : "N/A",
                isNative: item.native_token
            }
        })

        tokenBalances = tokenBalances.filter(token => token.balance !== 0 && !token.isNative)

        return tokenBalances;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getTokenBalances: getTokenBalances
}