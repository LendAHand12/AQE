const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Load environment variables or use defaults
  const usdtAddress = process.env.USDT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955";
  const adminWallet = process.env.ADMIN_WALLET;

  if (!adminWallet) {
    throw new Error("ADMIN_WALLET is not set in .env");
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Get the ContractFactory
  const USDTPayment = await hre.ethers.getContractFactory("USDTPayment");

  // Deploy the contract
  const contract = await USDTPayment.deploy(usdtAddress, adminWallet);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("USDTPayment deployed to:", contractAddress);

  console.log("\nNext steps:");
  console.log("1. Add the contract address to your .env");
  console.log(`2. Verify the contract on BscScan: npx hardhat verify --network ${hre.network.name} ${contractAddress} "${usdtAddress}" "${adminWallet}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
