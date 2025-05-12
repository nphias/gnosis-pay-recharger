import { Injectable } from '@angular/core';
import { createSafeClient, SafeClient } from '@safe-global/sdk-starter-kit';
import Safe, {
  PredictedSafeProps,
  SafeAccountConfig,
  ExternalSigner,
  SafeDeploymentConfig
} from '@safe-global/protocol-kit'
import { gnosisChiado } from 'viem/chains'
import { createPublicClient, createWalletClient, http, formatEther, formatGwei, Chain, ClientConfig, EIP1193RequestFn, TransportConfig} from 'viem'
import { privateKeyToAccount } from 'viem/accounts';

import { SafeMultisigTransactionResponse, TransactionBase } from '@safe-global/types-kit';
import { SafeDetails } from '../app.component';
import { environment as env } from '../../environments/environment';
import { formatAbiItem } from 'viem/utils';


const safeAccountConfig: SafeAccountConfig = {
  owners: env.SAFE_OWNERS,  //'0x...'
  threshold: 1,
}

const predictedSafe: PredictedSafeProps = {
  safeAccountConfig,
  safeDeploymentConfig: { saltNonce: env.SALT_NONCE } //change this to trigger a new safe
  // More optional properties
}

@Injectable({ providedIn: 'root' })
export class SafeService {
  private safeClient: SafeClient | undefined;
  private safeAddress: string | undefined;

public async deploysafe(): Promise<string> {
  let mySafe = await Safe.init({
    provider: env.EIP1193PROVIDER,
    signer: env.SIGNER_PRIVATE_KEY,
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


// Send transactions
public async sendTransaction(transactions: TransactionBase[], autoRecharge?: boolean): Promise<void> {
  this.safeClient = await createSafeClient({
    provider: env.RPC_TESTNET,
    signer: env.SIGNER_PRIVATE_KEY,
    txServiceUrl: env.TX_SERVICE_URL,
    safeAddress: this.safeAddress //'0x...'
  })
    console.log('Safe address:', await this.safeClient.getAddress());
    console.log('Safe client:', this.safeClient);
    //console.log('Auto recharge parameter in service:', autoRecharge); // Log the new parameter
    console.log('Transactions to send:', transactions);

    const signerAddress = await this.safeClient.protocolKit.getSafeProvider();
    console.log('Signer address:', signerAddress);
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

  public async sendToSafe(value: string, data: string): Promise<void> {
    const client = createWalletClient({
      account: privateKeyToAccount(`0x${env.SIGNER_PRIVATE_KEY}`),
      chain: gnosisChiado,
      transport: http(env.EIP1193PROVIDER),
    // Implement the logic to send a transaction from the wallet
    })
    const txHash = await client.sendTransaction({
      to: this.safeAddress,
      value: BigInt(value),
      data: data as `0x${string}`,
    }) 
    console.log('Transaction hash:', txHash);
  }

  //Stats information
  public async stats():Promise<SafeDetails>{
    this.safeClient = await createSafeClient({
      provider: env.RPC_TESTNET,
      signer: env.SIGNER_PRIVATE_KEY,
      txServiceUrl: env.TX_SERVICE_URL,
      safeAddress: this.safeAddress //'0x...'
    })
  //console.log('Safe client:', this.safeClient);
  let safeAddress  = this.safeAddress
    //this.safeClient!.protocolKit.connect({safeAddress})
    const publicClient = createPublicClient({
      chain: gnosisChiado,
      transport: http(env.EIP1193PROVIDER)
    })
    const balance = await publicClient.getBalance({
      address: this.safeAddress!
    })
    try {
        const address = await this.safeClient!.getAddress()
        //const balance = await this.safeClient!.protocolKit.getBalance()
        const xDaiAmount = balance
        console.log('Safe balance:', xDaiAmount);
        console.log(`${xDaiAmount} xDAI`);
        const owners:string[] = await this.safeClient!.protocolKit.getOwners()
        const threshold = await this.safeClient!.protocolKit.getThreshold()
        const modules = await this.safeClient!.protocolKit.getModules()
        //const pendingTransactions = await this.safeClient!.getPendingTransactions()
        //console.log('Pending transactions:', pendingTransactions);
        //not working because of cors
        //const pendingTransactions = await this.safeClient!.getPendingTransactions()
        //console.log('Pending transactions:', pendingTransactions);
        //const pendingTxs = pendingTransactions.count
        //const lastPending  = await this.getTxnDescription(pendingTransactions.results[pendingTransactions.count-1])
      let safeDetails:SafeDetails = {
        address: safeAddress!,
        balance: `${xDaiAmount} xDAI`,
        owners: owners,
        threshold: threshold, //1,//stats.threshold,
        lastPendingTxsDescription: "1 (Waiting for Bob)",
        pendingTxs: 5,// pendingTxs, //5 Raw count
        //modulesDescription: "1 (Daily Limit)",
        modules: ['AutoRecharge'], //(modules.length == 0) ? ['None'] : modules,//stats.modules, // Raw count
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
      .map(([k, v]) => `, $, { k } = $, { v } `)
      .join(', ')
  }
  
//end of file  
}
