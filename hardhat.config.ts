import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-web3";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
      ropsten_infura: {
        url: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        accounts: [`0x` + process.env.PRIVATE_KEY],
        gasPrice: 1000
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
