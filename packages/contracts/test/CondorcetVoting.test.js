const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');

const CondorcetVoting = artifacts.require('CondorcetVoting');

contract('CondorcetVoting', function (accounts) {
  const [ owner,
    accountA, accountB, accountC, accountD, accountE, accountF, accountG] = accounts;

  describe('constructorCondorcetVoting', function () {
    let ballot;

    before(async () => {
    });

    it('initializer', async function () {
      const ballot1 = await CondorcetVoting.new();
      await ballot1.initialize({ from: owner });
      await expectRevert(ballot1.createPoll(0, '', 5),
        'The list of candidates should have at least two elements');
      const ballot2 = await CondorcetVoting.new();
      await ballot2.initialize({ from: owner });
      await expectRevert(ballot2.createPoll(1, '', 5),
        'The list of candidates should have at least two elements');
      const ballot3 = await CondorcetVoting.new();
      await ballot3.initialize({ from: owner });
      await expectRevert(ballot3.createPoll(2, '', 0, { from: owner }),
        'The duration of the poll must be greater than zero');
      const ballot4 = await CondorcetVoting.new();
      await ballot4.initialize({ from: owner });
      await ballot4.createPoll(3, '', 5);
      const hash = await ballot4.getLastPollHash();
      const expire = (new BN(5)).add(await time.latestBlock());
      expect(await ballot4.expire(hash)).to.be.bignumber.equal(new BN(expire));
    });

    // Vote Tests
    it('vote in less candidates', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await expectRevert(ballot.vote(hash, [2, 1], { from: accountA }), 'Voting must be casted for all candidates.');
    });

    it('vote in more candidates', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await expectRevert(
        ballot.vote(hash, [2, 1, 0, 0], { from: accountA }), 'Voting must be casted for all candidates.');
    });

    it('votes of nonexistent candidate', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await expectRevert(ballot.votesOf(hash, 100), 'Candidate doesn\'t exist.');
    });

    it('vote in nonexistent candidate', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await expectRevert(ballot.vote(hash, [100, 1, 0], { from: accountA }), 'Candidate doesn\'t exist.');
    });

    it('vote again', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();
      await ballot.vote(hash, [2, 0, 1]);
      await ballot.vote(hash, [1, 2, 0]);

      const receipt = await ballot.closePoll(hash, { from: owner });
      assert.equal(receipt.receipt.logs[0].args.winners[0], '2');
    });

    it('no votes', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      const receipt = await ballot.closePoll(hash, { from: owner });

      assert.equal(receipt.receipt.logs[0].args.winners.length, 0);
    });

    it('vote after closed', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 6);
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0, 1, 2], { from: accountA });
      await ballot.vote(hash, [1, 2, 0], { from: accountB });
      await ballot.vote(hash, [1, 0, 2], { from: accountC });
      await ballot.vote(hash, [2, 0, 1], { from: accountD });
      await ballot.vote(hash, [2, 1, 0], { from: accountE });

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      await expectRevert(
        ballot.vote(hash, [1, 0, 2], { from: accountF }), 'This poll is closed. No more votes allowed');
    });

    // // Winner tests
    it('winners poll not closed', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();
      await expectRevert(ballot.winners(hash, { from: owner }), 'This poll is not closed yet.');
    });

    it('one winner normal close', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 7, { from: owner });
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0, 1, 2], { from: accountA });
      await ballot.vote(hash, [2, 0, 1], { from: accountB });
      await ballot.vote(hash, [1, 0, 2], { from: accountC });
      await ballot.vote(hash, [2, 0, 1], { from: accountD });
      await ballot.vote(hash, [1, 0, 2], { from: accountE });
      await ballot.vote(hash, [1, 2, 0], { from: accountF });

      expectEvent(await ballot.vote(hash, [2, 0, 1], { from: accountG }), 'PollClosed');
      expect(await ballot.finished(hash)).to.be.equal(true);
      const winners = await ballot.winners(hash, { from: owner });
      assert.equal(winners.length, '1');
      assert.equal(winners[0], '1');
    });

    it('one winner forced close', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0, 1, 2], { from: accountA });
      await ballot.vote(hash, [2, 0, 1], { from: accountB });
      await ballot.vote(hash, [1, 0, 2], { from: accountC });
      await ballot.vote(hash, [1, 0, 2], { from: accountD });

      const receipt = await ballot.closePoll(hash, { from: owner });
      assert.equal(receipt.receipt.logs[0].args.winners.length, '1');
      assert.equal(receipt.receipt.logs[0].args.winners[0], '1');
    });

    it('already closed', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0, 1, 2], { from: accountA });
      await ballot.vote(hash, [1, 2, 0], { from: accountB });
      await ballot.vote(hash, [1, 0, 2], { from: accountC });
      await ballot.vote(hash, [2, 0, 1], { from: accountD });
      await ballot.vote(hash, [2, 1, 0], { from: accountE });

      await expectRevert(ballot.closePoll(hash, { from: owner }), 'This poll is closed already');
    });

    it('more than one winner normal close', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 6, { from: owner });
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0, 1, 2], { from: accountA });
      await ballot.vote(hash, [0, 2, 1], { from: accountB });
      await ballot.vote(hash, [1, 2, 0], { from: accountC });
      await ballot.vote(hash, [1, 0, 2], { from: accountD });
      await ballot.vote(hash, [2, 0, 1], { from: accountE });

      expectEvent(await ballot.vote(hash, [2, 1, 0], { from: accountF }), 'PollClosed');

      const winners = await ballot.winners(hash, { from: owner });

      assert.equal(winners.length, '0');
    });
  });
});
