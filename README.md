# CrowdFunding Project
This project represents a comprehensive and fully operational crowdfunding platform designed for deployment on any Ethereum network. The platform is underpinned by a robust smart contract and features an intuitive user interface, enabling users to perform the following actions:

- **Modify Contract Settings**: Users can adjust various parameters and settings of the smart contract to tailor the platform to their specific needs.
- **Submit New Project Proposals**: Users have the ability to propose new project ideas, which can then be reviewed and voted upon by the community.
- **Vote on Projects**: Community members can cast their votes on proposed projects, ensuring that only the most promising and well-supported initiatives receive funding.
- **Execute Approved Projects**: Once a project has garnered sufficient support, it can be executed in a decentralized and autonomous manner.
- **Contribute Funds**: Users can donate funds to the contract, supporting the execution of approved projects and contributing to the overall success of the platform.

All these actions are conducted in a fully decentralized, autonomous, and secure environment, leveraging the capabilities of Ethereum smart contracts. The project is rigorously tested to ensure reliability and robustness. The current configuration supports testing on both localhost and various Ethereum test networks, providing flexibility for development and deployment.

This platform aims to democratize the crowdfunding process, offering a transparent and secure method for raising and managing funds for innovative projects.

## Project Structure

- **contracts/**: Contains the Solidity smart contracts.
- **scripts/**: Deployment scripts.
- **test/**: Test files for the smart contracts.
- **ui/**: Contains the dApp UI in react.
- **hardhat.config.js**: Hardhat configuration file.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Hardhat](https://hardhat.org/)

### Installation

Clone the repository and install the dependencies:

```shell
git clone https://github.com/yourusername/crowdFunding.git
cd crowdFunding
npm install
```

### Running the Project

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat compile
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Testing

Run the tests to ensure everything is working correctly:

```shell
npx hardhat test
```

### Deployment

Deploy the contract to a local network:

```shell
npx hardhat run scripts/deploy.js --network localhost
```

## Contributing

Feel free to submit issues and enhancement requests.

## License

Distributed under the MIT License. See `LICENSE` for more information.

