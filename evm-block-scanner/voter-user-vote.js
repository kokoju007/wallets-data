'use strict'
const fs = require('fs');

const contractAddress = '0xa8B1E1B4333202355785C90fB434964046ef2E64';
let BLOCK_START = 3911420, BLOCK_END;
const rpcArchive = 'https://evm.testnet.kava.io';


const Web3 = require('web3');
const web3 = new Web3(rpcArchive);

let address = [], hash = {};
const abi = JSON.parse(fs.readFileSync("./voter-user-vote.abi", "utf8"));
const ctx = new web3.eth.Contract(abi, contractAddress);

async function scanBlockchain(start, end) {
    let size = 1000;
    for (let i = start; i < end; i += size) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const from = i;
        const to = (i + size) - 1;
        console.log(`i=${i}, from=${from}, to=${to}`);
        try {
            const events = await ctx.getPastEvents({fromBlock: from, toBlock: to},
                function (error, events) {
                    if (error) {
                        console.log(error);
                    } else {
                        for (let j = 0; j < events.length; j++) {
                            const e = events[j];
                            if (!e.event) continue;
                            if (e.event != 'Voted') continue;
                            // console.log(e);
                            const user = e.returnValues;
                            if (!hash[user.voter]) {
                                hash[user.voter] = true;
                                address.push(user.voter);
                                console.log(`\t${user.voter}`);
                            }
                        }
                    }
                });
        }catch(e){
            console.log(e.toString());
        }
    }
    fs.writeFileSync('../testnet-v1-list.txt', address.join('\n'));
}

async function main() {
    BLOCK_END = parseInt(await web3.eth.getBlockNumber());
    await scanBlockchain(BLOCK_START, BLOCK_END);
}

main();
