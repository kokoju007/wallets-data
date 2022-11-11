'use strict'

let BLOCK_START, BLOCK_END;
const fs = require('fs');
// use this rpc for the scan
const rpcArchive = 'https://polygon-rpc.com';
const Web3 = require('web3');
const web3 = new Web3(rpcArchive);

const abi = JSON.parse(fs.readFileSync("./BeefyVaultV6.abi", "utf8"));

const ctx = new web3.eth.Contract(abi, '0xfEcf784F48125ccb7d8855cdda7C5ED6b5024Cb3');
let address = [], hash = {};
async function scanBlockchain(start, end){
    let size = 1000;
    for (let i = start; i < end; i += size) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const from = i;
        const to = (i + size) - 1;
        console.log(`i=${i}, from=${from}, to=${to}`);
        try {
            await ctx.getPastEvents({}, {fromBlock: from, toBlock: to},
                function (error, events) {
                    if (error) {
                        console.log(error);
                    } else {
                        for (let j = 0; j < events.length; j++) {
                            const e = events[j];
                            if (!e.event) continue;
                            if (e.event != 'Transfer') continue;
                            // console.log(e);
                            const user = e.returnValues;
                            if (!hash[user.from] && user.from != '0x0000000000000000000000000000000000000000') {
                                hash[user.from] = true;
                                address.push(user.from);
                                console.log(`\t${user.from}`);
                            }
                            if (!hash[user.to] && user.to != '0x0000000000000000000000000000000000000000') {
                                hash[user.to] = true;
                                address.push(user.to);
                                console.log(`\t${user.to}`);
                            }
                        }
                    }
                });
        }catch(e){
            console.log(e.toString());
        }
    }
    fs.writeFileSync('../bifi-max-polygon.txt', address.join('\n') );
}
async function main(){
    BLOCK_START = 14692985;
    //BLOCK_START = 35399219;
    BLOCK_END = parseInt(await web3.eth.getBlockNumber());
    await scanBlockchain(BLOCK_START, BLOCK_END);
}

main();
