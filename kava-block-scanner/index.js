'use strict';

const fs = require('fs');
const fetch = require('node-fetch');
const sha256 = require('js-sha256');



const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function getLastBlock() {
    const response = await fetch('https://api.data.kava.io/cosmos/base/tendermint/v1beta1/blocks/latest');
    const body = await response.json();
    return body.block.header.height;
}

async function getBlock(height) {
    // await sleep(100);
    try {
        const response = await fetch('https://api.data.kava.io/cosmos/base/tendermint/v1beta1/blocks/' + height);
        const body = await response.json();
        let list = [];
        if( ! body.block ) return [];
        for (let t in body.block.data.txs) {
            const tx = sha256( Buffer.from(body.block.data.txs[t], 'base64') );
            list.push(tx);
        }
        return list;
    }catch(e){
        console.log('getBlock', height, e.toString());
    }
}
function getValue(tree, id){
    for( let i in tree ){
        const r = tree[i];
        if( r.key == id )
            return r.value;
    }
}
async function getTx(hash) {
    // await sleep(100);
    try {
        const response = await fetch('https://api.data.kava.io/cosmos/tx/v1beta1/txs/' + hash);
        const body = await response.json();
        if( body.code && body.message ){
            console.log('getTx', body.message)
            return [];
        }
        const raw_log = JSON.parse(body.tx_response.raw_log);
        let addresses = [];
        for (let j in raw_log) {
            for (let i in raw_log[j].events) {
                const e = raw_log[j].events[i];
                if (e.type == 'vault_deposit') {
                    const addr = fromBech32( getValue(e.attributes, 'depositor') );
                    console.log(addr);
                    addresses.push(addr);
                }
            }
        }
        return addresses;
    }catch(e){
        console.log('getTx', hash, e.toString())
    }
    return [];
}

let list = {}, ctl = [];
async function scanBlockchain(BLOCK_START, BLOCK_END){
    for (let i = BLOCK_START; i > BLOCK_END ; i --) {
        console.log(`i=${i}`);
        try {
            const tx = await getBlock(i);
            if( ! tx ) continue;
            for (let j in tx) {
                const addresses = await getTx(tx[j]);
                if( ! addresses || addresses.length == 0 )
                    continue;
                ctl = ctl.concat(addresses);
            }
        }catch (e) {
            console.log(e.toString());
        }
        fs.writeFileSync('../stake-kava.txt', ctl.join('\n') );
    }
}

async function main(){
    ctl = fs.readFileSync('../stake-kava.txt').toString().split('\n');
    // const lastBlock = await getLastBlock();
    // await getBlock("2205145");
    // await getTx("d3df3a5951762f2a2940b2f18bcb885767ee725adfda6dc5d188f769b2180db4"); // kava
    // await getTx("8EE0EB83F47EE00812DF51321EDDC897261F39A79612F6BB995868C23EB81DC9"); // kava
    // await getTx("46EF90A1C765D20C2894332F29BE5E94798E3B0349F738FD9BE814B258AD0DD1"); // usdc
    // kava15jvpyu059s9xqs6w3sggea2j23vegyvemje0gn
    // console.log(fromBech32('kava15jvpyu059s9xqs6w3sggea2j23vegyvemje0gn'))
    await scanBlockchain(2078740, 1);
    // await getBlock(2272322 );
}

main();


function bech32Decode(bechString) {
    let p;
    let hasLower = false;
    let hasUpper = false;
    for (p = 0; p < bechString.length; ++p) {
        if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
            return null;
        }
        if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
            hasLower = true;
        }
        if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
            hasUpper = true;
        }
    }
    if (hasLower && hasUpper) {
        return null;
    }
    bechString = bechString.toLowerCase();
    const pos = bechString.lastIndexOf('1');
    if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
        return null;
    }
    const hrp = bechString.substring(0, pos);
    const data = [];
    for (p = pos + 1; p < bechString.length; ++p) {
        const d = CHARSET.indexOf(bechString.charAt(p));
        if (d === -1) {
            return null;
        }
        data.push(d);
    }

    if (!verifyChecksum(hrp, Buffer.from(data))) {
        return null;
    }

    return { hrp, data: Buffer.from(data.slice(0, data.length - 6)) };
}

function createChecksum(hrp, data) {
    const values = Buffer.concat([
        Buffer.from(hrpExpand(hrp)),
        data,
        Buffer.from([0, 0, 0, 0, 0, 0]),
    ]);
    // var values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
    const mod = polymod(values) ^ 1;
    const ret = [];
    for (let p = 0; p < 6; ++p) {
        ret.push((mod >> (5 * (5 - p))) & 31);
    }
    return Buffer.from(ret);
}


function polymod(values){
    let chk = 1;
    // tslint:disable-next-line
    for (let p = 0; p < values.length; ++p) {
        const top = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ values[p];
        for (let i = 0; i < 5; ++i) {
            if ((top >> i) & 1) {
                chk ^= GENERATOR[i];
            }
        }
    }
    return chk;
}

function convertBits(data, fromWidth, toWidth, pad = true){
    let acc = 0;
    let bits = 0;
    const ret = [];
    const maxv = (1 << toWidth) - 1;
    // tslint:disable-next-line
    for (let p = 0; p < data.length; ++p) {
        const value = data[p];
        if (value < 0 || value >> fromWidth !== 0) {
            return null;
        }
        acc = (acc << fromWidth) | value;
        bits += fromWidth;
        while (bits >= toWidth) {
            bits -= toWidth;
            ret.push((acc >> bits) & maxv);
        }
    }

    if (pad) {
        if (bits > 0) {
            ret.push((acc << (toWidth - bits)) & maxv);
        }
    } else if (bits >= fromWidth || (acc << (toWidth - bits)) & maxv) {
        return null;
    }

    return Buffer.from(ret);
}

function fromBech32(address, useHRP = 'kava') {
    const res = bech32Decode(address);

    if (res === null) {
        throw new Error('Invalid bech32 address');
    }

    const { hrp, data } = res;

    if (hrp !== useHRP) {
        throw new Error(`Expected hrp to be ${useHRP} but got ${hrp}`);
    }

    const buf = convertBits(data, 5, 8, false);

    if (buf === null) {
        throw new Error('Could not convert buffer to bytes');
    }

    return '0x' + buf.toString('hex');
}
function verifyChecksum(hrp, data) {
    return polymod(Buffer.concat([hrpExpand(hrp), data])) === 1;
}

function hrpExpand(hrp){
    const ret = [];
    let p;
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) >> 5);
    }
    ret.push(0);
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) & 31);
    }
    return Buffer.from(ret);
}


