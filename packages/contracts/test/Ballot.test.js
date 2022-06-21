const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');

const Ballot = artifacts.require('Ballot');

contract('Ballot', function (accounts) {
  const [ owner,
    accountA, accountB, accountC, accountD, accountE,
    accountF, accountG, accountH, accountI, accountJ ] = accounts;

  describe('constructorBallot', function () {
    let ballot;

    it('poll creation', async function () {
      const ballot1 = await Ballot.new();
      await ballot1.initialize({ from: owner });
      await expectRevert(ballot1.createPoll(0, '', 5, { from: owner }),
        'The list of candidates should have at least two elements');
      const ballot2 = await Ballot.new();
      await ballot2.initialize({ from: owner });
      await expectRevert(ballot2.createPoll(1, '', 5, { from: owner }),
        'The list of candidates should have at least two elements');
      const ballot3 = await Ballot.new();
      await ballot3.initialize({ from: owner });
      await expectRevert(ballot3.createPoll(2, '', 0, { from: owner }),
        'The duration of the poll must be greater than zero');

      const ballot4 = await Ballot.new();
      await ballot4.initialize({ from: owner });
      await ballot4.createPoll(3, '', 5, { from: owner });
      const hash = await ballot4.getLastPollHash();

      const expire = (new BN(5)).add(await time.latestBlock());
      expect(await ballot4.expire(hash)).to.be.bignumber.equal(new BN(expire));
    });

    // Creator Only Tests
    it('creator only methods', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();
      await expectRevert(
        ballot.votes(hash, { from: accountA }), 'This method should be called only by the poll\'s creator.');
      await expectRevert(
        ballot.votesOf(hash, 0, { from: accountA }), 'This method should be called only by the poll\'s creator.');
      await expectRevert(
        ballot.closePoll(hash, { from: accountA }), 'This method should be called only by the poll\'s creator.');
      await expectRevert(
        ballot.addVoter(
          hash,
          accountB,
          { from: accountA }), 'This method should be called only by the poll\'s creator.');
    });

    // Creator or voter tests
    it('creator or voter methods', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();
      await ballot.vote(hash, [1], { from: accountA });
      ballot.voteOf(hash, accountA, { from: accountA });
      ballot.voteOf(hash, accountA, { from: owner });
      await expectRevert(
        ballot.voteOf(hash, accountA, { from: accountB }), 'Only the creator or the voter may call this method.');
    });

    // Poll must exist tests
    it('poll must exist', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      let hash = await ballot.getLastPollHash();
      hash = '0xc7d192c913a3e8099bc01a2520830ac822853710d241c1b13a1e68534e9676ed';
      await expectRevert(ballot.vote(hash, [1]), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.closePoll(hash), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.votesOf(hash, 0), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.voteOf(hash, accountA), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.didVote(hash, accountA), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.votes(hash), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.winners(hash), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.expire(hash), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.finished(hash), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(
        ballot.addVoter(hash, accountA, { from: owner }), 'Invalid poll id. This poll doesn\'t exist.');
    });

    // Vote Tests
    it('vote', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await ballot.vote(hash, [1]);
      expect(await ballot.votesOf(hash, 1)).to.be.bignumber.equal('1');
      const votes = await await ballot.votes(hash);
      expect(votes[1]).to.be.bignumber.equal('1');
    });

    it('votes of nonexistent candidate', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await expectRevert(ballot.votesOf(hash, 100), 'Candidate doesn\'t exist.');
    });

    it('vote in nonexistent candidate', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await expectRevert(ballot.vote(hash, [100], { from: accountA }), 'Candidate doesn\'t exist.');
    });

    it('vote of nonexistent voter', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();
      await expectRevert(ballot.voteOf(hash, accountA, { from: owner }), 'Voter must exist.');
    });

    it('get vote from user that didn\'t vote', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();
      await ballot.addVoter(hash, accountA, { from: owner });
      await expectRevert(ballot.voteOf(hash, accountA, { from: owner }), 'Voter did not vote.');
    });

    it('vote again', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await ballot.vote(hash, [1]);
      await ballot.vote(hash, [0]);
      expect(await ballot.votesOf(hash, 1)).to.be.bignumber.equal('0');
      expect(await ballot.votesOf(hash, 0)).to.be.bignumber.equal('1');
    });

    it('vote in more than one candidate', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await expectRevert(ballot.vote(hash, [0, 1], { from: accountA }), 'Voting must be for only one candidate.');
    });

    it('no votes', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      const r = await ballot.createPoll(3, '', 5);
      console.log(r);
      const hash = await ballot.getLastPollHash();

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      const receipt = await ballot.closePoll(hash);
      assert.equal(receipt.receipt.logs[0].args.winners.length, 0);
    });

    it('votes and voted', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 6);
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0], { from: accountA });
      const votes = await ballot.voteOf(hash, accountA);
      assert.equal(votes[0], '0');
      // eslint-disable-next-line no-unused-expressions
      expect(await ballot.didVote(hash, accountA)).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(await ballot.didVote(hash, accountB)).to.be.false;
    });

    it('vote after closed', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 6);
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0], { from: accountA });
      await ballot.vote(hash, [1], { from: accountB });
      await ballot.vote(hash, [1], { from: accountC });
      await ballot.vote(hash, [2], { from: accountD });
      await ballot.vote(hash, [2], { from: accountE });

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      await expectRevert(ballot.vote(hash, [1], { from: accountF }), 'This poll is closed. No more votes allowed');
      expect(await ballot.votesOf(hash, 1)).to.be.bignumber.equal('2');
    });

    it('votes in order odd sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 6);
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0], { from: accountA });
      await ballot.vote(hash, [1], { from: accountB });
      await ballot.vote(hash, [1], { from: accountC });
      await ballot.vote(hash, [2], { from: accountD });
      await ballot.vote(hash, [2], { from: accountE });
      await ballot.vote(hash, [2], { from: accountF });
    });

    it('votes in order even sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(4, '', 10);
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0], { from: accountA });
      await ballot.vote(hash, [1], { from: accountB });
      await ballot.vote(hash, [1], { from: accountC });
      await ballot.vote(hash, [2], { from: accountD });
      await ballot.vote(hash, [2], { from: accountE });
      await ballot.vote(hash, [2], { from: accountF });
      await ballot.vote(hash, [3], { from: accountG });
      await ballot.vote(hash, [3], { from: accountH });
      await ballot.vote(hash, [3], { from: accountI });
      await ballot.vote(hash, [3], { from: accountJ });
    });

    it('votes in reverse order odd sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 6, { from: owner });
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [2], { from: accountA });
      await ballot.vote(hash, [2], { from: accountB });
      await ballot.vote(hash, [2], { from: accountC });
      await ballot.vote(hash, [1], { from: accountD });
      await ballot.vote(hash, [1], { from: accountE });
      await ballot.vote(hash, [0], { from: accountF });
    });

    it('votes in reverse order even sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(4, '', 10);
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [3], { from: accountA });
      await ballot.vote(hash, [3], { from: accountB });
      await ballot.vote(hash, [3], { from: accountC });
      await ballot.vote(hash, [3], { from: accountD });
      await ballot.vote(hash, [2], { from: accountE });
      await ballot.vote(hash, [2], { from: accountF });
      await ballot.vote(hash, [2], { from: accountG });
      await ballot.vote(hash, [1], { from: accountH });
      await ballot.vote(hash, [1], { from: accountI });
      await ballot.vote(hash, [0], { from: accountJ });
    });

    // Winner tests
    it('winners poll not closed', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();
      await expectRevert(ballot.winners(hash), 'This poll is not closed yet.');
    });

    it('one winner normal close', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0], { from: accountA });
      await ballot.vote(hash, [1], { from: accountB });
      await ballot.vote(hash, [2], { from: accountC });
      await ballot.vote(hash, [2], { from: accountD });

      expectEvent(await ballot.vote(hash, [2], { from: accountE }), 'PollClosed');
      expect(await ballot.finished(hash)).to.be.equal(true);
      const winners = await ballot.winners(hash);
      // assert.equal(winners[0].candidates[0], '2');
      assert.equal(winners[0], '2');
    });

    it('one winner forced close', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0], { from: accountA });
      await ballot.vote(hash, [1], { from: accountB });
      await ballot.vote(hash, [2], { from: accountC });
      await ballot.vote(hash, [2], { from: accountD });

      const receipt = await ballot.closePoll(hash, { from: owner });
      assert.equal(receipt.receipt.logs[0].args.winners[0], '2');
    });

    it('already closed', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [0], { from: accountA });
      await ballot.vote(hash, [1], { from: accountB });
      await ballot.vote(hash, [2], { from: accountC });
      await ballot.vote(hash, [2], { from: accountD });
      await ballot.vote(hash, [2], { from: accountE });

      await expectRevert(ballot.closePoll(hash, { from: owner }), 'This poll is closed already');
    });

    it('two winners normal close', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5);
      const hash = await ballot.getLastPollHash();

      await ballot.vote(hash, [1], { from: accountA });
      await ballot.vote(hash, [1], { from: accountB });
      await ballot.vote(hash, [2], { from: accountC });
      await ballot.vote(hash, [2], { from: accountD });

      expectEvent(await ballot.vote(hash, [0], { from: accountE }), 'PollClosed');

      const winners = await ballot.winners(hash);

      assert.equal(winners[0], '2');
      assert.equal(winners[1], '1');
    });
  });
});
