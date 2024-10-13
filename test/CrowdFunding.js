const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * This test suite is designed to comprehensively test the functionality of a smart contract called "CrowdFunding" that operates 
 * with weighted voting and multi-signature project approval. It covers various aspects of the contract's functionality, 
 * including deployment, membership management, project submission, approval, execution, and revocation, as well as 
 * ensuring that only valid members can submit and approve projects. The tests also cover edge cases such as preventing 
 * duplicate approvals, handling insufficient project weight for execution, and reverting on unauthorized actions.
 * Additionally, the suite verifies the contract's behavior in handling ETH contributions, tracking contributions, and emitting 
 * appropriate events. Finally, proposals for adding/removing members or changing contract parameters are tested, ensuring that 
 * they can be submitted, voted on, and executed under the correct conditions.
 */


describe("CrowdFunding with votingByWeight", function () {
    let CrowdFunding, crowdFunding, member, addr1, addr2, addr3, addrs;
    let votingByWeight = true;

    beforeEach(async function () {
        CrowdFunding = await ethers.getContractFactory("CrowdFunding");
        [member, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        crowdFunding = await CrowdFunding.deploy([member.address, addr1.address, addr2.address, addr3.address], 2, 50, votingByWeight);
        await crowdFunding.waitForDeployment();
    });

describe("Deployment", function () {
        it("Should set the right members", async function () {
            expect(await crowdFunding.getMembers()).to.deep.equal([member.address, addr1.address, addr2.address, addr3.address]);
        });

        it("Should set the right percentage of approvals required", async function () {
            expect(await crowdFunding.percentageApprovalsRequired()).to.equal(50);
        });
    });

describe("Members", function () {
        it("Should print all members", async function () {
            const members = await crowdFunding.getMembers();
            console.log("Members:", members);
            expect(members).to.deep.equal([member.address, addr1.address, addr2.address, addr3.address]);
        });
    });

describe("Projects", function () {
        it("Should submit a project", async function () {
            await crowdFunding.submitProject(addr1.address, 100, "0x");
            const tx = await crowdFunding.getProject(0);
            expect(tx.to).to.equal(addr1.address);
            expect(tx.value).to.equal(100);
            expect(tx.executed).to.be.false;
            expect(tx.numApprovals).to.equal(0);
            expect(tx.weight).to.equal(0);
        });

        it("Should approve a project weight", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.connect(addr1).approveProject(0);
            const tx = await crowdFunding.getProject(0);
            expect(tx.weight).to.equal(ethers.parseEther("1.0"));
        });

        it("Should execute a project", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("2.0"), // Sending 1 ETH
            });

            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.connect(addr2).approveProject(0);
            await crowdFunding.executeProject(0);
            const tx = await crowdFunding.getProject(0);
            expect(tx.executed).to.be.true;
        });

        it("Should not execute a project with less weight", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("2.0"), // Sending 1 ETH
            });

            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.connect(addr1).approveProject(0);
            await expect(crowdFunding.executeProject(0)).to.be.revertedWith("cannot execute tx - voting by weight");
        });

        it("Should revoke an approval", async function () {
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.connect(addr1).approveProject(0);
            await crowdFunding.connect(addr1).revokeApproval(0);
            const tx = await crowdFunding.getProject(0);
            expect(tx.weight).to.equal(0);
        });
    });

describe("Modifiers", function () {
        it("Should revert if not member tries to submit project", async function () {
            await expect(crowdFunding.connect(addrs[0]).submitProject(addr1.address, 100, "0x")).to.be.revertedWith("not member");
        });

        it("Should revert if project does not exist", async function () {
            await expect(crowdFunding.approveProject(0)).to.be.revertedWith("tx does not exist");
        });

        
        it("Should revert if project already executed", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            await addr2.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.approveProject(0);
            await crowdFunding.connect(addr1).approveProject(0);
            await crowdFunding.connect(addr2).approveProject(0);
            await crowdFunding.executeProject(0);
            await expect(crowdFunding.executeProject(0)).to.be.revertedWith("tx already executed");
        });

        it("Should revert if project already approved", async function () {
            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.approveProject(0);
            await expect(crowdFunding.approveProject(0)).to.be.revertedWith("tx already approved");
        });
    });

