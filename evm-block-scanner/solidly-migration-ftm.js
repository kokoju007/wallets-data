'use strict'

let BLOCK_START, BLOCK_END;
const fs = require('fs');
// use this rpc for the scan
const rpcArchive = 'https://rpc.ftm.tools/';
const Web3 = require('web3');
const web3 = new Web3(rpcArchive);

const InputDataDecoder = require('ethereum-input-data-decoder');
const decoder = new InputDataDecoder(`${__dirname}/MigrationBurn.abi`);

const contractAddress = '0x12e569ce813d28720894c2a0ffe6bec3ccd959b2';
let address = [], hash = {};

async function scanBlockchain(start, end) {
    let size = 1000;
    for (let i = start; i < end; i += size) {
        // await new Promise(resolve => setTimeout(resolve, 100));
        const from = i;
        const to = (i + size) - 1;
        console.log(`i=${i}, from=${from}, to=${to}`);
        try {
            const block = await web3.eth.getBlock(i);
            for (let t in block.transactions) {
                const txHash = block.transactions[t];
                console.log(`\t\t${txHash}`);
                const tx = await web3.eth.getTransaction(txHash);
                if (!tx.to || tx.to.toLowerCase() != contractAddress )
                    continue;
                if (!hash[tx.from]) {
                    hash[tx.from] = true;
                    address.push(tx.from);
                    console.log(`\t${tx.from}`);
                }
            }
        } catch (e) {
            console.log(e.toString());
        }
    }
    fs.writeFileSync('../solidly-migration-ftm.txt', address.join('\n'));
}

async function main() {
    BLOCK_START = 46270093;
    // BLOCK_START = 48892002;
    BLOCK_END = parseInt(await web3.eth.getBlockNumber());
    await scanBlockchain(BLOCK_START, BLOCK_END);
}

main();
