// scripts/deploy.js
// contract address on localhost: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
async function main () {
    // We get the contract to deploy
    const Fundme = await ethers.getContractFactory('Fundme');
    console.log('Deploying Fundme...');
    
    const exampleAddresses = ["0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", "0xdD2FD4581271e230360230F9337D5c0430Bf44C0", "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E", "0x2546BcD3c84621e976D8185a91A922aE77ECEc30", "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
      "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "0x90F79bf6EB2c4f870365E785982E1f101E93b906", "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
    ];
    const exampleNumber = 2;

    const fundme = await Fundme.deploy(exampleAddresses, exampleNumber, 50, false);
    await fundme.waitForDeployment();
    console.log('Fundme deployed to:', await fundme.getAddress());
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
