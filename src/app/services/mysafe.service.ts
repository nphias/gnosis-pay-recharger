import { Injectable } from '@angular/core';
import { createSafeClient, SafeClient } from '@safe-global/sdk-starter-kit';
import Safe, {
  PredictedSafeProps,
  SafeAccountConfig,
  ExternalSigner,
  SafeDeploymentConfig
} from '@safe-global/protocol-kit'
import { gnosisChiado } from 'viem/chains'
import { createPublicClient, http, formatEther, formatGwei } from 'viem'
import { SafeMultisigTransactionResponse, TransactionBase } from '@safe-global/types-kit';
import { SafeInfoResponse } from '@safe-global/api-kit';
import { SafeDetails } from '../app.component';
//import dotenv from 'dotenv';

//dotenv.config();

/*const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_TX_SERVICE_URL = 'https://safe-transaction-sepolia.safe.global';
const SEPOLIA_RPC_URL = 'https://rpc.sepolia.org';
const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com'
const RPC_GNOSIS = 'https://rpc.gnosis.gateway.fm'
const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF' //private key
const OWNER_1_PRIVATE_KEY = '0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B'; // Replace with actual private key
*/

//todo move this to a config file .env
const TX_SERVICE_URL_CHIADO: string = 'https://safe-transaction-chiado.safe.global' 
const RPC_TESTNET_GNOSIS = 'https://rpc.chiado.gnosis.gateway.fm'
const SIGNER_PRIVATE_KEY = ''
const SAFE_OWNERS = [
  '0x9715D8CF39Dfdc4A5BF8052F765A1b3f28fEd034'
  //'0x9cCBDE03eDd71074ea9c49e413FA9CDfF16D263B', //public key
  //'0x56e2C102c664De6DfD7315d12c0178b61D16F171'
]
const THRESHOLD = 1;
const SALT_NONCE = '1234';

const safeAccountConfig: SafeAccountConfig = {
  owners: SAFE_OWNERS,  //'0x...'
  threshold: 1,
  // More optional properties
}

const predictedSafe: PredictedSafeProps = {
  safeAccountConfig,
  safeDeploymentConfig: { saltNonce: SALT_NONCE } //change this to trigger a new safe
  // More optional properties
}

@Injectable({ providedIn: 'root' })
export class SafeService {
  private safeClient: SafeClient | undefined;
  private safeAddress: string | undefined;

public async deploysafe(): Promise<string> {
  let mySafe = await Safe.init({
    provider: gnosisChiado.rpcUrls.default.http[0],
    signer: SIGNER_PRIVATE_KEY,
    predictedSafe // Optional
  })
  this.safeAddress = await mySafe.getAddress()
  console.log('Safe address:', this.safeAddress);

  let deployed:boolean = await mySafe.isSafeDeployed()
  if (!deployed) {
      const deploymentTransaction = await mySafe.createSafeDeploymentTransaction()
      console.log('Safe deployment:', deploymentTransaction);

      // execute the transaction
      const signer = await mySafe.getSafeProvider().getExternalSigner()
      if (signer) {
        const transactionHash = await signer.sendTransaction({
          to: deploymentTransaction.to,
          value: BigInt(deploymentTransaction.value),
          data: deploymentTransaction.data as `0x${string}`,
          chain: gnosisChiado
        })
        
        const publicClient = createPublicClient({
          chain: gnosisChiado,
          transport: http()
        })

        const transactionReceipt = await publicClient.waitForTransactionReceipt({
          hash: transactionHash
        })
        console.log('Transaction receipt:', transactionReceipt);
      }
  }
  return this.safeAddress
}

//public async createTransaction(): Promise<TransactionBase> {
//}

// Send transactions
public async sendTransaction(transactions: TransactionBase[], autoRecharge?: boolean): Promise<void> {
  this.safeClient = await createSafeClient({
    provider: RPC_TESTNET_GNOSIS,
    signer: SIGNER_PRIVATE_KEY,
    txServiceUrl: TX_SERVICE_URL_CHIADO,
    safeAddress: this.safeAddress //'0x...'
  })
    console.log('Safe address:', await this.safeClient.getAddress());
    console.log('Safe client:', this.safeClient);
    //console.log('Auto recharge parameter in service:', autoRecharge); // Log the new parameter
    console.log('Transactions to send:', transactions);

    //SEND TRANSACTION
    const txResult = await this.safeClient.send({ transactions })
    console.log('Transaction result:', txResult);
    const safeTxHash = txResult.transactions?.safeTxHash
    console.log('Safe transaction hash:', safeTxHash);
    const pendingTransactions = await this.safeClient.getPendingTransactions()
    console.log('Pending transactions:', pendingTransactions);

    for (const transaction of pendingTransactions.results) {
      if (transaction.safeTxHash !== safeTxHash) {
        return
      }

      const txResult = await this.safeClient.confirm({ safeTxHash })
      console.log('Transaction confirmed:', txResult);
    }
    return Promise.resolve();
  }


