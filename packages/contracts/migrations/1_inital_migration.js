/* eslint-disable no-undef */
const Ballot = artifacts.require('Ballot');

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Ballot, { from: accounts[0] });
  const ballot = await Ballot.deployed();
  await ballot.initialize({ from: accounts[0] });
  await ballot.createPoll(3, 'https://www.rankanizer.com/home', 6, { from: accounts[2] });
  await ballot.createPoll(8, 'https://www.jurimetric.com.br/rankanizer.html', 10, { from: accounts[2] });
  await ballot.createPoll(5, 'https://www.jurimetric.com.br/about.html', 12, { from: accounts[1] });
};
