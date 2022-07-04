const { assert } = require('chai');
const { ethers, upgrades } = require('hardhat');
const seedrandom = require('seedrandom');

const SchulzeVoting = artifacts.require('SchulzeVoting');

contract('SchulzeVoting', function (accounts) {
  const [ owner,
    accountA, accountB, accountC, accountD, accountE, accountF, accountG] = accounts;

  const createBallot = candidates => ranked => {
    return candidates.map(c => ranked.indexOf(c));
  };

  const createElection = candidatesString => piles => {
    const ballots = [];
    const candidates = candidatesString.split('');
    const cast = createBallot(candidates);
    piles.forEach(([n, str]) => {
      for (let i = 0; i < n; i++) {
        ballots.push(cast(str.split('')));
      }
    });
    return ballots;
  };

  describe('the schulze method', () => {
    let schulze;
    const generator = seedrandom('rankanizer');

    describe('Electowiki examples', () => {
      it('Several draws, two winners', async function () {
        const election = createElection('ABCD')([
          [3, 'ABCD'],
          [2, 'DABC'],
          [2, 'DBCA'],
          [2, 'CBDA'],
        ]);

        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        let receipt = await schulze.createPoll(4, '', 100, { from: owner });
        const hash = receipt.receipt.logs[0].args.pollHash;

        for (let i = 0; i < election.length; i++) {
          await schulze.submitVote(hash, election[i], { from: accounts[i] });
        }

        receipt = await schulze.closePoll(hash, { from: owner });

        assert.equal(receipt.receipt.logs[0].args.winners[0], '3');
        assert.equal(receipt.receipt.logs[0].args.winners[1], '1');
      });

      it('should work for example 2', async function () {
        const election = createElection('ABCD')([
          [5, 'ACBD'],
          [2, 'ACDB'],
          [3, 'ADCB'],
          [4, 'BACD'],
          [3, 'CBDA'],
          [3, 'CDBA'],
          [1, 'DACB'],
          [5, 'DBAC'],
          [4, 'DCBA'],
        ]);

        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        let receipt = await schulze.createPoll(4, '', 100, { from: owner });
        const hash = receipt.receipt.logs[0].args.pollHash;

        for (let i = 0; i < election.length; i++) {
          await schulze.submitVote(hash, election[i], { from: accounts[i] });
        }

        receipt = await schulze.closePoll(hash, { from: owner });

        assert.equal(receipt.receipt.logs[0].args.winners[0], '3');
      });

      it('should work for example 3', async function () {
        const election = createElection('ABCDE')([
          [3, 'ABDEC'],
          [5, 'ADEBC'],
          [1, 'ADECB'],
          [2, 'BADEC'],
          [2, 'BDECA'],
          [4, 'CABDE'],
          [6, 'CBADE'],
          [2, 'DBECA'],
          [5, 'DECAB'],
        ]);
        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        let receipt = await schulze.createPoll(5, '', 100, { from: owner });
        const hash = receipt.receipt.logs[0].args.pollHash;

        for (let i = 0; i < election.length; i++) {
          await schulze.submitVote(hash, election[i], { from: accounts[i] });
        }

        receipt = await schulze.closePoll(hash, { from: owner });

        assert.equal(receipt.receipt.logs[0].args.winners[0], '1');
      });

      it('should work for example 1', async function () {
        const election = createElection('ABCDE')([
          [5, 'ACBED'],
          [5, 'ADECB'],
          [8, 'BEDAC'],
          [3, 'CABED'],
          [7, 'CAEBD'],
          [2, 'CBADE'],
          [7, 'DCEBA'],
          [8, 'EBADC'],
        ]);

        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        let receipt = await schulze.createPoll(5, '', 100, { from: owner });
        const hash = receipt.receipt.logs[0].args.pollHash;

        for (let i = 0; i < election.length; i++) {
          await schulze.submitVote(hash, election[i], { from: accounts[i] });
        }

        receipt = await schulze.closePoll(hash, { from: owner });

        assert.equal(receipt.receipt.logs[0].args.winners[0], '4');
      });

      it('Condorcet Winner', async function () {
        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        const receipt = await schulze.createPoll(3, '', 7, { from: owner });
        const hash = receipt.receipt.logs[0].args.pollHash;

        await schulze.submitVote(hash, [0, 1, 2], { from: accountA });
        await schulze.submitVote(hash, [2, 0, 1], { from: accountB });
        await schulze.submitVote(hash, [1, 0, 2], { from: accountC });
        await schulze.submitVote(hash, [2, 0, 1], { from: accountD });
        await schulze.submitVote(hash, [1, 0, 2], { from: accountE });
        await schulze.submitVote(hash, [1, 2, 0], { from: accountF });
        await schulze.submitVote(hash, [2, 0, 1], { from: accountG });
        await schulze.closePoll(hash, { from: owner });

        const winners = await schulze.winners(hash, { from: owner });
        assert.equal(winners.length, '1');
        assert.equal(winners[0], '1');
      });

      it('Simultaneous polls', async function () {
        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        let receipt = await schulze.createPoll(3, '', 20, { from: owner });
        const hash = receipt.receipt.logs[0].args.pollHash;
        receipt = await schulze.createPoll(3, '', 20, { from: accountA });
        const hash2 = receipt.receipt.logs[0].args.pollHash;

        await schulze.submitVote(hash, [0, 1, 2], { from: accountA });
        await schulze.submitVote(hash2, [0, 1, 2], { from: accountA });
        await schulze.submitVote(hash, [2, 0, 1], { from: accountB });
        await schulze.submitVote(hash2, [0, 1, 2], { from: accountB });
        await schulze.submitVote(hash, [1, 0, 2], { from: accountC });
        await schulze.submitVote(hash2, [0, 1, 2], { from: accountC });
        await schulze.submitVote(hash, [2, 0, 1], { from: accountD });
        await schulze.submitVote(hash2, [0, 1, 2], { from: accountD });
        await schulze.submitVote(hash, [1, 0, 2], { from: accountE });
        await schulze.submitVote(hash2, [0, 1, 2], { from: accountE });
        await schulze.submitVote(hash, [1, 2, 0], { from: accountF });
        await schulze.submitVote(hash2, [0, 1, 2], { from: accountF });
        await schulze.submitVote(hash, [2, 0, 1], { from: accountG });
        await schulze.submitVote(hash2, [0, 1, 2], { from: accountG });
        receipt = await schulze.closePoll(hash, { from: owner });

        let winners = await schulze.winners(hash, { from: owner });
        assert.equal(winners.length, '1');
        assert.equal(winners[0], '1');

        await schulze.closePoll(hash2, { from: accountA });
        winners = await schulze.winners(hash2, { from: owner });
        assert.equal(winners.length, '1');
        assert.equal(winners[0], '0');
      });

      it('one vote per account', async function () {
        const votes = accounts.length;
        const candidates = 5;

        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        const receipt = await schulze.createPoll(candidates, '', votes + 1, { from: owner });
        const hash = receipt.receipt.logs[0].args.pollHash;

        for (let i = 0; i < votes; i++) {
          const ranking = [];
          for (let j = 0; j < candidates; j++) {
            ranking[j] = Math.floor(generator() * candidates);
          }
          const voter = i;
          await schulze.submitVote(hash, ranking, { from: accounts[voter] });
        }

        await schulze.closePoll(hash, { from: owner });
      });

      it('lots of votes', async function () {
        const votes = Math.floor(generator() * 100) + 100;
        const candidates = 5;

        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        const receipt = await schulze.createPoll(candidates, '', votes + 1, { from: owner });
        const hash = receipt.receipt.logs[0].args.pollHash;

        for (let i = 0; i < votes; i++) {
          const ranking = [];
          for (let j = 0; j < candidates; j++) {
            ranking[j] = Math.floor(generator() * candidates);
          }
          const voter = Math.floor(generator() * accounts.length);
          const voted = await schulze.didVote(hash, accounts[voter]);
          if (voted) {
            await schulze.changeVote(hash, ranking, { from: accounts[voter] });
          } else {
            await schulze.submitVote(hash, ranking, { from: accounts[voter] });
          }
        }

        await schulze.closePoll(hash, { from: owner });
      });
    });

    describe('Deployment tests', () => {
      let election;
      let accounts;
      let owner;
      let schulze;

      beforeEach(async () => {
        election = createElection('ABCD')([
          [5, 'ACBD'],
          [2, 'ACDB'],
          [3, 'ADCB'],
          [4, 'BACD'],
          [3, 'CBDA'],
          [3, 'CDBA'],
          [1, 'DACB'],
          [5, 'DBAC'],
          [4, 'DCBA'],
        ]);
        accounts = await ethers.getSigners();
        [owner] = accounts;

        const SchulzeVoting = await ethers.getContractFactory('SchulzeVoting');
        schulze = await upgrades.deployProxy(SchulzeVoting);
        await schulze.deployed();
      });

      it('deploys upgradable contract', async function () {
        let transaction = await schulze.connect(owner).createPoll(4, '', 100);
        let receipt = await transaction.wait();

        const hash = receipt.logs[0].topics[1];

        for (let i = 0; i < election.length; i++) {
          await schulze.connect(accounts[i]).submitVote(hash, election[i]);
        }

        transaction = await schulze.connect(owner).closePoll(hash);
        receipt = await transaction.wait();

        expect(receipt.status).to.be.eq(1);
      });

      it('works before and after upgrading', async function () {
        const SchulzeVotingV2 = await ethers.getContractFactory('SchulzeVotingDummy');
        const schulzeV2 = await upgrades.upgradeProxy(schulze.address, SchulzeVotingV2);
        await schulzeV2.deployed();

        const transaction = await schulzeV2.dummy();
        const bigNumber = parseInt(transaction._hex);

        expect(bigNumber).to.be.eq(0xdeadbeef);
      });
    });
  });
});
