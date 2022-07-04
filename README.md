# Rankanizer

Rankanizer is a ranking-based voting system! Imagine that you and your friends want to go to the cinema and you are split between 5 movies. You create the poll in the app and share it with them! Rankanizer will calculate which movie makes the most people happy and the least people unhappy.

## Getting started

1. Clone repo into your local machine
2. Inside project’s main folder: `npm install`
3. `npm run test -w @rankanizer-contracts/contracts`
Every test must pass

## Lint

    `npm run lint --workspace @rankanizer-contracts/contracts`

To automatically fix trivial lint issues

    `npm run lint:fix --workspace @rankanizer-contracts/contracts`


## Deploy
### In your local machine using Ganache

In any folder run `npm install -g ganache-cli`

`npx ganache-cli -m 'true hunt echo pink drama come work kiwi essay erupt joke stomach' --secure` Do not use this mneminic in Main Network

**Keep it running** and in another terminal session:

Inside project's main folder: `cd packages/contracts`

`npm run deploy --network ganache`
