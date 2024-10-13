const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * This test suite is designed to comprehensively test the functionality of a smart contract called "Fundme" that operates 
 * with weighted voting and multi-signature transaction approval. It covers various aspects of the contract's functionality, 
 * including deployment, membership management, transaction submission, confirmation, execution, and revocation, as well as 
 * ensuring that only valid members can submit and confirm transactions. The tests also cover edge cases such as preventing 
 * duplicate confirmations, handling insufficient transaction weight for execution, and reverting on unauthorized actions.
 * Additionally, the suite verifies the contract's behavior in handling ETH contributions, tracking contributions, and emitting 
 * appropriate events. Finally, proposals for adding/removing members or changing contract parameters are tested, ensuring that 
 * they can be submitted, voted on, and executed under the correct conditions.
 */


describe("Fundme with votingByWeight", function () {
    let Fundme, fundme, member, addr1, addr2, addr3, addrs;
    let votingByWeight = true;

    beforeEach(async function () {
        Fundme = await ethers.getContractFactory("Fundme");
        [member, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        fundme = await Fundme.deploy([member.address, addr1.address, addr2.address, addr3.address], 2, 50, votingByWeight);
        await fundme.waitForDeployment();
    });

describe("Deployment", function () {
        it("Should set the right members", async function () {
            expect(await fundme.getMembers()).to.deep.equal([member.address, addr1.address, addr2.address, addr3.address]);
        });

        it("Should set the right percentage of confirmations required", async function () {
            expect(await fundme.percentageConfirmationsRequired()).to.equal(50);
        });
    });

describe("Members", function () {
        it("Should print all members", async function () {
            const members = await fundme.getMembers();
            console.log("Members:", members);
            expect(members).to.deep.equal([member.address, addr1.address, addr2.address, addr3.address]);
        });
    });

describe("Transactions", function () {
        it("Should submit a transaction", async function () {
            await fundme.submitTransaction(addr1.address, 100, "0x");
            const tx = await fundme.getTransaction(0);
            expect(tx.to).to.equal(addr1.address);
            expect(tx.value).to.equal(100);
            expect(tx.executed).to.be.false;
            expect(tx.numConfirmations).to.equal(0);
            expect(tx.weight).to.equal(0);
        });

        it("Should confirm a transaction weight", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.connect(addr1).confirmTransaction(0);
            const tx = await fundme.getTransaction(0);
            expect(tx.weight).to.equal(ethers.parseEther("1.0"));
        });

        it("Should execute a transaction", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("2.0"), // Sending 1 ETH
            });

            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.connect(addr2).confirmTransaction(0);
            await fundme.executeTransaction(0);
            const tx = await fundme.getTransaction(0);
            expect(tx.executed).to.be.true;
        });

        it("Should not execute a transaction with less weight", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("2.0"), // Sending 1 ETH
            });

            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.connect(addr1).confirmTransaction(0);
            await expect(fundme.executeTransaction(0)).to.be.revertedWith("cannot execute tx - voting by weight");
        });

        it("Should revoke a confirmation", async function () {
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.connect(addr1).confirmTransaction(0);
            await fundme.connect(addr1).revokeConfirmation(0);
            const tx = await fundme.getTransaction(0);
            expect(tx.weight).to.equal(0);
        });
    });

describe("Modifiers", function () {
        it("Should revert if not member tries to submit transaction", async function () {
            await expect(fundme.connect(addrs[0]).submitTransaction(addr1.address, 100, "0x")).to.be.revertedWith("not member");
        });

        it("Should revert if transaction does not exist", async function () {
            await expect(fundme.confirmTransaction(0)).to.be.revertedWith("tx does not exist");
        });

        
        it("Should revert if transaction already executed", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            await addr2.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.confirmTransaction(0);
            await fundme.connect(addr1).confirmTransaction(0);
            await fundme.connect(addr2).confirmTransaction(0);
            await fundme.executeTransaction(0);
            await expect(fundme.executeTransaction(0)).to.be.revertedWith("tx already executed");
        });

        it("Should revert if transaction already confirmed", async function () {
            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.confirmTransaction(0);
            await expect(fundme.confirmTransaction(0)).to.be.revertedWith("tx already confirmed");
        });
    });