describe("Receive Function", function () {
        it("Should update contributions and totalContributions for members", async function () {
            await addr1.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            const contribution = await crowdFunding.contributionsOf(addr1.address);
            const totalContributions = await crowdFunding.totalContributions();

            expect(contribution).to.equal(ethers.parseEther("1.0"));
            expect(totalContributions).to.equal(ethers.parseEther("1.0"));
        });

        it("Should not update contributions for non-members", async function () {
            await addrs[0].sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            const contribution = await crowdFunding.contributionsOf(addrs[0].address);
            const totalContributions = await crowdFunding.totalContributions();

            expect(contribution).to.equal(0);
            expect(totalContributions).to.equal(0);
        });

        it("Should emit Deposit event on receiving ETH", async function () {
            await expect(() =>
                addr1.sendTransaction({
                    to: crowdFunding.getAddress(),
                    value: ethers.parseEther("1.0"), // Sending 1 ETH
                })
            ).to.changeEtherBalances([addr1, crowdFunding], [ethers.parseEther("-1.0"), ethers.parseEther("1.0")]);

            let balanceBefore = await ethers.provider.getBalance(crowdFunding.getAddress());
            balanceBefore = balanceBefore + ethers.parseEther("1.0");
            await expect(
                addr1.sendTransaction({
                    to: crowdFunding.getAddress(),
                    value: ethers.parseEther("1.0"), // Sending 1 ETH
                })
            ).to.emit(crowdFunding, "Deposit").withArgs(addr1.address, ethers.parseEther("1.0"), balanceBefore );
        });
    });
});

