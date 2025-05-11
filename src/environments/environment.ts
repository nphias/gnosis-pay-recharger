import { gnosisChiado } from 'viem/chains'

export const environment = {
    production: false,
    TX_SERVICE_URL: 'https://safe-transaction-chiado.safe.global', 
    RPC_TESTNET:'https://rpc.chiado.gnosis.gateway.fm',
    EIP1193PROVIDER: gnosisChiado.rpcUrls.default.http[0],
    SIGNER_PRIVATE_KEY: 'ADD_YOUR_PRIVATE_kEY_HERE', //private key
    SAFE_OWNERS: [
      '0x9715D8CF39Dfdc4A5BF8052F765A1b3f28fEd034' //public key pair
      //'0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B', //other owner pub key
      //'0x56e2C102c664De6DfD7315d12c0178b61D16F171'
    ],
    THRESHOLD: 1,
    SALT_NONCE:'1234'
};
