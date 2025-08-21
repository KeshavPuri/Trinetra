const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovtProjectToken", function () {
    let tokenContract, admin, user1, user2, signer1, signer2, stranger;
    const initialSupply = 1000000;
    const requiredSignatures = 2;

    beforeEach(async function () {
        [admin, user1, user2, signer1, signer2, stranger] = await ethers.getSigners();
        const TokenFactory = await ethers.getContractFactory("GovtProjectToken");
        tokenContract = await TokenFactory.deploy(initialSupply, requiredSignatures);

        await tokenContract.connect(admin).addSigner(signer1.address);
        await tokenContract.connect(admin).addSigner(signer2.address);

        const amountToSend = ethers.parseEther("1000");
        await tokenContract.connect(admin).initiateTransfer(user1.address, amountToSend, "initial_distribution");
        await tokenContract.connect(signer1).approveTransfer(1);
        await tokenContract.connect(signer2).approveTransfer(1);
    });

    // ... (Keep the existing 'Deployment and Setup', 'Multi-Signature Transfer', and 'Multi-Signature Burn' blocks as they are)

    describe("Deployment and Setup", function () {
        it("Should mint the initial supply to the admin", async function () {
            const adminBalance = await tokenContract.balanceOf(admin.address);
            const expectedBalance = ethers.parseEther(String(initialSupply - 1000));
            expect(adminBalance).to.equal(expectedBalance);
        });

        it("Should correctly assign signers", async function () {
            expect(await tokenContract.isSigner(signer1.address)).to.be.true;
            expect(await tokenContract.isSigner(signer2.address)).to.be.true;
        });
    });

    describe("Multi-Signature Transfer Workflow", function () {
        it("Should allow a user to initiate a transfer and signers to approve it", async function () {
            const amountToTransfer = ethers.parseEther("50");
            const billHash = "payment_bill_123";
            
            await expect(tokenContract.connect(user1).initiateTransfer(user2.address, amountToTransfer, billHash))
                .to.emit(tokenContract, "TransferRequestCreated")
                .withArgs(2, user1.address, user2.address, amountToTransfer, billHash);

            await tokenContract.connect(signer1).approveTransfer(2);
            await expect(tokenContract.connect(signer2).approveTransfer(2))
                .to.emit(tokenContract, "TransferCompleted")
                .withArgs(2);

            expect(await tokenContract.balanceOf(user2.address)).to.equal(amountToTransfer);
        });
    });

    describe("Multi-Signature Burn Workflow", function () {
        it("Should allow a user to initiate a burn and signers to approve it", async function() {
            const amountToBurn = ethers.parseEther("200");
            const initialTotalSupply = await tokenContract.totalSupply();
            
            const bankDetails = "SBI, Account: 12345, IFSC: SBIN0001";
            await tokenContract.connect(user1).initiateBurn(amountToBurn, bankDetails);

            await tokenContract.connect(signer1).approveBurn(1);
            await expect(tokenContract.connect(signer2).approveBurn(1))
                .to.emit(tokenContract, "BurnRequestApproved");

            const expectedUserBalance = ethers.parseEther("800"); 
            expect(await tokenContract.balanceOf(user1.address)).to.equal(expectedUserBalance);
        });
    });

    // --- NEW: EDGE CASE TESTS ---
    describe("Edge Cases and Security", function () {

        it("Should FAIL to initiate a transfer if the user has insufficient balance", async function () {
            const hugeAmount = ethers.parseEther("5000"); // user1 only has 1000
            await expect(tokenContract.connect(user1).initiateTransfer(user2.address, hugeAmount, "bill_insufficient"))
                .to.be.revertedWith("Insufficient balance");
        });

        it("Should FAIL a transfer if the sender's balance decreases before final approval", async function () {
            const amountToTransfer = ethers.parseEther("600");
            // Step 1: user1 initiates a transfer of 600 tokens to user2 (Request ID 2)
            await tokenContract.connect(user1).initiateTransfer(user2.address, amountToTransfer, "bill_edge_1");
            
            // Step 2: user1 initiates another transfer of 500 tokens to admin (Request ID 3)
            // User1 has 1000 tokens, so they have enough to promise both transfers (600 + 500 = 1100 > 1000), but not to fulfill them.
            await tokenContract.connect(user1).initiateTransfer(admin.address, ethers.parseEther("500"), "bill_edge_2");

            // Step 3: The second transfer (500 tokens to admin) gets approved first and succeeds.
            await tokenContract.connect(signer1).approveTransfer(3);
            await tokenContract.connect(signer2).approveTransfer(3);
            
            // Now user1 only has 500 tokens left (1000 - 500).

            // Step 4: Signers try to approve the first transfer of 600 tokens. It should fail.
            await tokenContract.connect(signer1).approveTransfer(2);
            await expect(tokenContract.connect(signer2).approveTransfer(2))
                .to.be.revertedWith("Sender balance changed, transfer failed");
        });

        it("Should FAIL if a non-signer tries to approve a transfer", async function () {
            const amountToTransfer = ethers.parseEther("50");
            await tokenContract.connect(user1).initiateTransfer(user2.address, amountToTransfer, "bill_unauthorized");

            // 'stranger' is not a signer and should not be able to approve
            await expect(tokenContract.connect(stranger).approveTransfer(2))
                .to.be.revertedWith("Only signers can approve");
        });

        it("Should FAIL if a non-admin tries to add a new signer", async function () {
            // 'user1' is not an admin
            await expect(tokenContract.connect(user1).addSigner(stranger.address))
                .to.be.revertedWith("Only admin can add signers");
        });
    });
});