/* eslint-disable no-undef */
const Ballot = artifacts.require('SingleVoting');

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Ballot, { from: accounts[0] });
  const ballot = await Ballot.deployed();

  await ballot.initialize({ from: accounts[0] });

  await ballot.createPoll(3, 'https://www.rankanizer.com/home', 30, { from: accounts[2] });
  await ballot.createPoll(8, 'https://www.jurimetric.com.br/rankanizer.html', 15, { from: accounts[2] });

  const receipt = await ballot.createPoll(5, 'https://www.jurimetric.com.br/about.html', 5, { from: accounts[1] });
  const hash = receipt.receipt.logs[0].args.pollHash;
  await ballot.submitVote(hash, [0], { from: accounts[0] });
  await ballot.submitVote(hash, [1], { from: accounts[1] });
  await ballot.submitVote(hash, [1], { from: accounts[2] });
  await ballot.submitVote(hash, [2], { from: accounts[3] });
  await ballot.submitVote(hash, [2], { from: accounts[4] });
  await ballot.closePoll(hash, { from: accounts[1] });
};
