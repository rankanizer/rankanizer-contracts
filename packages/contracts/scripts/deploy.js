const { ethers, upgrades } = require('hardhat');

async function main () {
  const [deployer] = await ethers.getSigners();

	console.log(
	"Deploying contracts with the account:",
	deployer.address
	);

	console.log("Account balance:", (await deployer.getBalance()).toString());

	const SchulzeVoting = await ethers.getContractFactory('SchulzeVoting');
	const schulze = await upgrades.deployProxy(SchulzeVoting);
  await schulze.deployed();
  
	console.log("Contract deployed at:", schulze.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
