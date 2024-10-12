// This is the Hardhat configuration file for the crowdFunding project.
// Hardhat is a development environment to compile, deploy, test, and debug your Ethereum software.
// This file is used to configure the Hardhat environment and specify settings for the Solidity compiler and network configurations.

require("@nomicfoundation/hardhat-toolbox"); // Importing the Hardhat toolbox plugin which includes commonly used tools and plugins

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Solidity compiler version to be used for compiling the smart contracts
  solidity: "0.8.4",
  
  // Network configurations for deploying and testing the smart contracts
  networks: {
    // Configuration for the Hardhat Network, a local Ethereum network designed for development
    hardhat: {
      chainId: 31337, // Chain ID for the Hardhat Network, 31337 is the default value
    },
  },
};