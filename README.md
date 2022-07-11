# Rankanizer

Rankanizer is a ranking-based voting system! Imagine that you and your friends want to go to the cinema and you are split between 5 movies. You create the poll in the app and share it with them! Rankanizer will calculate which movie makes the most people happy and the least people unhappy.

## Getting started

1. Clone repo into your local machine
2. Inside project’s main folder: `npm install`
3. `npm run test -w @rankanizer-contracts/contracts`
Every test must pass

## Lint

    npm run lint --workspace @rankanizer-contracts/contracts

To automatically fix trivial lint issues

    npm run lint:fix --workspace @rankanizer-contracts/contracts


## Deploy

You will have to ask for .env file and place it at rankanizer-contracts/contracts

### On your local machine using Ganache

In any folder run `npm install -g ganache-cli`

`npx ganache-cli -m 'true hunt echo pink drama come work kiwi essay erupt joke stomach' --secure` Do not use this mneminic in Main Network

**Keep it running** and in another terminal session:

Inside project's main folder:

`npm run deploy-ganache --workspace @rankanizer-contracts/contracts`

if you want to upgrade the contract, save the constract's address returned after first deploy and teporarily set PROXY_ADDRESS in .env file with this address. Than:

`npm run upgrade-ganache --workspace @rankanizer-contracts/contracts`

### To Goerli Testnet

Rankanizer contract is already deployed to Goerli @ `0x28BfBc2BeF4AE1C400703C8A6C3ae2d9daE40d70` so you will only want to upgrade the contract using:

`npm run upgrade-goerli --workspace @rankanizer-contracts/contracts`
