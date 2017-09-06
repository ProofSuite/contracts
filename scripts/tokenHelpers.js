const h = require('../scripts/helper.js');
import { gas, gasPrice, ether } from '../scripts/testConfig.js';


const getTotalSupply = async (token) => {
    let tokenSupply = await token.totalSupply.call();
    return tokenSupply.toNumber();
}

const getTokenBalance = async (token, owner) => {
    let balance = await token.balanceOf(owner);
    return balance.toNumber();
}


const transferToken = async(contract, sender, receiver, amount) => {
    let params = {from: sender, gas: gas, gasPrice: gasPrice };
    let txn = await contract.transfer(receiver, amount, params);
    let txnReceipt = await h.waitUntilTransactionsMined(txn.tx);
    return txnReceipt;
}

const transferTokens = async(token, sender, receiver, amount) => {
    let params = {from: sender, gas: gas, gasPrice: gasPrice};
    let promises = token.map(function(oneToken) { transferToken(oneToken, sender, receiver, amount)});
    let txnReceipts = await Promise.all(promises);

    return txnReceipts;
}

const mintToken = async(contract, minter, amount) => {
    let params = {from: minter, gas: gas, gasPrice: gasPrice };
    let txn = await contract.mint(minter, amount, params);
    let txnReceipt = await h.waitUntilTransactionsMined(txn.tx);
    return txnReceipt;
}

module.exports = {
    getTotalSupply,
    getTokenBalance,
    transferToken,
    transferTokens,
    mintToken
}
