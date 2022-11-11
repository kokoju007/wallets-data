'use strict'

const fs = require('fs');
// use this rpc for the scan
const rpcArchive = 'https://evm.kava.io';
const Web3 = require('web3');
const web3 = new Web3(rpcArchive);

let list = {}, ctl = [];
async function scanBlockchain(BLOCK_START, BLOCK_END){
    let j = 0;
    for (let i = BLOCK_START; i < BLOCK_END; i ++) {
        console.log(`i=${i}`);
        try {
            const block = await web3.eth.getBlock(i, true);
            for (let j in block.transactions) {
                const tx = block.transactions[j];
                if( ! list[tx.from] ){
                    list[tx.from] = true;
                    ctl.push(tx.from);
                }
                if( ! list[tx.to] ){
                    list[tx.to] = true;
                    ctl.push(tx.to);
                }
                console.log('\t', i, j, tx.from, tx.to);
            }
        }catch (e) {
            console.log(e.toString());
        }
        if( j === 1000 ) {
            fs.writeFileSync('../addr-7days.txt', ctl.join('\n'));
            j = 0;
        }
        ++j;
    }
    fs.writeFileSync('../addr-7days.txt', ctl.join('\n'));
}

function fileExist(file){
    try{
        return fs.existsSync(file)
    }catch(e){

    }
    return false;
}

async function main(){
    const blockNumber = await web3.eth.getBlockNumber();
    const BLOCK_START = parseInt( blockNumber - (86400*7/7) );
    const BLOCK_END   = blockNumber;
    await scanBlockchain(BLOCK_START, BLOCK_END);
}

main();

