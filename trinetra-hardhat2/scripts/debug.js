const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0xf1329562011B656cE1d4cf78005F67a0524AAEb2";
    const tokenContract = await hre.ethers.getContractAt("GovtProjectToken", CONTRACT_ADDRESS);

    console.log("--- Starting Debug Script ---");
    console.log(`Connected to contract at: ${CONTRACT_ADDRESS}`);

    const latestBlock = await hre.ethers.provider.getBlockNumber();
    const fromBlock = latestBlock - 499;

    console.log(`Searching for "TransferRequestCreated" events from block ${fromBlock} to ${latestBlock}...`);

    const createdEvents = await tokenContract.queryFilter("TransferRequestCreated", fromBlock, latestBlock);

    if (createdEvents.length === 0) {
        console.log("\n--- FINAL RESULT ---");
        console.log("!!! No 'TransferRequestCreated' events found in the last 499 blocks. !!!");
        return;
    }

    console.log(`\nFound ${createdEvents.length} 'TransferRequestCreated' event(s). Now checking their current status...`);

    const pendingRequests = [];
    for (const event of createdEvents) {
        const requestId = event.args[0];
        const request = await tokenContract.transferRequests(requestId);
        console.log(`- Checking Request ID: ${requestId}, Current Status Code: ${request.status}`);
        
        // --- THIS IS THE FIXED LINE ---
        if (Number(request.status) === 0) { // Convert BigInt status to Number before comparing
            pendingRequests.push({ requestId: Number(request.id) });
        }
    }

    console.log("\n--- FINAL RESULT ---");
    if (pendingRequests.length > 0) {
        console.log("✅ SUCCESS! Found Pending Requests:", pendingRequests);
    } else {
        console.log("❌ No PENDING requests found. All found requests were likely already completed or rejected.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});