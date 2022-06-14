const { expectEvent } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');

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
    const id = 0;

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
        await schulze.createPoll(['A', 'B', 'C', 'D'], 100, { from: owner });

        for (let i = 0; i < election.length; i++) {
          await schulze.vote(id, election[i], { from: accounts[i] });
        }

        const receipt = await schulze.closePoll(id, { from: owner });

        // assert.equal(receipt.receipt.logs[0].args.winners[0].candidates[0], '3');
        // assert.equal(receipt.receipt.logs[0].args.winners[0].candidates[1], '1');
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
        await schulze.createPoll(['A', 'B', 'C', 'D'], 100, { from: owner });

        for (let i = 0; i < election.length; i++) {
          await schulze.vote(id, election[i], { from: accounts[i] });
        }

        const receipt = await schulze.closePoll(id, { from: owner });

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
        await schulze.createPoll(['A', 'B', 'C', 'D', 'E'], 100, { from: owner });

        for (let i = 0; i < election.length; i++) {
          await schulze.vote(id, election[i], { from: accounts[i] });
        }

        const receipt = await schulze.closePoll(id, { from: owner });

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
        await schulze.createPoll(['A', 'B', 'C', 'D', 'E'], 100, { from: owner });

        for (let i = 0; i < election.length; i++) {
          await schulze.vote(id, election[i], { from: accounts[i] });
        }

        const receipt = await schulze.closePoll(id, { from: owner });

        assert.equal(receipt.receipt.logs[0].args.winners[0], '4');
      });

      it('Condorcet Winner', async function () {
        schulze = await SchulzeVoting.new();
        await schulze.initialize({ from: owner });
        await schulze.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 7, { from: owner });

        await schulze.vote(id, [0, 1, 2], { from: accountA });
        await schulze.vote(id, [2, 0, 1], { from: accountB });
        await schulze.vote(id, [1, 0, 2], { from: accountC });
        await schulze.vote(id, [2, 0, 1], { from: accountD });
        await schulze.vote(id, [1, 0, 2], { from: accountE });
        await schulze.vote(id, [1, 2, 0], { from: accountF });

        expectEvent(await schulze.vote(id, [2, 0, 1], { from: accountG }), 'PollClosed');
        const winners = await schulze.winners(id, { from: owner });
        assert.equal(winners.length, '1');
        // assert.equal(winners[0].candidates.length, '1');
        // assert.equal(winners[0].candidates[0], '1');
        assert.equal(winners[0], '1');
      });
    });
  });
});
