'use strict'
const fs = require('fs');
const web3 = require('web3');

let airdrop = [];
function processFile(file, valueInDecimal){
    const valueInWei = web3.utils.toWei(valueInDecimal);
    const addresses = fs.readFileSync(file).toString().split('\n');
    for( let i in addresses ){
        const addr = addresses[i].trim();
        if( ! addr ) continue;
        airdrop.push( `${addr},${valueInWei}` );
    }
}

function mergeBalances(){
    let processed = {}, lines = [];
    for( let i in airdrop ){
        const line = airdrop[i].split(',');
        const addr = line[0];
        const currentBalance = web3.utils.toBN(processed[addr] || '0');
        const anotherBalance = web3.utils.toBN(line[1]);
        const newBalance = currentBalance.add(anotherBalance);
        processed[addr] = newBalance.toString();
    }
    for(let addr in processed){
        const balanceInWei = processed[addr];
        lines.push(`${addr},${balanceInWei}`);
    }
    fs.writeFileSync('../airdrop.txt', lines.join('\n'));
}

processFile('../addr-7days.txt', '375');
processFile('../stake-kava-unique.txt', '325');
processFile('../velo-vest-op.txt', '310');
processFile('../bifi-max-bsc.txt', '300');
processFile('../curve-lock-eth.txt', '250');

mergeBalances();


