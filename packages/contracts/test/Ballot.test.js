const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');

const Ballot = artifacts.require('Ballot');

contract('Ballot', function (accounts) {
  const [ owner,
    accountA, accountB, accountC, accountD, accountE,
    accountF, accountG, accountH, accountI, accountJ ] = accounts;

  describe('constructorBallot', function () {
    let ballot;
    const id = 0;

    it('poll creation', async function () {
      const ballot1 = await Ballot.new();
      await expectRevert(ballot1.createPoll([], 5, { from: owner }),
        'The list of candidates should have at least two elements');
      const ballot2 = await Ballot.new();
      await expectRevert(ballot2.createPoll(['A'], 5, { from: owner }),
        'The list of candidates should have at least two elements');
      const ballot3 = await Ballot.new();
      await expectRevert(ballot3.createPoll(['A', 'B'], 0, { from: owner }),
        'The duration of the poll must be greater than zero');

      const ballot4 = await Ballot.new();
      await ballot4.initialize({ from: owner });
      await ballot4.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);

      await ballot4.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);

      const candidates = await ballot4.candidatesList(1);
      assert.equal(candidates.length, 3);
      const expire = (new BN(5)).add(await time.latestBlock());
      expect(await ballot4.expire(1)).to.be.bignumber.equal(new BN(expire));
    });

    // Vote Tests
    it('vote', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);
      await ballot.vote(id, [1]);
      expect(await ballot.votesOf(id, 1)).to.be.bignumber.equal('1');
      const votes = await await ballot.votes(id);
      expect(votes[1]).to.be.bignumber.equal('1');
    });

    it('votes of nonexistent candidate', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);
      await expectRevert(ballot.votesOf(id, 100), 'Candidate doesn\'t exist.');
    });

    it('vote in nonexistent candidate', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);
      await expectRevert(ballot.vote(id, [100], { from: accountA }), 'Candidate doesn\'t exist.');
    });

    it('vote again', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);
      await ballot.vote(id, [1]);
      await ballot.vote(id, [0]);
      expect(await ballot.votesOf(id, 1)).to.be.bignumber.equal('0');
      expect(await ballot.votesOf(id, 0)).to.be.bignumber.equal('1');
    });

    it('vote in more than one candidate', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);
      await expectRevert(ballot.vote(id, [0, 1], { from: accountA }), 'Voting must be for only one candidate.');
    });

    it('no votes', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      const receipt = await ballot.closePoll(id);
      assert.equal(receipt.receipt.logs[0].args.winners.length, 0);
    });

    it('votes and voted', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 6);

      await ballot.vote(id, [0], { from: accountA });
      const votes = await ballot.voteOf(id, accountA);
      assert.equal(votes[0], '0');
      // eslint-disable-next-line no-unused-expressions
      expect(await ballot.didVote(id, accountA)).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(await ballot.didVote(id, accountB)).to.be.false;
    });

    it('vote after closed', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 6);

      await ballot.vote(id, [0], { from: accountA });
      await ballot.vote(id, [1], { from: accountB });
      await ballot.vote(id, [1], { from: accountC });
      await ballot.vote(id, [2], { from: accountD });
      await ballot.vote(id, [2], { from: accountE });

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      await expectRevert(ballot.vote(id, [1], { from: accountF }), 'This poll is closed. No more votes allowed');
      expect(await ballot.votesOf(id, 1)).to.be.bignumber.equal('2');
    });

    it('votes in order odd sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 6);

      await ballot.vote(id, [0], { from: accountA });
      await ballot.vote(id, [1], { from: accountB });
      await ballot.vote(id, [1], { from: accountC });
      await ballot.vote(id, [2], { from: accountD });
      await ballot.vote(id, [2], { from: accountE });
      await ballot.vote(id, [2], { from: accountF });
    });

    it('votes in order even sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb', 'Hastur'], 10);

      await ballot.vote(id, [0], { from: accountA });
      await ballot.vote(id, [1], { from: accountB });
      await ballot.vote(id, [1], { from: accountC });
      await ballot.vote(id, [2], { from: accountD });
      await ballot.vote(id, [2], { from: accountE });
      await ballot.vote(id, [2], { from: accountF });
      await ballot.vote(id, [3], { from: accountG });
      await ballot.vote(id, [3], { from: accountH });
      await ballot.vote(id, [3], { from: accountI });
      await ballot.vote(id, [3], { from: accountJ });
    });

    it('votes in reverse order odd sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 6, { from: owner });

      await ballot.vote(id, [2], { from: accountA });
      await ballot.vote(id, [2], { from: accountB });
      await ballot.vote(id, [2], { from: accountC });
      await ballot.vote(id, [1], { from: accountD });
      await ballot.vote(id, [1], { from: accountE });
      await ballot.vote(id, [0], { from: accountF });
    });

    it('votes in reverse order even sized candidates', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb', 'Hastur'], 10);

      await ballot.vote(id, [3], { from: accountA });
      await ballot.vote(id, [3], { from: accountB });
      await ballot.vote(id, [3], { from: accountC });
      await ballot.vote(id, [3], { from: accountD });
      await ballot.vote(id, [2], { from: accountE });
      await ballot.vote(id, [2], { from: accountF });
      await ballot.vote(id, [2], { from: accountG });
      await ballot.vote(id, [1], { from: accountH });
      await ballot.vote(id, [1], { from: accountI });
      await ballot.vote(id, [0], { from: accountJ });
    });

    // Winner tests
    it('winners poll not closed', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);
      await expectRevert(ballot.winners(id), 'This poll is not closed yet.');
    });

    it('one winner normal close', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);

      await ballot.vote(id, [0], { from: accountA });
      await ballot.vote(id, [1], { from: accountB });
      await ballot.vote(id, [2], { from: accountC });
      await ballot.vote(id, [2], { from: accountD });

      expectEvent(await ballot.vote(id, [2], { from: accountE }), 'PollClosed');
      expect(await ballot.finished(id)).to.be.equal(true);
      const winners = await ballot.winners(id);
      // assert.equal(winners[0].candidates[0], '2');
      assert.equal(winners[0], '2');
    });

    it('one winner forced close', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote(id, [0], { from: accountA });
      await ballot.vote(id, [1], { from: accountB });
      await ballot.vote(id, [2], { from: accountC });
      await ballot.vote(id, [2], { from: accountD });

      const receipt = await ballot.closePoll(id, { from: owner });
      assert.equal(receipt.receipt.logs[0].args.winners[0], '2');
      // assert.equal(receipt.receipt.logs[0].args.winners[0].candidates[0], '2');
      // expectEvent(receipt, 'PollClosed', { winners: [new BN(2), new BN(1) ] });
    });

    it('already closed', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5, { from: owner });

      await ballot.vote(id, [0], { from: accountA });
      await ballot.vote(id, [1], { from: accountB });
      await ballot.vote(id, [2], { from: accountC });
      await ballot.vote(id, [2], { from: accountD });
      await ballot.vote(id, [2], { from: accountE });

      await expectRevert(ballot.closePoll(id, { from: owner }), 'This poll is closed already');
    });

    it('two winners normal close', async function () {
      ballot = await Ballot.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(['Cthulhu', 'Nyar', 'Shubb'], 5);

      await ballot.vote(id, [1], { from: accountA });
      await ballot.vote(id, [1], { from: accountB });
      await ballot.vote(id, [2], { from: accountC });
      await ballot.vote(id, [2], { from: accountD });

      expectEvent(await ballot.vote(id, [0], { from: accountE }), 'PollClosed');

      const winners = await ballot.winners(id);

      assert.equal(winners[0], '2');
      assert.equal(winners[1], '1');
      // assert.equal(winners[0].candidates[0], '2');
      // assert.equal(winners[0].candidates[1], '1');
    });
  });
});
