require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { string } = require('yargs');
const argv = require('yargs/yargs')()
  .env('')
  .options({
    ci: {
      type: 'boolean',
      default: false,
    },
    gas: {
      alias: 'enableGasReport',
      type: 'boolean',
      default: false,
    },
    mode: {
      alias: 'compileMode',
      type: 'string',
      choices: [ 'production', 'development' ],
      default: 'development',
    },
    compiler: {
      alias: 'compileVersion',
      type: 'string',
      default: '0.8.3',
    },
    alchemy_api_url: {
      alias: 'alchemyApiUrl',
      type: 'string',
      requiresArg: false,
    },
    PRIVATE_KEY: {
      alias: 'privateKey',
      type: 'string',
      requiresArg: false,
      // default: '19296c9c9ba8d87dff1024d9a494494f8174a85a0ddb28ad1d93825561b1d076'
    },
  })
  .argv;

require('@nomiclabs/hardhat-truffle5');
require('solidity-coverage');
require('@openzeppelin/hardhat-upgrades');

if (argv.enableGasReport) {
  require('hardhat-gas-reporter');
}

for (const f of fs.readdirSync(path.join(__dirname, 'hardhat'))) {
  require(path.join(__dirname, 'hardhat', f));
}

const withOptimizations = argv.enableGasReport || argv.compileMode === 'production';

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: argv.compiler,
    settings: {
      optimizer: {
        enabled: withOptimizations,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      blockGasLimit: 10000000,
      allowUnlimitedContractSize: !withOptimizations,
      accounts: {
        count: 151,
      },
    },
    ganache: {
      url: 'http://127.0.0.1:8545',
      blockGasLimit: 10000000,
      allowUnlimitedContractSize: !withOptimizations,
      accounts: {
        mnemonic: 'true hunt echo pink drama come work kiwi essay erupt joke stomach',
        initialIndex: 0,
        count: 10,
      },
    },
    goerli: {
      url: argv.alchemyApiUrl,
      chainId: 5,
      from: '0x606C8a27611e1Cd8c3278079B6e2477Ee6e9e42d',
      blockGasLimit: 10000000,
      allowUnlimitedContractSize: true,
      accounts: [`0x${argv.privateKey}`],
    },
  },
  gasReporter: {
    currency: 'USD',
    outputFile: argv.ci ? 'gas-report.txt' : undefined,
  },
};
