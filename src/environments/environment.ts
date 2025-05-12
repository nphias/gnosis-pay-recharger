import { gnosisChiado } from 'viem/chains'

export const environment = {
    production: false,
    TX_SERVICE_URL: 'https://safe-transaction-chiado.safe.global', 
    RPC_URL:'https://rpc.chiado.gnosis.gateway.fm',
    EIP1193PROVIDER: gnosisChiado.rpcUrls.default.http[0],
    SIGNER_PRIVATE_KEY: 'ADD YOUR PRIVATE KEY',
    SAFE_OWNERS: ['ADD YOUR PUBLIC KEY'],
    THRESHOLD: 1,
    SALT_NONCE:'1234' //change this to trigger a new safe deploy
};


