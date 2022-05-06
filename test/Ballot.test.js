const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');

const LOG_MODE = false;
const Ballot = artifacts.require('Ballot');

contract('Ballot', function (accounts) {
  const [ owner, accountA, accountB, accountC, accountD, accountE, accountF ] = accounts;

  describe('constructorBallot', function () {
    let ballot;

    before(async () => {
    });

    it('constructor', async function () {
      ballot = Ballot.new([], 5, { from: owner });
      await expectRevert(ballot, 'The list of candidates should have at least two elements');
      ballot = Ballot.new(['A'], 5, { from: owner });
      await expectRevert(ballot, 'The list of candidates should have at least two elements');
      ballot = Ballot.new(['A', 'B'], 0, { from: owner });
      await expectRevert(ballot, 'The duration of the poll must be greater than zero');

      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      const expire = await time.latestBlock() + 5;
      expect(await ballot.expire()).to.be.equal(new BN(expire));
    });

    // Vote Tests
    it('vote', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await ballot.vote(1);
      expect(await ballot.votesOf(1)).to.be.bignumber.equal('1');
      const votes = await await ballot.votes();
      expect(votes[1]).to.be.bignumber.equal('1');
    });

    it('votes_of_no_candidate', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await expectRevert(ballot.votesOf(100), 'Candidate doesn\'t exist.');
    });

    it('vote_no_candidate', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await expectRevert(ballot.vote(100, { from: accountA }), 'Candidate doesn\'t exist.');
    });

    it('vote_again', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await ballot.vote(1);
      await ballot.vote(0);
      expect(await ballot.votesOf(1)).to.be.bignumber.equal('0');
      expect(await ballot.votesOf(0)).to.be.bignumber.equal('1');
    });

    it('lots_of_votes', async function () {
      const votes = Math.floor(Math.random() * 300) + 100;
      ballot = await Ballot.new(['A', 'B', 'C', 'D', 'F'], votes, { from: owner });

      for (let i = 0; i < votes; i++) {
        const vote = Math.floor(Math.random() * 5);
        const voter = Math.floor(Math.random() * accounts.length);
        await ballot.vote(vote, { from: accounts[voter] });
      }

      if (LOG_MODE) {
        console.log(await ballot.votesOf(0));
        console.log(await ballot.votesOf(1));
        console.log(await ballot.votesOf(2));
        console.log(await ballot.votesOf(3));
        console.log(await ballot.votesOf(4));
        console.log(await ballot.winners());
      }
    });

    it('no_votes', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      if (LOG_MODE) {
        console.log(await ballot.votes());
        console.log('===');
        console.log(await ballot.winners());
        console.log('===');
      }

      const receipt = await ballot.closePoll();

      assert.equal(receipt.receipt.logs[0].args.winners.length, 3);

      if (LOG_MODE) {
        console.log(await ballot.votes());
        console.log('===');
        console.log(await ballot.winners());
        console.log(receipt.receipt.logs[0].args.winners);
      }
    });

    it('vote_after_closed', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 6, { from: owner });

      await ballot.vote(0, { from: accountA });
      await ballot.vote(1, { from: accountB });
      await ballot.vote(1, { from: accountC });
      await ballot.vote(2, { from: accountD });
      await ballot.vote(2, { from: accountE });

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      await expectRevert(ballot.vote(1, { from: accountF }), 'This poll is closed. No more votes allowed');
      expect(await ballot.votesOf(1)).to.be.bignumber.equal('2');
    });

    // Winner tests
    it('winners_poll_not_closed', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await expectRevert(ballot.winners(), 'This poll is not closed yet.');
    });

    it('one_winner_normal_close', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote(0, { from: accountA });
      await ballot.vote(1, { from: accountB });
      await ballot.vote(2, { from: accountC });
      await ballot.vote(2, { from: accountD });

      expectEvent(await ballot.vote(2, { from: accountE }), 'PollClosed');
      expect(await ballot.finished()).to.be.equal(true);
      assert.equal(await ballot.winners(), '2');
    });

    it('one_winner_forced_close', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote(0, { from: accountA });
      await ballot.vote(1, { from: accountB });
      await ballot.vote(2, { from: accountC });
      await ballot.vote(2, { from: accountD });

      const receipt = await ballot.closePoll();
      assert.equal(receipt.receipt.logs[0].args.winners[0], '2');
      // expectEvent(receipt, 'PollClosed', { winners: [new BN(2), new BN(1) ] });
    });

    it('already_closed', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote(0, { from: accountA });
      await ballot.vote(1, { from: accountB });
      await ballot.vote(2, { from: accountC });
      await ballot.vote(2, { from: accountD });
      await ballot.vote(2, { from: accountE });

      await expectRevert(ballot.closePoll(), 'This poll is closed already');
    });

    it('two_winners_normal_close', async function () {
      ballot = await Ballot.new(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote(1, { from: accountA });
      await ballot.vote(1, { from: accountB });
      await ballot.vote(2, { from: accountC });
      await ballot.vote(2, { from: accountD });

      expectEvent(await ballot.vote(0, { from: accountE }), 'PollClosed');

      if (LOG_MODE) {
        console.log(await ballot.votesOf(0));
        console.log(await ballot.votesOf(1));
        console.log(await ballot.votesOf(2));
        console.log('===');
      }

      const winners = await ballot.winners();
      await winners.sort();

      if (LOG_MODE) {
        console.log(winners);
      }

      assert.equal(winners[0], '1');
      assert.equal(winners[1], '2');
    });
  });
});
