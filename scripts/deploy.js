/**
 * @file deploy.js
 * @description This script deploys the CrowdFunding smart contract to the Ethereum network and saves the contract's ABI and address to a JavaScript file for frontend use.
 * 
 * The script performs the following steps:
 * 1. Retrieves the contract factory for the CrowdFunding contract.
 * 2. Deploys the CrowdFunding contract with specified member addresses and other parameters.
 * 3. Waits for the deployment to complete and retrieves the contract address.
 * 4. Writes the contract's ABI and address to a specified JavaScript file for frontend integration.
 */

const fs = require('fs'); // Import the file system module to write files
const contractName = "CrowdFunding"; // Name of the contract to deploy

async function main () {
  // We get the contract to deploy
  const CrowdFunding = await ethers.getContractFactory('CrowdFunding'); // Retrieve the contract factory for CrowdFunding
  console.log('Deploying CrowdFunding...'); // Log the deployment process
  
  // List of member addresses for the CrowdFunding contract
  const memberAddresses = [
    "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", 
    "0xdD2FD4581271e230360230F9337D5c0430Bf44C0", 
    "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E", 
    "0x2546BcD3c84621e976D8185a91A922aE77ECEc30", 
    "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
    "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097", 
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906", 
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", 
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
  ];
  const minimumVotes = 1; // Minimum votes required for a proposal to pass

  // Deploy the CrowdFunding contract with the specified parameters
  const crowdFunding = await CrowdFunding.deploy(memberAddresses, minimumVotes, 50, false);
  await crowdFunding.waitForDeployment(); // Wait for the deployment to complete
  const contractAddress = await crowdFunding.getAddress(); // Retrieve the deployed contract's address
  console.log('CrowdFunding deployed to:', contractAddress); // Log the contract address

  // Append the contract address and ABI to contractABI.js for frontend use
  const outputFilePath = './ui/src/contractABI.js'; // Path to the output file
  const contractABI = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`).abi; // Retrieve the contract's ABI
  
  // Content to be written to the output file
  const content = `
    export const contractABI = ${JSON.stringify(contractABI, null, 2)};
    export const contractAddress = "${contractAddress}";
  `;

  fs.writeFileSync(outputFilePath, content, 'utf8'); // Write the ABI and address to the file
  console.log('ABI and address saved to contractABI.js'); // Log the completion of the file write
}
  
// Execute the main function and handle any errors
main()
  .then(() => process.exit(0)) // Exit the process with a success code
  .catch(error => {
    console.error(error); // Log any errors that occur
    process.exit(1); // Exit the process with an error code
  });
