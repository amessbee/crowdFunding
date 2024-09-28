const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Fundme", function () {
    let Fundme, fundme, owner, addr1, addr2, addr3, addrs;

    beforeEach(async function () {
        Fundme = await ethers.getContractFactory("Fundme");
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        fundme = await Fundme.deploy([owner.address, addr1.address, addr2.address, addr3.address], 2);
        await fundme.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owners", async function () {
            expect(await fundme.getOwners()).to.deep.equal([owner.address, addr1.address, addr2.address, addr3.address]);
        });

        it("Should set the right number of confirmations required", async function () {
            expect(await fundme.numConfirmationsRequired()).to.equal(2);
        });
    });

    describe("Owners", function () {
        it("Should print all owners", async function () {
            const owners = await fundme.getOwners();
            console.log("Owners:", owners);
            expect(owners).to.deep.equal([owner.address, addr1.address, addr2.address, addr3.address]);
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
            await expect(fundme.executeTransaction(0)).to.be.revertedWith("cannot execute tx");
        });
    });

    describe("Modifiers", function () {
        it("Should revert if not owner tries to submit transaction", async function () {
            await expect(fundme.connect(addrs[0]).submitTransaction(addr1.address, 100, "0x")).to.be.revertedWith("not owner");
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