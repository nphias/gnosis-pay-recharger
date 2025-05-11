// scripts/deploy.ts
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { hardhat } from "viem/chains";
import dotenv from "dotenv";
import hre from "hardhat";

dotenv.config();

//npx hardhat run scripts/deploy.ts --network chiado

//output: RechargeModule deployed to: 0xYourModuleAddress

/*import { createSafeClient } from '@safe-global/sdk-starter-kit'

const safeClient = await createSafeClient({
  provider: RPC_URL,
  signer: OWNER_PRIVATE_KEY,
  safeAddress: SAFE_ADDRESS
})

const result = await safeClient.addModule({
  moduleAddress: '0xYourModuleAddress'
})

console.log('Module enabled tx hash:', result.transactionResponse?.hash)

const modules = await safeClient.protocolKit.getModules()
console.log('Modules installed:', modules)

*/

async function main() {
  const targetSafe = process.env.TARGET_SAFE_ADDRESS as `0x${string}`;
  const amount = parseEther("0.1"); // 0.1 xDAI

  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const { contractAddress } = await deployer.deployContract("RechargeModule", [targetSafe, amount]);
  console.log(`RechargeModule deployed to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


/*
// test/RechargeModule.test.ts
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("RechargeModule", function () {
  it("should send xDAI to the target safe", async function () {
    const [deployer, target] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    const amount = parseEther("0.1");

    const { contract } = await deployer.deployContract("RechargeModule", [target.account.address, amount]);

    // Fund the module contract
    await deployer.sendTransaction({
      to: contract.address,
      value: amount,
    });

    const balanceBefore = await publicClient.getBalance({ address: target.account.address });
    await deployer.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "sendRecharge"
    });
    const balanceAfter = await publicClient.getBalance({ address: target.account.address });

    expect(balanceAfter - balanceBefore).to.equal(amount);
  });
});
*/