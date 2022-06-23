import React, { useState, useEffect } from 'react';
import './rankanizer.css';

const Vote = (props) => {
  const [enteredCandidate, setEnteredCandidate] = useState('');
  const [enteredPoll, setEnteredPoll] = useState('');
  const [sizeCandidates, setSizeCandidates] = useState('');
  const [voted, setVoted] = useState(false);
  const [finished, setFinished] = useState(true);
  const [hash, setHash] = useState('');
  const [size, setSize] = useState(0);

  useEffect(() => {
    async function load () {
      const size = await props.ballot.methods.pollCount().call();
      setSize(size);
    }

    load().catch(console.error);
  }, []);

  const candidateChangeHandler = (event) => {
    setEnteredCandidate(event.target.value);
  };

  async function pollChangeHandler (event) {
    if (event.target.value && event.target.value <= size) {
      setEnteredPoll(event.target.value);
      const result = await props.ballot.methods.pollByIndex(event.target.value - 1).call();
      setSizeCandidates(result[1].candidates);
      setHash(result[0]);
      const voted = await props.ballot.methods.didVote(result[0], props.account).call();
      setVoted(voted);
      if (voted) {
        const vote = await props.ballot.methods.voteOf(result[0], props.account).call({ from: props.account });
        setEnteredCandidate(parseInt(vote) + 1);
      } else {
        setEnteredCandidate('');
      }
      setFinished(result[1].finished);
    }
  };

  async function submitHandler (event) {
    event.preventDefault();

    await props.ballot.methods
      .vote(hash, [enteredCandidate - 1])
      .send({ from: props.account });

    setEnteredCandidate('');
    setEnteredPoll('');
  };

  return (
    <div className='new-poll'>
      <form onSubmit={submitHandler}>
        <div className="new-poll__controls">
          <div className="new-poll__control">
            <label>Poll</label>
            <input type="number"
              min="1" step="1" max={size} value={enteredPoll} required onChange={pollChangeHandler}/>
          </div>
          <div className="new-poll__control">
            <label>Candidate</label>
            <input type="number"
              min="1" step="1"
              value={enteredCandidate}
              max={sizeCandidates}
              placeholder={'From 1 to ' + sizeCandidates} required onChange={candidateChangeHandler}/>
          </div>
        </div>
        <div className="new-poll__actions">
          <button type="button" onClick={props.onCancel}>Cancel</button>
          <button type="submit" disabled={finished}>{voted ? 'Change Vote' : 'Vote'}</button>
        </div>
      </form>
    </div>
  );
};

export default Vote;
