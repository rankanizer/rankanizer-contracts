const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');

const CondorcetVoting = artifacts.require('CondorcetVoting');
const seedrandom = require('seedrandom');
const generator = seedrandom('rankanizer');

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
      const receipt = await ballot4.createPoll(3, '', 5);
      const hash = receipt.receipt.logs[0].args.pollHash;
      const expire = (new BN(5)).add(await time.latestBlock());
      expect(await ballot4.expire(hash)).to.be.bignumber.equal(new BN(expire));
    });

    it('poll creation', async function () {
      const ballot1 = await CondorcetVoting.new();
      await ballot1.initialize({ from: owner });
      await expectRevert(ballot1.createPoll(0, '', 5, { from: owner }),
        'The list of candidates should have at least two elements');
      const ballot2 = await CondorcetVoting.new();
      await ballot2.initialize({ from: owner });
      await expectRevert(ballot2.createPoll(1, '', 5, { from: owner }),
        'The list of candidates should have at least two elements');
      const ballot3 = await CondorcetVoting.new();
      await ballot3.initialize({ from: owner });
      await expectRevert(ballot3.createPoll(2, '', 0, { from: owner }),
        'The duration of the poll must be greater than zero');

      expectEvent(await ballot3.createPoll(3, '', 5, { from: accountE }), 'PollCreated');

      const ballot4 = await CondorcetVoting.new();
      await ballot4.initialize({ from: owner });
      const receipt = await ballot4.createPoll(3, '', 5, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;

      const expire = (new BN(5)).add(await time.latestBlock());
      expect(await ballot4.expire(hash)).to.be.bignumber.equal(new BN(expire));
    });

    // Creator Only Tests
    it('creator only methods', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;
      await expectRevert(
        ballot.votes(hash, { from: accountA }), 'This method should be called only by the poll\'s creator.');
      await expectRevert(
        ballot.votesOf(hash, 0, { from: accountA }), 'This method should be called only by the poll\'s creator.');
      await expectRevert(
        ballot.closePoll(hash, { from: accountA }), 'This method should be called only by the poll\'s creator.');
    });

    // Creator or voter tests
    it('creator or voter methods', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;
      await ballot.submitVote(hash, [0, 1, 2], { from: accountA });
      ballot.voteOf(hash, accountA, { from: accountA });
      ballot.voteOf(hash, accountA, { from: owner });
      await expectRevert(
        ballot.voteOf(hash, accountA, { from: accountB }), 'Only the creator or the voter may call this method.');
    });

    // Poll must exist tests
    it('poll must exist', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      await ballot.createPoll(3, '', 5, { from: owner });
      const hash = '0xc7d192c913a3e8099bc01a2520830ac822853710d241c1b13a1e68534e9676ed';
      await expectRevert(ballot.submitVote(hash, [0, 1, 2]), 'EnumerablePollMap: poll doesn\'t exists');
      await expectRevert(ballot.closePoll(hash), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.votesOf(hash, 0), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.voteOf(hash, accountA), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.didVote(hash, accountA), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.votes(hash), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.winners(hash), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.expire(hash), 'Invalid poll id. This poll doesn\'t exist.');
      await expectRevert(ballot.finished(hash), 'Invalid poll id. This poll doesn\'t exist.');
    });

    // Enumeration Methods
    it('poll enumeration', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });

      let size = await ballot.pollCount();
      expect(size).to.be.bignumber.equal('0');
      const receipt = await ballot.createPoll(3, 'some_uri', 5, { from: accountA });
      const hash = receipt.receipt.logs[0].args.pollHash;

      let poll = await ballot.pollByHash(hash);
      assert.equal(poll.uri, 'some_uri');

      poll = await ballot.pollByIndex(0);
      assert.equal(poll[1].uri, 'some_uri');

      size = await ballot.pollCount();
      expect(size).to.be.bignumber.equal('1');
      await ballot.createPoll(3, '', 5, { from: accountB });

      size = await ballot.pollCount();
      expect(size).to.be.bignumber.equal('2');
      await ballot.createPoll(3, '', 5, { from: accountC });

      size = await ballot.pollCount();
      expect(size).to.be.bignumber.equal('3');
    });

    it('poll owner enumeration', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });

      let size = await ballot.ownerPollCount(accountA);
      expect(size).to.be.bignumber.equal('0');
      await ballot.createPoll(3, 'some_uri', 5, { from: accountA });
      await ballot.createPoll(3, 'other_uri', 5, { from: accountB });
      await ballot.createPoll(3, 'another_uri', 5, { from: accountB });

      size = await ballot.ownerPollCount(accountA);
      expect(size).to.be.bignumber.equal('1');

      size = await ballot.ownerPollCount(accountB);
      expect(size).to.be.bignumber.equal('2');

      const hash = await ballot.ownerPollByIndex(accountA, 0);
      const poll = await ballot.pollByHash(hash);
      assert.equal(poll.uri, 'some_uri');
    });

    // Vote Tests
    it('vote', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5);
      const hash = receipt.receipt.logs[0].args.pollHash;
      await ballot.submitVote(hash, [2, 1, 0]);
      expect(await ballot.votesOf(hash, 2)).to.be.bignumber.equal('0');
    });

    it('one vote per account', async function () {
      const votes = accounts.length;
      const candidates = 5;

      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(candidates, '', votes + 1, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;

      for (let i = 0; i < votes; i++) {
        const ranking = [];
        for (let j = 0; j < candidates; j++) {
          ranking[j] = Math.floor(generator() * candidates);
        }
        const voter = i;
        await ballot.submitVote(hash, ranking, { from: accounts[voter] });
      }

      await ballot.closePoll(hash, { from: owner });
    });

    it('lots of votes', async function () {
      const votes = Math.floor(generator() * 100) + 100;
      const candidates = 5;

      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(candidates, '', votes + 1, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;

      for (let i = 0; i < votes; i++) {
        const ranking = [];
        for (let j = 0; j < candidates; j++) {
          ranking[j] = Math.floor(generator() * candidates);
        }
        const voter = Math.floor(generator() * accounts.length);
        const voted = await ballot.didVote(hash, accounts[voter]);
        if (voted) {
          await ballot.changeVote(hash, ranking, { from: accounts[voter] });
        } else {
          await ballot.submitVote(hash, ranking, { from: accounts[voter] });
        }
      }

      await ballot.closePoll(hash, { from: owner });
    });

    it('vote in less candidates', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5);
      const hash = receipt.receipt.logs[0].args.pollHash;
      await expectRevert(
        ballot.submitVote(hash, [2, 1], { from: accountA }), 'Voting must be casted for all candidates.');
    });

    it('vote in more candidates', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5);
      const hash = receipt.receipt.logs[0].args.pollHash;
      await expectRevert(
        ballot.submitVote(hash, [2, 1, 0, 0], { from: accountA }), 'Voting must be casted for all candidates.');
    });

    it('votes of nonexistent candidate', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5);
      const hash = receipt.receipt.logs[0].args.pollHash;
      await expectRevert(ballot.votesOf(hash, 100), 'Candidate doesn\'t exist.');
    });

    it('vote in nonexistent candidate', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5);
      const hash = receipt.receipt.logs[0].args.pollHash;
      await expectRevert(ballot.submitVote(hash, [100, 1, 0], { from: accountA }), 'Candidate doesn\'t exist.');
    });

    it('vote of nonexistent voter', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;
      await expectRevert(ballot.voteOf(hash, accountA, { from: owner }), 'Voter must exist.');
    });

    it('vote again', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      let receipt = await ballot.createPoll(3, '', 5, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;
      await ballot.submitVote(hash, [2, 0, 1]);
      await ballot.changeVote(hash, [1, 2, 0]);

      receipt = await ballot.closePoll(hash, { from: owner });
      assert.equal(receipt.receipt.logs[0].args.winners[0], '2');
    });

    it('no votes', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      let receipt = await ballot.createPoll(3, '', 5, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      receipt = await ballot.closePoll(hash, { from: owner });
      assert.equal(receipt.receipt.logs[0].args.winners.length, 0);
    });

    it('votes and voted', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      let receipt = await ballot.createPoll(3, '', 6);
      const hash = receipt.receipt.logs[0].args.pollHash;

      receipt = await ballot.submitVote(hash, [2, 1, 0], { from: accountA });
      const votes = await ballot.voteOf(hash, accountA, { from: accountA });
      assert.equal(votes.rank[2], '0');
      // eslint-disable-next-line no-unused-expressions
      expect(await ballot.didVote(hash, accountA)).to.be.true;
      // eslint-disable-next-line no-unused-expressions
      expect(await ballot.didVote(hash, accountB)).to.be.false;
    });

    it('vote after closed', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 6);
      const hash = receipt.receipt.logs[0].args.pollHash;

      await ballot.submitVote(hash, [0, 1, 2], { from: accountA });
      await ballot.submitVote(hash, [1, 2, 0], { from: accountB });
      await ballot.submitVote(hash, [1, 0, 2], { from: accountC });
      await ballot.submitVote(hash, [2, 0, 1], { from: accountD });
      await ballot.submitVote(hash, [2, 1, 0], { from: accountE });

      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      await expectRevert(
        ballot.submitVote(hash, [1, 0, 2], { from: accountF }), 'This poll is closed. No more votes allowed');
    });

    // Winner tests
    it('winners poll not closed', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;
      expect(await ballot.finished(hash)).to.be.equal(false);
      await expectRevert(ballot.winners(hash, { from: owner }), 'This poll is not closed yet.');
    });

    it('expired', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 7, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;

      await ballot.submitVote(hash, [0, 1, 2], { from: accountA });
      await ballot.submitVote(hash, [2, 0, 1], { from: accountB });
      await ballot.submitVote(hash, [1, 0, 2], { from: accountC });
      await ballot.submitVote(hash, [2, 0, 1], { from: accountD });
      await ballot.submitVote(hash, [1, 0, 2], { from: accountE });
      await ballot.submitVote(hash, [1, 2, 0], { from: accountF });
      expect(await ballot.finished(hash)).to.be.equal(false);
      expectRevert(
        await ballot.submitVote(hash, [2, 0, 1], { from: accountG }), 'This poll is closed. No more votes allowed');
    });

    it('one winner forced close', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      let receipt = await ballot.createPoll(3, '', 5, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;

      await ballot.submitVote(hash, [0, 1, 2], { from: accountA });
      await ballot.submitVote(hash, [2, 0, 1], { from: accountB });
      await ballot.submitVote(hash, [1, 0, 2], { from: accountC });
      await ballot.submitVote(hash, [1, 0, 2], { from: accountD });

      receipt = await ballot.closePoll(hash, { from: owner });
      expect(await ballot.finished(hash)).to.be.equal(true);
      assert.equal(receipt.receipt.logs[0].args.winners.length, '1');
      assert.equal(receipt.receipt.logs[0].args.winners[0], '1');
    });

    it('already closed', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 5, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;

      await ballot.submitVote(hash, [0, 1, 2], { from: accountA });
      await ballot.submitVote(hash, [1, 2, 0], { from: accountB });
      await ballot.submitVote(hash, [1, 0, 2], { from: accountC });
      await ballot.submitVote(hash, [2, 0, 1], { from: accountD });
      await ballot.submitVote(hash, [2, 1, 0], { from: accountE });

      await ballot.closePoll(hash, { from: owner });

      await expectRevert(ballot.closePoll(hash, { from: owner }), 'This poll is closed already');
    });

    it('more than one winner', async function () {
      ballot = await CondorcetVoting.new();
      await ballot.initialize({ from: owner });
      const receipt = await ballot.createPoll(3, '', 6, { from: owner });
      const hash = receipt.receipt.logs[0].args.pollHash;

      await ballot.submitVote(hash, [0, 1, 2], { from: accountA });
      await ballot.submitVote(hash, [0, 2, 1], { from: accountB });
      await ballot.submitVote(hash, [1, 2, 0], { from: accountC });
      await ballot.submitVote(hash, [1, 0, 2], { from: accountD });
      await ballot.submitVote(hash, [2, 0, 1], { from: accountE });
      await ballot.submitVote(hash, [2, 1, 0], { from: accountF });

      await ballot.closePoll(hash, { from: owner });

      const winners = await ballot.winners(hash, { from: owner });

      assert.equal(winners.length, '0');
    });
  });
});
