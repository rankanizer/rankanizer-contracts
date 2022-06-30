const { expectEvent } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const { ethers, upgrades } = require("hardhat");

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
          await schulze.vote(hash, election[i], { from: accounts[i] });
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
          await schulze.vote(hash, election[i], { from: accounts[i] });
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
          await schulze.vote(hash, election[i], { from: accounts[i] });
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
          await schulze.vote(hash, election[i], { from: accounts[i] });
        }

        receipt = await schulze.closePoll(hash, { from: owner });

        assert.equal(receipt.receipt.logs[0].args.winners[0], '4');
      });

      it('Condorcet Winner', async function () {
        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        const receipt = await schulze.createPoll(3, '', 7, { from: owner });
        const hash = receipt.receipt.logs[0].args.pollHash;

        await schulze.vote(hash, [0, 1, 2], { from: accountA });
        await schulze.vote(hash, [2, 0, 1], { from: accountB });
        await schulze.vote(hash, [1, 0, 2], { from: accountC });
        await schulze.vote(hash, [2, 0, 1], { from: accountD });
        await schulze.vote(hash, [1, 0, 2], { from: accountE });
        await schulze.vote(hash, [1, 2, 0], { from: accountF });

        expectEvent(await schulze.vote(hash, [2, 0, 1], { from: accountG }), 'PollClosed');
        const winners = await schulze.winners(hash, { from: owner });
        assert.equal(winners.length, '1');
        assert.equal(winners[0], '1');
      });
    });

    describe('Deployment tests', () => { 
      it('works before and after upgrading', async function () {
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
        const accounts = await ethers.getSigners();
        const [owner, addr1] = accounts

        const SchulzeVoting = await ethers.getContractFactory("SchulzeVoting");
        const schulze = await upgrades.deployProxy(SchulzeVoting);
        await schulze.deployed();
      
        let transaction = await schulze.connect(owner).createPoll(4, '', 100);
        let receipt = await transaction.wait()

        const hash = receipt.logs[0].topics[1];

        for (let i = 0; i < election.length; i++) {
          await schulze.connect(accounts[i]).vote(hash, election[i]);
        }

        transaction = await schulze.connect(owner).closePoll(hash);
        receipt = await transaction.wait()

        expect(receipt.status).to.be.eq(1)
      });
    });
  });
});
