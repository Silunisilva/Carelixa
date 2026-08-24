const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const ConsentManager = await hre.ethers.getContractFactory("ConsentManager");
  const consentManager = await ConsentManager.deploy();

  await consentManager.waitForDeployment();
  const address = await consentManager.getAddress();
  
  console.log(`ConsentManager deployed to ${address}`);

  // Save the contract address and ABI to the src directory so the React app can use it
  const contractData = {
    address: address,
    abi: JSON.parse(consentManager.interface.formatJson())
  };

  const contractDataPath = path.join(__dirname, "../src/config/contractData.json");
  fs.writeFileSync(contractDataPath, JSON.stringify(contractData, null, 2));
  console.log(`Contract data saved to ${contractDataPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
