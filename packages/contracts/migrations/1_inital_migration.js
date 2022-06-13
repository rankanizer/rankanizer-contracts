/* eslint-disable no-undef */
const Ballot = artifacts.require('Ballot');

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Ballot, { from: accounts[0] });
  const ballot = await Ballot.deployed();
  await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 6, { from: accounts[0] });
};