describe("CrowdFunding", function () {
    let CrowdFunding, crowdFunding, member, addr1, addr2, addr3, addrs;
    let votingByWeight = false;

    beforeEach(async function () {
        CrowdFunding = await ethers.getContractFactory("CrowdFunding");
        [member, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        crowdFunding = await CrowdFunding.deploy([member.address, addr1.address, addr2.address, addr3.address], 2, 51, votingByWeight);
        await crowdFunding.waitForDeployment();
    });

describe("Deployment", function () {
        it("Should set the right members", async function () {
            expect(await crowdFunding.getMembers()).to.deep.equal([member.address, addr1.address, addr2.address, addr3.address]);
        });

        it("Should set the right number of approvals required", async function () {
            expect(await crowdFunding.numApprovalsRequired()).to.equal(2);
        });
    });

describe("Members", function () {
        it("Should print all members", async function () {
            const members = await crowdFunding.getMembers();
            console.log("Members:", members);
            expect(members).to.deep.equal([member.address, addr1.address, addr2.address, addr3.address]);
        });
    });

describe("Projects", function () {
        it("Should submit a project", async function () {
            await crowdFunding.submitProject(addr1.address, 100, "0x");
            const tx = await crowdFunding.getProject(0);
            expect(tx.to).to.equal(addr1.address);
            expect(tx.value).to.equal(100);
            expect(tx.executed).to.be.false;
            expect(tx.numApprovals).to.equal(0);
        });

        it("Should approve a project", async function () {
            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.approveProject(0);
            const tx = await crowdFunding.getProject(0);
            expect(tx.numApprovals).to.equal(1);
        });

        it("Should execute a project", async function () {
            // Send some ETH to the contract
            await addr1.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.approveProject(0);
            await crowdFunding.connect(addr3).approveProject(0);
            await crowdFunding.connect(addr1).executeProject(0);
            const tx = await crowdFunding.getProject(0);
            expect(tx.executed).to.be.true;
        });

        it("Should revoke an approval", async function () {
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.approveProject(0);
            await crowdFunding.revokeApproval(0);
            const tx = await crowdFunding.getProject(0);
            expect(tx.numApprovals).to.equal(0);
        });

        it("Should not execute a project without enough approvals", async function () {
            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.approveProject(0);
            await expect(crowdFunding.executeProject(0)).to.be.revertedWith("cannot execute tx - voting by count");
        });
    });

describe("Modifiers", function () {
        it("Should revert if not member tries to submit project", async function () {
            await expect(crowdFunding.connect(addrs[0]).submitProject(addr1.address, 100, "0x")).to.be.revertedWith("not member");
        });

        it("Should revert if project does not exist", async function () {
            await expect(crowdFunding.approveProject(0)).to.be.revertedWith("tx does not exist");
        });

        
        it("Should revert if project already executed", async function () {
            // Send some ETH to the contract
            await addr2.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });
            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.approveProject(0);
            await crowdFunding.connect(addr1).approveProject(0);
            await crowdFunding.connect(addr3).approveProject(0);
            await crowdFunding.executeProject(0);
            await expect(crowdFunding.executeProject(0)).to.be.revertedWith("tx already executed");
        });

        it("Should revert if project already approved", async function () {
            await crowdFunding.submitProject(addr1.address, 100, "0x");
            await crowdFunding.approveProject(0);
            await expect(crowdFunding.approveProject(0)).to.be.revertedWith("tx already approved");
        });
    });

describe("Receive Function", function () {
        it("Should update contributions and totalContributions for members", async function () {
            await addr1.sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            const contribution = await crowdFunding.contributionsOf(addr1.address);
            const totalContributions = await crowdFunding.totalContributions();

            expect(contribution).to.equal(ethers.parseEther("1.0"));
            expect(totalContributions).to.equal(ethers.parseEther("1.0"));
        });

        it("Should not update contributions for non-members", async function () {
            await addrs[0].sendTransaction({
                to: crowdFunding.getAddress(),
                value: ethers.parseEther("1.0"), // Sending 1 ETH
            });

            const contribution = await crowdFunding.contributionsOf(addrs[0].address);
            const totalContributions = await crowdFunding.totalContributions();

            expect(contribution).to.equal(0);
            expect(totalContributions).to.equal(0);
        });

        it("Should emit Deposit event on receiving ETH", async function () {
            await expect(() =>
                addr1.sendTransaction({
                    to: crowdFunding.getAddress(),
                    value: ethers.parseEther("1.0"), // Sending 1 ETH
                })
            ).to.changeEtherBalances([addr1, crowdFunding], [ethers.parseEther("-1.0"), ethers.parseEther("1.0")]);

            let balanceBefore = await ethers.provider.getBalance(crowdFunding.getAddress());
            balanceBefore = balanceBefore + ethers.parseEther("1.0");
            await expect(
                addr1.sendTransaction({
                    to: crowdFunding.getAddress(),
                    value: ethers.parseEther("1.0"), // Sending 1 ETH
                })
            ).to.emit(crowdFunding, "Deposit").withArgs(addr1.address, ethers.parseEther("1.0"), balanceBefore );
        });
    });
    describe("Proposals", function () {
        it("Should allow an member to propose a change in parameters", async function () {
            await crowdFunding.submitProposal("changeParameter", '0x0000000000000000000000000000000000000000' , 60, 3, true);
            const proposal = await crowdFunding.getProposal(0);
    
            expect(proposal.proposalType).to.equal("changeParameter");
            expect(proposal.newPercentageApprovalsRequired).to.equal(60);
            expect(proposal.newNumApprovalsRequired).to.equal(3);
            expect(proposal.newVotingByWeight).to.be.true;
        });
    
        it("Should allow an member to propose adding a new member", async function () {
            await crowdFunding.submitProposal("addMember", addrs[0].address, 0, 0, false);
            const proposal = await crowdFunding.getProposal(0);
    
            expect(proposal.proposalType).to.equal("addMember");
            expect(proposal.newMember).to.equal(addrs[0].address);
        });
    
        it("Should allow an member to propose removing an member", async function () {
            await crowdFunding.submitProposal("removeMember", addr1.address, 0, 0, false);
            const proposal = await crowdFunding.getProposal(0);
    
            expect(proposal.proposalType).to.equal("removeMember");
            expect(proposal.newMember).to.equal(addr1.address);
        });
    
        it("Should allow members to vote on proposals", async function () {
            await crowdFunding.connect(addr1).submitProposal("changeParameter", '0x0000000000000000000000000000000000000000' , 60, 3, true);
    
            await crowdFunding.connect(addr2).approveProposal(0);
            const proposal = await crowdFunding.getProposal(0);
    
            expect(proposal.numApprovals).to.equal(1);
        });
    
        it("Should execute a parameter change proposal once enough votes are accumulated", async function () {
            await crowdFunding.submitProposal("changeParameter", '0x0000000000000000000000000000000000000000' , 60, 3, true);
    
            await crowdFunding.approveProposal(0);
            await crowdFunding.connect(addr1).approveProposal(0);
    
            await crowdFunding.executeProposal(0);
    
            expect(await crowdFunding.percentageApprovalsRequired()).to.equal(60);
            expect(await crowdFunding.numApprovalsRequired()).to.equal(3);
            expect(await crowdFunding.votingByWeight()).to.be.true;
        });
    
        it("Should execute adding a new member once enough votes are accumulated", async function () {
            await crowdFunding.submitProposal("addMember", addrs[0].address, 0, 0, false);
    
            await crowdFunding.approveProposal(0);
            await crowdFunding.connect(addr1).approveProposal(0);
    
            await crowdFunding.executeProposal(0);
    
            const members = await crowdFunding.getMembers();
            expect(members).to.include(addrs[0].address);
        });
    
        it("Should execute removing an member once enough votes are accumulated", async function () {
            await crowdFunding.submitProposal("removeMember", addr1.address, 0, 0, false);
    
            await crowdFunding.approveProposal(0);
            await crowdFunding.connect(addr2).approveProposal(0);
    
            await crowdFunding.executeProposal(0);
    
            const members = await crowdFunding.getMembers();
            expect(members).to.not.include(addr1.address);
        });
    
        it("Should not execute a proposal without enough votes", async function () {
            await crowdFunding.submitProposal("changeParameter", '0x0000000000000000000000000000000000000000' , 60, 3, true);
    
            await crowdFunding.approveProposal(0); // Only one approval
    
            await expect(crowdFunding.executeProposal(0)).to.be.revertedWith("cannot execute proposal - voting by count");
        });
    });
    
});

