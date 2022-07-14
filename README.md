# Rankanizer

Rankanizer is a ranking-based voting system! Imagine that you and your friends want to go to the cinema and you are split between 5 movies. You create the poll in the app and share it with them! Rankanizer will calculate which movie makes the most people happy and the least people unhappy.

This repository concentrate all the Rankanizer's smart-contracts written in Solidity for Ethereum Network with all it's tests, deployment functions and a React application Playground to test the contracts in a friendly interface.

## Getting started

1. Clone repo into your local machine
2. Inside project’s main folder: `npm install`
3. `npm run test -w @rankanizer-contracts/contracts`
Every test must pass

## Lint and Test Coverage

In order to merge a PR, the CI will check for Lint issues and perform all unit tests. All lint rules must be followed and the expected test coverage are 100% (except for third-part written code). 

100% coverage means that every single line of solidity code written to this project must be called at least once by one test. 

Performing all unit tests:

    `npm run test -w @rankanizer-contracts/contracts`

Checking for lint issues

    `npm run lint -w @rankanizer-contracts/contracts`

To automatically fix trivial lint issues

    `npm run lint:fix -w @rankanizer-contracts/contracts`

Checking test coverage

    `npm run coverage -w @rankanizer-contracts/contracts`

## Gas Report

You can generate a full gas report to analise how much gas the methods and the whole contracts will spend while deploing. 

`npm run gas-report -w @rankanizer-contracts/contracts`

## Playground

As mentioned, this project has a React Application to test all the contracts and it's interactions locally in a friendly interface. To use it, make sure you are using Node @ version 16. `node -v`

This playground will locally deploy the contract in an instance of Ganache, perform some initial transactions and after will open the React Application in your Browser. 

Before you run the playground, you have to install [Metamask wallet](https://metamask.io/download/) on your browser. 

Then, import the correct account into Metamask using the following private key: `0x6a58b770e0c791c3d5e91401fff59047afd98a6cb1285b4146881ac53cf239a0`

Finally you are able to start the Playground:

`npm run start-playground`

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