describe("Receive Function", function () {
        it("Should update contributions and totalContributions for members", async function () {
            await addr1.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            const contribution = await fundme.contributionsOf(addr1.address);
            const totalContributions = await fundme.totalContributions();

            expect(contribution).to.equal(ethers.parseEther("1.0"));
            expect(totalContributions).to.equal(ethers.parseEther("1.0"));
        });

        it("Should not update contributions for non-members", async function () {
            await addrs[0].sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            const contribution = await fundme.contributionsOf(addrs[0].address);
            const totalContributions = await fundme.totalContributions();

            expect(contribution).to.equal(0);
            expect(totalContributions).to.equal(0);
        });

        it("Should emit Deposit event on receiving ETH", async function () {
            await expect(() =>
                addr1.sendTransaction({
                    to: fundme.getAddress(),
                    value: ethers.parseEther("1.0"), // Sending 1 ETH
                })
            ).to.changeEtherBalances([addr1, fundme], [ethers.parseEther("-1.0"), ethers.parseEther("1.0")]);

            let balanceBefore = await ethers.provider.getBalance(fundme.getAddress());
            balanceBefore = balanceBefore + ethers.parseEther("1.0");
            await expect(
                addr1.sendTransaction({
                    to: fundme.getAddress(),
                    value: ethers.parseEther("1.0"), // Sending 1 ETH
                })
            ).to.emit(fundme, "Deposit").withArgs(addr1.address, ethers.parseEther("1.0"), balanceBefore );
        });
    });
});

