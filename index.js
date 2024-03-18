require("dotenv").config({path: "./.env"});
const _ = require("lodash");
const privateKeyToAddress = require("ethereum-private-key-to-address");
const readlineSync = require("readline-sync");

const erc20Abi = require("./abi/erc20.abi.json");
const multiTokenTransferAbi = require("./abi/multi.token.transfer.abi.json");

const web3Lib = require("./libs/web3.lib");
const covalentLib = require("./libs/covalent.lib");
const alchemyLib = require("./libs/alchemy.lib");
const quicknodeLib = require("./libs/quicknode.lib");

const chainEnum = require("./enums/chain.enum");
const explorerEnum = require("./enums/explorer.enum");
const multiContractAddressEnum = require("./enums/multi.contract.address.enum");

function logBalances(tokenBalances) {
    try {
        console.log("---------------------------------TOKEN BALANCES--------------------------------------")
        console.log("S.NO      ADDRESS                                        SYMBOL              BALANCE              USD-VALUE");
        tokenBalances.forEach((tokenBalance, index) => {
            console.log(`${index}         ${tokenBalance.address}     ${tokenBalance.symbol.length > 10 ? (tokenBalance.symbol.slice(0, 10) + "...") : (tokenBalance.symbol + " ".repeat(13 - tokenBalance.symbol.length))}       ${tokenBalance.balance}                    ${tokenBalance.usdValue}`)
        })
    } catch (error) {
        throw error;
    }
}

async function transferTokens(chain, tokens) {
    try {
        if (_.isEmpty(tokens) || _.isEmpty(chain)) {
            throw new Error(`Missing args! tokens: ${tokens} chain: ${chain}`);
        }

        const recipient = readlineSync.question("Enter the recipient address: ");

        const web3 = web3Lib.getWeb3Provider();
        const accounts = await web3.eth.getAccounts();
        const multiTokenTransferContractAddress = multiContractAddressEnum[chain];
        if (_.isEmpty(multiTokenTransferContractAddress)) {
            throw new Error(`Multi Token contract address not found on chain: ${chain}`)
        }

        for (const token of tokens) {
            console.log(`Approving ${token.symbol}...`);
            const tokenContract = new web3.eth.Contract(erc20Abi, token.address);
            const approvingTx = await tokenContract.methods.approve(multiTokenTransferContractAddress, token.rawBalance).send({from: accounts[0]});
            console.log(`Tokens Approved for ${token.symbol} ✅. Explorer link: ${explorerEnum[chain]}/tx/${approvingTx.transactionHash}`);
        }

        console.log("Transferring tokens...");
        const multiTokenTransfer = new web3.eth.Contract(multiTokenTransferAbi, multiTokenTransferContractAddress);
        const transferTx = await multiTokenTransfer.methods.transferMultipleTokens(tokens.map(token => token.address), tokens.map(token => recipient), tokens.map(token => token.rawBalance)).send({from: accounts[0]});
        console.log(`Tokens Transferred ✅. Explorer link: ${explorerEnum[chain]}/tx/${transferTx.transactionHash}`);
    } catch (error) {
        throw error;
    }
}

async function sellTokens(chain, tokens) {
    try {
        if (_.isEmpty(tokens) || _.isEmpty(chain)) {
            throw new Error(`Missing args! tokens: ${tokens} chain: ${chain}`);
        }


    } catch (error) {
        throw error;
    }
}

(async () => {
    try {
        const chainIndex = readlineSync.question(`Available chains: ${Object.values(chainEnum).map((chain, index) => {
            return `${index}. ${chain}`
        }).join(" ")} \nSelect the chain: `);
        const chain = Object.values(chainEnum)[chainIndex];
        if (_.isEmpty(chain)) {
            throw new Error(`Enter a valid choice!`);
        }

        const privateKey = readlineSync.question("Enter the private key: ");
        const address = privateKeyToAddress(privateKey).toLowerCase();

        web3Lib.connectWithWallet(chain, privateKey);

        let tokenBalances = await covalentLib.getTokenBalances(address,chain);

        if (_.isEmpty(tokenBalances)) {
            throw new Error(`No tokens Found in the wallet on chain: ${chain}`);
        }
        logBalances(tokenBalances);

        const action = readlineSync.question("Enter what action to perform! \t 1. Transfer \t 2. Sell : ");
        if (action === "1" || action === "2") {
            let tokenIndexes = readlineSync.question("Enter the indexes of the tokens you want to perform the action on separated by a comma(,) : ");
            tokenIndexes = tokenIndexes.split(",").map(index => parseInt(index));

            let chosenTokenBalances = tokenBalances.filter((tokenBalance, index) =>
                tokenIndexes.includes(index)
            );
            console.log(`You have chosen to perform action on the following tokens:  ${chosenTokenBalances.map(token => token.symbol).join("      ")}`);

            const proceedingFlag = readlineSync.question("If you want to continue, press Y. To abort the transaction, press any other key: ");
            if (proceedingFlag !== "Y" && proceedingFlag !== "y") {
                console.log("Exiting....");
                process.exit(0);
            }

            action === "1" ? await transferTokens(chain, chosenTokenBalances) : await sellTokens(chosenTokenBalances);
        } else {
            throw new Error(`Invalid option entered! Exiting....`)
        }

        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
})();