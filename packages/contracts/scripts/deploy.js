require('dotenv').config();
const argv = require('yargs/yargs')()
  .env().options({
    firstDeploy: {
      type: 'boolean',
      default: false,
    },
  })
  .argv;

const { ethers, upgrades } = require('hardhat');
const { PROXY_ADDRESS } = process.env;

async function main () {
  const [deployer] = await ethers.getSigners();

  console.log(
    'Deploying contracts with the account:',
    deployer.address,
  );

  console.log('Account balance:', (await deployer.getBalance()).toString());

  const SchulzeVoting = await ethers.getContractFactory('SchulzeVoting');
  let schulze;
  if (argv.firstDeploy) {
    schulze = await upgrades.deployProxy(SchulzeVoting);
  } else {
    schulze = await upgrades.upgradeProxy(PROXY_ADDRESS, SchulzeVoting);
  }

  await schulze.deployed();

  console.log('Contract deployed at:', schulze.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
