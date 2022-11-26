'use strict';
const CONTRACTS = {
    97: {
        contract: "0xd0cd9185e8dEdb2B4Ef54921d703a6EEdD069824",
        token: "0x9eEba993Eafb39608Ee9d8d27d2662BCD54Ed77C",
        label: "BSC (testnet)",
        currency: "tBNB",
        factory: "0xF7eA8401C90c84451F5C83b33ab9061AAf64AE2F",
        rpc: "https://data-seed-prebsc-1-s3.binance.org:8545",
        explorer: "https://testnet.bscscan.com"
    }
};

let web3, account, src, factory, CONTRACT;
let globalMintInfo, srcChainId, fee;

let currentPage;

function showPage(id) {
    currentPage = id;
    $('#area_connect').hide();
    $('#area_dashboard').hide();
    $(`#${id}`).show();
}

async function show_connect() {
    showPage('area_connect');
}

async function switch_network(_id) {
    $('#global_alert').hide();
    const CONTRACT = CONTRACTS[_id];
    if( ! web3 ){
        web3 = new Web3(window.ethereum);
    }
    const id = web3.utils.toHex(_id);
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: id}]
        });
        await connect();
    } catch (e) {
        if (e.code === 4902) {
            try {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: id,
                        chainName: CONTRACT.label,
                        rpcUrl: [CONTRACT.rpc],
                        nativeCurrency: {name: CONTRACT.currency, symbol: CONTRACT.currency, decimals: 18},
                        blockExplorerUrls: [CONTRACT.explorer]
                    }],
                });
                await connect();
            } catch (addError) {
                const errmsg = addError.toString();
                $('#global_alert').html(errmsg);
                $('#global_alert').show();
            }
        } else {
            const errmsg = e.toString();
            $('#global_alert').html(errmsg);
            $('#global_alert').show();
        }
    }
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
            const errmsg = `Error: the chain ${srcChainId} is not supported by XEX Crypto. Supported chains are: ` + chainsNames.join(', ');
            $('#global_alert').html(errmsg);
            $('#global_alert').show();
        } else {
            const errmsg = `<div class="alert alert-success" role="alert">
                            Wait, loading ${CONTRACT.label} stats...
                            </div>`;
            $('#area_connect_text').html(errmsg);
            $('#area_connect_text').show();
            await initContract();
            await sync_footer();
        }
    } else {
        const errmsg = `<div class="alert alert-danger" role="alert">
                            Error: metamask not detected.
                            </div>`;
        $('#area_connect_text').html(errmsg);

        await show_connect();
    }
}

async function show_dashboard() {
    if (!account) return alert(`You are not connected. Connect your wallet first.`);
    showPage('area_dashboard');
    // ---
    const globalRank = (await src.methods.globalRank().call()).toString();
    $('#dashboard_global_rank').html(globalRank);


}
