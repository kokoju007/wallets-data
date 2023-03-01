'use strict'
const fs = require('fs');

const contractAddress = '0x35361C9c2a324F5FB8f3aed2d7bA91CE1410893A';
let BLOCK_START = 3708801, BLOCK_END;
const rpcArchive = 'https://evm.kava.io';


const Web3 = require('web3');
const web3 = new Web3(rpcArchive);

let address = [], info = [];
const abi = JSON.parse(fs.readFileSync("./airdrop-lockers.abi", "utf8"));
const ctx = new web3.eth.Contract(abi, contractAddress);

const bribe_abi = JSON.parse(fs.readFileSync('./bribe-abi.js'));
const bribe = new web3.eth.Contract(bribe_abi, '0xc401adf58F18AF7fD1bf88d5a29a203d3B3783B2');
let epoch;
async function scanBlockchain(start, end) {
    let size = 1000;
    for (let i = start; i < end; i += size) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const from = i;
        const to = (i + size) - 1;
        console.log(`@${i}`);
        info.push(`@${i}`);
        try {
            await ctx.getPastEvents({fromBlock: from, toBlock: to},
                function (error, events) {
                    if (error) {
                        console.log(error);
                    } else {
                        for (let j = 0; j < events.length; j++) {
                            const e = events[j];
                            if (!e.event) continue;
                            if (e.event != 'Deposit') continue;
                            const u = e.returnValues;
                            const line = `  ${u.provider}, id: ${u.tokenId}, amount: ${u.value/1e18}`;
                            if( u.locktime < epoch ){
                                console.log(` DISCARD: ${line}`);
                                continue;
                            }else {
                                console.log(`${line}`);
                            }
                            const r = {
                                provider: u.provider,
                                tokenId: u.tokenId,
                                value: u.value,
                                locktime: u.locktime,
                                deposit_type: u.deposit_type,
                                ts: u.ts,
                            }
                            address.push(r);
                            info.push(line);
                        }
                    }
                });
        }catch(e){
            console.log(e.toString());
        }
    }
    fs.writeFileSync('../airdrop-lockers.txt', JSON.stringify(address) );
    fs.writeFileSync('../airdrop-lockers-info.txt', info.join('\n') );
}
async function getEpochBlock(){
    const latestBlock = await web3.eth.getBlock("latest");
    epoch = await bribe.methods.getEpochStart(latestBlock.timestamp).call();
    console.log(`epoch=${epoch}`);
    for(let i = BLOCK_END; i > 0 ; i -= 10000 ){
        const currentBlock = await web3.eth.getBlock(i);
        console.log(`${i} ${currentBlock.timestamp} ${epoch}`);
        if( currentBlock.timestamp <= epoch){
            BLOCK_START = i;
            console.log(`BLOCK_START=${BLOCK_START}`);
            break;
        }
    }
}
async function main() {
    BLOCK_END = parseInt(await web3.eth.getBlockNumber());
    await getEpochBlock();
    await scanBlockchain(BLOCK_START, BLOCK_END);
}

main();
