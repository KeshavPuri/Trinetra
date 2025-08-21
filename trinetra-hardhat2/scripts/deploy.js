const hre = require("hardhat");

async function main() {
  const INITIAL_SUPPLY = 1000000; // 1 Million tokens
  const REQUIRED_SIGNATURES = 2; // 2 approvals needed

  console.log("Deploying GovtProjectToken contract...");

  const GovtProjectToken = await hre.ethers.getContractFactory("GovtProjectToken");
  const tokenContract = await GovtProjectToken.deploy(INITIAL_SUPPLY, REQUIRED_SIGNATURES);

  await tokenContract.waitForDeployment(); // Use this instead of .deployed()

  const contractAddress = await tokenContract.getAddress();
  console.log(`GovtProjectToken deployed to: ${contractAddress}`);
  
  console.log("\nTo verify on Etherscan, run this command:");
  console.log(`npx hardhat verify --network sepolia ${contractAddress} "${INITIAL_SUPPLY}" "${REQUIRED_SIGNATURES}"`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});