/* eslint-disable no-undef */
const Ballot = artifacts.require('Ballot')

module.exports = async function(deployer, network, accounts) {
  
  // Deploy Mock Tether Token
  await deployer.deploy(Ballot)
  const ballot = await Ballot.deployed()

}
