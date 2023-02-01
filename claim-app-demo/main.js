'use strict';
const API = 'https://xen.bitdeep.dev';
const CONTRACTS = {
    2221: {
        contract: "0xE935526A8F9B73b4664d5eFcfC6281510dc6a66a",
        token: "0x88B31C3E68555e61fc348420c163011f27A363a8",
        label: "KAVA (testnet)",
        currency: "tKAVA",
        rpc: "https://evm.testnet.kava.io",
        explorer: "https://explorer.testnet.kava.io"
    }
};

let web3, account, src, CONTRACT, srcChainId;
let MerkleTreeData;
let currentPage;

async function connect_wallet(){
                
    $('#claim_button').children().hide();

    if (window.ethereum) {    
        await window.ethereum.request({method: 'eth_requestAccounts'});    
        window.web3 = new Web3(window.ethereum);    
        
        $('#connect_button').children().hide();        
        $('#claim_button').children().show();      
        
        return true;  
    }      
            
    return false;
}


async function show_connect() {    
    connect_wallet();
}

async function app_connect(){
    await connect();
    await show_dashboard();
}
async function connect() {

    if (window.ethereum) {
        const r = await window.ethereum.request({method: "eth_requestAccounts"});
        web3 = new Web3(window.ethereum);
        account = r[0];
        srcChainId = await web3.eth.getChainId();
        console.log('connect', account, srcChainId);
        CONTRACT = CONTRACTS[srcChainId];

        window.ethereum.on('accountsChanged', connect);
        window.ethereum.on('chainChanged', connect);

        $('#global_alert').hide();

        if (!CONTRACT) {
            let chainsNames = [];
            for (let chainId in CONTRACTS) {
                const r = CONTRACTS[chainId];
                chainsNames.push(r.label);
            }
            const errmsg = `Error: the chain ${srcChainId} is not supported by Vara. Supported chains are: ` + chainsNames.join(', ');
            $('#global_alert').html(errmsg);
            $('#global_alert').show();
        } else {
            const errmsg = `<div class="alert alert-success" role="alert">
                            Wait, loading ${CONTRACT.label} stats...
                            </div>`;
            $('#area_connect_text').html(errmsg);
            $('#area_connect_text').show();
            await initContract();
        }
    } else {

        const errmsg = `<div class="alert alert-danger" role="alert">
                            Error: metamask not detected.
                            </div>`;
        $('#area_connect_text').html(errmsg);

        await show_connect();

    }
}


let airdropData;
async function show_dashboard() {

    if (!account){
        
        $('#claim_button').children().hide();        
        $('#connect_button').children().show();        

        return alert(`You are not connected. Connect your wallet first.`);
    } 
    
    showPage('area_dashboard');    

    $('#global_alert').html(`Checking if ${account} is eligible...`);
    $('#global_alert').show();

    // account = '0x22510fe99f63ae03ba792c21a29ec10fd87cae08';
    let res = await fetch(`${API}/proof/${account}`);
    airdropData = await res.json();

    console.log('airdropData', airdropData);

    if( ! airdropData.value ){
        $('#global_alert').html(`Account ${account} not eligible for claiming the airdrop.`);
    }else{
        const v = web3.utils.fromWei(airdropData.value);
        $('#global_alert').html(`Account ${account} eligible for claiming ${v} VARA. Checking if already claimed...`);
        const hasClaimed = await src.methods.hasClaimed(account).call();
        
        if( hasClaimed === true ){
            $('#global_alert').html(`Account ${account} already claimed the airdrop. Thank you.`);

        }else{
            $('#global_alert').html(`Account ${account} eligible for claiming the airdrop of ${v} VARA.`);                 
        }
    }

}


async function initContract() {
    if (!CONTRACT) {
        let chainsNames = [];
        for (let chainId in CONTRACTS) {
            const r = CONTRACTS[chainId];
            chainsNames.push(r.label);
        }
        let warningHtml = 'Error: chain not supported. Supported chains are: ' + chainsNames.join(', ');
        $('#global_alert').html(warningHtml);
        $('#global_alert').show();
        return;
    }
    $('#global_alert').hide();
    src = new web3.eth.Contract(abi_merkleclaim, CONTRACT.contract);
    const proof = (await src.methods.merkleRoot().call());
    console.log('proof', proof);
}

async function claim(){
    try {
        console.log(account, airdropData.value, airdropData.proof);
        await src.methods.claim(airdropData.value, airdropData.proof
        ).estimateGas({from: account},
            async function (error, gasAmount) {
                if (error) {
                    alert(error.toString());
                } else {
                    await src.methods.claim(airdropData.value, airdropData.proof).send({from: account});
                    await show_dashboard();
                }
            });
    } catch (e) {        
        alert("Error: Not possible to claim, please contact us")
    }
}


