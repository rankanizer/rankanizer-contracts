/* eslint-disable no-undef */
const Ballot = artifacts.require('Ballot');

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Ballot, { from: accounts[0] });
  const ballot = await Ballot.deployed();
  await ballot.initialize({ from: accounts[0] });
  await ballot.createPoll(3, '', 6);
};
