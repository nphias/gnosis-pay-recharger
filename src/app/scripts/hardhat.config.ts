import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    chiado: {
      url: "https://rpc.chiadochain.net",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 10200,
    },
  },
};

export default config;
