const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');

const Ballot = artifacts.require('Ballot');

contract('Ballot', function (accounts) {
  const [ owner,
    accountA, accountB, accountC, accountD, accountE,
    accountF, accountG, accountH, accountI, accountJ ] = accounts;

  describe('constructorBallot', function () {
    let ballot;

    it('initializer', async function () {
      const ballot1 = await Ballot.new();
      await expectRevert(ballot1.initialize([], 5, { from: owner }),
        'The list of candidates should have at least two elements');
      const ballot2 = await Ballot.new();
      await expectRevert(ballot2.initialize(['A'], 5, { from: owner }),
        'The list of candidates should have at least two elements');
      const ballot3 = await Ballot.new();
      await expectRevert(ballot3.initialize(['A', 'B'], 0, { from: owner }),
        'The duration of the poll must be greater than zero');

      const ballot4 = await Ballot.new();
      await ballot4.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      const candidates = await ballot4.candidatesList();
      assert.equal(candidates.length, 3);
      const expire = (new BN(5)).add(await time.latestBlock());
      expect(await ballot4.expire()).to.be.bignumber.equal(new BN(expire));
    });

    // Vote Tests
    it('vote', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await ballot.vote([1]);
      expect(await ballot.votesOf(1)).to.be.bignumber.equal('1');
      const votes = await await ballot.votes();
      expect(votes[1]).to.be.bignumber.equal('1');
    });

    it('votes of nonexistent candidate', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await expectRevert(ballot.votesOf(100), 'Candidate doesn\'t exist.');
    });

    it('vote in nonexistent candidate', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await expectRevert(ballot.vote([100], { from: accountA }), 'Candidate doesn\'t exist.');
    });

    it('vote again', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await ballot.vote([1]);
      await ballot.vote([0]);
      expect(await ballot.votesOf(1)).to.be.bignumber.equal('0');
      expect(await ballot.votesOf(0)).to.be.bignumber.equal('1');
    });

    it('vote in more than one candidate', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await expectRevert(ballot.vote([0, 1], { from: accountA }), 'Voting must be for only one candidate.');
    });

    it('no votes', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      const receipt = await ballot.closePoll();

      assert.equal(receipt.receipt.logs[0].args.winners.length, 0);
    });

    it('vote after closed', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 6, { from: owner });

      await ballot.vote([0], { from: accountA });
      await ballot.vote([1], { from: accountB });
      await ballot.vote([1], { from: accountC });
      await ballot.vote([2], { from: accountD });
      await ballot.vote([2], { from: accountE });

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      await expectRevert(ballot.vote([1], { from: accountF }), 'This poll is closed. No more votes allowed');
      expect(await ballot.votesOf(1)).to.be.bignumber.equal('2');
    });

    it('votes in order odd sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 6, { from: owner });

      await ballot.vote([0], { from: accountA });
      await ballot.vote([1], { from: accountB });
      await ballot.vote([1], { from: accountC });
      await ballot.vote([2], { from: accountD });
      await ballot.vote([2], { from: accountE });
      await ballot.vote([2], { from: accountF });
    });

    it('votes in order even sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb', 'Hastur'], 10, { from: owner });

      await ballot.vote([0], { from: accountA });
      await ballot.vote([1], { from: accountB });
      await ballot.vote([1], { from: accountC });
      await ballot.vote([2], { from: accountD });
      await ballot.vote([2], { from: accountE });
      await ballot.vote([2], { from: accountF });
      await ballot.vote([3], { from: accountG });
      await ballot.vote([3], { from: accountH });
      await ballot.vote([3], { from: accountI });
      await ballot.vote([3], { from: accountJ });
    });

    it('votes in reverse order odd sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 6, { from: owner });

      await ballot.vote([2], { from: accountA });
      await ballot.vote([2], { from: accountB });
      await ballot.vote([2], { from: accountC });
      await ballot.vote([1], { from: accountD });
      await ballot.vote([1], { from: accountE });
      await ballot.vote([0], { from: accountF });
    });

    it('votes in reverse order even sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb', 'Hastur'], 10, { from: owner });

      await ballot.vote([3], { from: accountA });
      await ballot.vote([3], { from: accountB });
      await ballot.vote([3], { from: accountC });
      await ballot.vote([3], { from: accountD });
      await ballot.vote([2], { from: accountE });
      await ballot.vote([2], { from: accountF });
      await ballot.vote([2], { from: accountG });
      await ballot.vote([1], { from: accountH });
      await ballot.vote([1], { from: accountI });
      await ballot.vote([0], { from: accountJ });
    });

    // Winner tests
    it('winners poll not closed', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });
      await expectRevert(ballot.winners(), 'This poll is not closed yet.');
    });

    it('one winner normal close', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote([0], { from: accountA });
      await ballot.vote([1], { from: accountB });
      await ballot.vote([2], { from: accountC });
      await ballot.vote([2], { from: accountD });

      expectEvent(await ballot.vote([2], { from: accountE }), 'PollClosed');
      expect(await ballot.finished()).to.be.equal(true);
      const winners = await ballot.winners();
      assert.equal(winners[0].candidates[0], '2');
    });

    it('one winner forced close', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote([0], { from: accountA });
      await ballot.vote([1], { from: accountB });
      await ballot.vote([2], { from: accountC });
      await ballot.vote([2], { from: accountD });

      const receipt = await ballot.closePoll();
      assert.equal(receipt.receipt.logs[0].args.winners[0].candidates[0], '2');
      // expectEvent(receipt, 'PollClosed', { winners: [new BN(2), new BN(1) ] });
    });

    it('already closed', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote([0], { from: accountA });
      await ballot.vote([1], { from: accountB });
      await ballot.vote([2], { from: accountC });
      await ballot.vote([2], { from: accountD });
      await ballot.vote([2], { from: accountE });

      await expectRevert(ballot.closePoll(), 'This poll is closed already');
    });

    it('two winners normal close', async function () {
      ballot = await Ballot.new();
      await ballot.initialize(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote([1], { from: accountA });
      await ballot.vote([1], { from: accountB });
      await ballot.vote([2], { from: accountC });
      await ballot.vote([2], { from: accountD });

      expectEvent(await ballot.vote([0], { from: accountE }), 'PollClosed');

      const winners = await ballot.winners();

      assert.equal(winners[0].candidates[0], '2');
      assert.equal(winners[0].candidates[1], '1');
    });
  });
});
