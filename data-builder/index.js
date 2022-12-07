'use strict'
const fs = require('fs');
const web3 = require('web3');
const merkle = require("@openzeppelin/merkle-tree");

let airdrop = [];

function processFile(file, valueInDecimal) {
    const valueInWei = web3.utils.toWei(valueInDecimal);
    const addresses = fs.readFileSync(file).toString().split('\n');
    for (let i in addresses) {
        const addr = addresses[i].trim();
        if (!addr) continue;
        airdrop.push(`${addr},${valueInWei}`);
    }
}

function mergeBalances() {
    let processed = {}, linesTxt = [], linesMerkle = [];
    for (let i in airdrop) {
        const line = airdrop[i].split(',');
        const addr = line[0];
        const currentBalance = web3.utils.toBN(processed[addr] || '0');
        const anotherBalance = web3.utils.toBN(line[1]);
        const newBalance = currentBalance.add(anotherBalance);
        processed[addr] = newBalance.toString();
    }
    for (let addr in processed) {
        const balanceInWei = processed[addr];
        linesTxt.push(`${addr},${balanceInWei}`);
        linesMerkle.push([addr, balanceInWei]);
    }
    fs.writeFileSync('../airdrop.txt', linesTxt.join('\n'));
    const tree = merkle.StandardMerkleTree.of(linesMerkle, ["address", "uint256"]);
    console.log('Merkle Root:', tree.root);
    fs.writeFileSync("../airdrop-merkletree.json", JSON.stringify(tree.dump()));
}

processFile('../addr-7days.txt', '450');
processFile('../stake-kava-unique.txt', '420');
processFile('../velo-vest-op.txt', '360');
processFile('../bifi-max-bsc.txt', '360');

mergeBalances();