  //Stats information
  public async stats():Promise<SafeDetails>{
    this.safeClient = await createSafeClient({
      provider: RPC_TESTNET_GNOSIS!,
      signer: SIGNER_PRIVATE_KEY,
      txServiceUrl: TX_SERVICE_URL_CHIADO,
      safeAddress: this.safeAddress //'0x...'
    })
  //console.log('Safe client:', this.safeClient);
  let safeAddress  = this.safeAddress
    //this.safeClient!.protocolKit.connect({safeAddress})
    const publicClient = createPublicClient({
      chain: gnosisChiado,
      transport: http(RPC_TESTNET_GNOSIS)
    })
    const balance = await publicClient.getBalance({
      address: this.safeAddress!
    })
    try {
        const address = await this.safeClient!.getAddress()
        //const balance = await this.safeClient!.protocolKit.getBalance()
        console.log('Safe balance:', formatGwei(balance));
        const owners:string[] = await this.safeClient!.protocolKit.getOwners()
        const threshold = await this.safeClient!.protocolKit.getThreshold()
        const guard = await this.safeClient!.protocolKit.getGuard()
        const modules = await this.safeClient!.protocolKit.getModules()

        //not working because of cors
        //const pendingTransactions = await this.safeClient!.getPendingTransactions()
        //console.log('Pending transactions:', pendingTransactions);
        //const pendingTxs = pendingTransactions.count
        //const lastPending  = await this.getTxnDescription(pendingTransactions.results[pendingTransactions.count-1])
      let safeDetails:SafeDetails = {
        address: safeAddress!,
        balance: formatEther(balance),
        owners: owners,
        threshold: threshold, //1,//stats.threshold,
        lastPendingTxsDescription: "1 (Waiting for Bob)",
        pendingTxs: 5,// pendingTxs, //5 Raw count
        //modulesDescription: "1 (Daily Limit)",
        modules: ['AutoRecharge'], //(modules.length == 0) ? ['None'] : modules,//stats.modules, // Raw count
        guard: guard,//stats.guard,
        createdBy: "Thomas",
        createdDate: "2025-05-10"
      }
      return safeDetails
    }
    catch (error) {
      console.error('Error fetching Safe stats:', error);
      throw error;
    }
  }

  //helper function to get the description of the last pending transaction
  private getTxnDescription(pendingTx:SafeMultisigTransactionResponse): string {
  
    const flat: Record<string, string> = {}

    for (const [key, value] of Object.entries(pendingTx)) {
      if (value === undefined || typeof value === 'object' && !value) continue
  
      if (typeof value === 'object') {
        // For nested objects like dataDecoded, serialize minimally
        flat[key] = JSON.stringify(value)
      } else {
        flat[key] = String(value)
      }
    }
  
    return Object.entries(flat)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')
  }

  
//end of file  
}