describe("Fundme", function () {
    let Fundme, fundme, member, addr1, addr2, addr3, addrs;
    let votingByWeight = false;

    beforeEach(async function () {
        Fundme = await ethers.getContractFactory("Fundme");
        [member, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        fundme = await Fundme.deploy([member.address, addr1.address, addr2.address, addr3.address], 2, 51, votingByWeight);
        await fundme.waitForDeployment();
    });

describe("Deployment", function () {
        it("Should set the right members", async function () {
            expect(await fundme.getMembers()).to.deep.equal([member.address, addr1.address, addr2.address, addr3.address]);
        });

        it("Should set the right number of confirmations required", async function () {
            expect(await fundme.numConfirmationsRequired()).to.equal(2);
        });
    });

describe("Members", function () {
        it("Should print all members", async function () {
            const members = await fundme.getMembers();
            console.log("Members:", members);
            expect(members).to.deep.equal([member.address, addr1.address, addr2.address, addr3.address]);
        });
    });

describe("Transactions", function () {
        it("Should submit a transaction", async function () {
            await fundme.submitTransaction(addr1.address, 100, "0x");
            const tx = await fundme.getTransaction(0);
            expect(tx.to).to.equal(addr1.address);
            expect(tx.value).to.equal(100);
            expect(tx.executed).to.be.false;
            expect(tx.numConfirmations).to.equal(0);
        });

        it("Should confirm a transaction", async function () {
            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.confirmTransaction(0);
            const tx = await fundme.getTransaction(0);
            expect(tx.numConfirmations).to.equal(1);
        });

        it("Should execute a transaction", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.confirmTransaction(0);
            await fundme.connect(addr3).confirmTransaction(0);
            await fundme.connect(addr1).executeTransaction(0);
            const tx = await fundme.getTransaction(0);
            expect(tx.executed).to.be.true;
        });

        it("Should revoke a confirmation", async function () {
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.confirmTransaction(0);
            await fundme.revokeConfirmation(0);
            const tx = await fundme.getTransaction(0);
            expect(tx.numConfirmations).to.equal(0);
        });

        it("Should not execute a transaction without enough confirmations", async function () {
            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.confirmTransaction(0);
            await expect(fundme.executeTransaction(0)).to.be.revertedWith("cannot execute tx - voting by count");
        });
    });

describe("Modifiers", function () {
        it("Should revert if not member tries to submit transaction", async function () {
            await expect(fundme.connect(addrs[0]).submitTransaction(addr1.address, 100, "0x")).to.be.revertedWith("not member");
        });

        it("Should revert if transaction does not exist", async function () {
            await expect(fundme.confirmTransaction(0)).to.be.revertedWith("tx does not exist");
        });

        
        it("Should revert if transaction already executed", async function () {
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.confirmTransaction(0);
            await fundme.connect(addr1).confirmTransaction(0);
            await fundme.connect(addr3).confirmTransaction(0);
            await fundme.executeTransaction(0);
            await expect(fundme.executeTransaction(0)).to.be.revertedWith("tx already executed");
        });

        it("Should revert if transaction already confirmed", async function () {
            await fundme.submitTransaction(addr1.address, 100, "0x");
            await fundme.confirmTransaction(0);
            await expect(fundme.confirmTransaction(0)).to.be.revertedWith("tx already confirmed");
        });
    });

describe("Receive Function", function () {
        it("Should update contributions and totalContributions for members", async function () {
            await addr1.sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            const contribution = await fundme.contributionsOf(addr1.address);
            const totalContributions = await fundme.totalContributions();

            expect(contribution).to.equal(ethers.parseEther("1.0"));
            expect(totalContributions).to.equal(ethers.parseEther("1.0"));
        });

        it("Should not update contributions for non-members", async function () {
            await addrs[0].sendTransaction({
                to: fundme.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            const contribution = await fundme.contributionsOf(addrs[0].address);
            const totalContributions = await fundme.totalContributions();

            expect(contribution).to.equal(0);
            expect(totalContributions).to.equal(0);
        });

        it("Should emit Deposit event on receiving ETH", async function () {
            await expect(() =>
                addr1.sendTransaction({
                    to: fundme.getAddress(),
                    value: ethers.parseEther("1.0"), // Sending 1 ETH
                })
            ).to.changeEtherBalances([addr1, fundme], [ethers.parseEther("-1.0"), ethers.parseEther("1.0")]);

            let balanceBefore = await ethers.provider.getBalance(fundme.getAddress());
            balanceBefore = balanceBefore + ethers.parseEther("1.0");
            await expect(
                addr1.sendTransaction({
                    to: fundme.getAddress(),
                    value: ethers.parseEther("1.0"), // Sending 1 ETH
                })
            ).to.emit(fundme, "Deposit").withArgs(addr1.address, ethers.parseEther("1.0"), balanceBefore );
        });
    });
    describe("Proposals", function () {
        it("Should allow an member to propose a change in parameters", async function () {
            await fundme.submitProposal("changeParameter", '0x0000000000000000000000000000000000000000' , 60, 3, true);
            const proposal = await fundme.getProposal(0);
    
            expect(proposal.proposalType).to.equal("changeParameter");
            expect(proposal.newPercentageConfirmationsRequired).to.equal(60);
            expect(proposal.newNumConfirmationsRequired).to.equal(3);
            expect(proposal.newVotingByWeight).to.be.true;
        });
    
        it("Should allow an member to propose adding a new member", async function () {
            await fundme.submitProposal("addMember", addrs[0].address, 0, 0, false);
            const proposal = await fundme.getProposal(0);
    
            expect(proposal.proposalType).to.equal("addMember");
            expect(proposal.newMember).to.equal(addrs[0].address);
        });
    
        it("Should allow an member to propose removing an member", async function () {
            await fundme.submitProposal("removeMember", addr1.address, 0, 0, false);
            const proposal = await fundme.getProposal(0);
    
            expect(proposal.proposalType).to.equal("removeMember");
            expect(proposal.newMember).to.equal(addr1.address);
        });
    
        it("Should allow members to vote on proposals", async function () {
            await fundme.connect(addr1).submitProposal("changeParameter", '0x0000000000000000000000000000000000000000' , 60, 3, true);
    
            await fundme.connect(addr2).confirmProposal(0);
            const proposal = await fundme.getProposal(0);
    
            expect(proposal.numConfirmations).to.equal(1);
        });
    
        it("Should execute a parameter change proposal once enough votes are accumulated", async function () {
            await fundme.submitProposal("changeParameter", '0x0000000000000000000000000000000000000000' , 60, 3, true);
    
            await fundme.confirmProposal(0);
            await fundme.connect(addr1).confirmProposal(0);
    
            await fundme.executeProposal(0);
    
            expect(await fundme.percentageConfirmationsRequired()).to.equal(60);
            expect(await fundme.numConfirmationsRequired()).to.equal(3);
            expect(await fundme.votingByWeight()).to.be.true;
        });
    
        it("Should execute adding a new member once enough votes are accumulated", async function () {
            await fundme.submitProposal("addMember", addrs[0].address, 0, 0, false);
    
            await fundme.confirmProposal(0);
            await fundme.connect(addr1).confirmProposal(0);
    
            await fundme.executeProposal(0);
    
            const members = await fundme.getMembers();
            expect(members).to.include(addrs[0].address);
        });
    
        it("Should execute removing an member once enough votes are accumulated", async function () {
            await fundme.submitProposal("removeMember", addr1.address, 0, 0, false);
    
            await fundme.confirmProposal(0);
            await fundme.connect(addr2).confirmProposal(0);
    
            await fundme.executeProposal(0);
    
            const members = await fundme.getMembers();
            expect(members).to.not.include(addr1.address);
        });
    
        it("Should not execute a proposal without enough votes", async function () {
            await fundme.submitProposal("changeParameter", '0x0000000000000000000000000000000000000000' , 60, 3, true);
    
            await fundme.confirmProposal(0); // Only one confirmation
    
            await expect(fundme.executeProposal(0)).to.be.revertedWith("cannot execute proposal - voting by count");
        });
    });
    
});

