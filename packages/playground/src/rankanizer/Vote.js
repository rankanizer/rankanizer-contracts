import React, { useState } from 'react';
import './rankanizer.css';

const Vote = (props) => {
  const [enteredCandidate, setEnteredCandidate] = useState('');
  const [enteredPoll, setEnteredPoll] = useState('');
  const [sizeCandidates, setSizeCandidates] = useState('');
  const [voted, setVoted] = useState(false);
  const [vote, setVote] = useState(0);
  const [hash, setHash] = useState('');

  const candidateChangeHandler = (event) => {
    setEnteredCandidate(event.target.value);
  };

  async function pollChangeHandler (event) {
    if (event.target.value && event.target.value <= props.size) {
      setEnteredPoll(event.target.value);
      const result = await props.ballot.methods.pollByIndex(event.target.value - 1).call();
      setSizeCandidates(result[1].candidates);
      setHash(result[0]);
      const voted = await props.ballot.methods.didVote(result[0], props.account).call();
      setVoted(voted);
      if (voted) {
        const vote = await props.ballot.methods.voteOf(result[0], props.account).call({ from: props.account });
        setVote(parseInt(vote) + 1);
      }
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
              min="1" step="1" max={props.size} value={enteredPoll} required onChange={pollChangeHandler}/>
          </div>
          <div className="new-poll__control">
            <label>Candidate</label>
            <input type="number"
              min="1" step="1"
              value={enteredCandidate}
              placeholder={voted
                ? vote
                : 'From 1 to ' + sizeCandidates} required onChange={candidateChangeHandler}/>
          </div>
        </div>
        <div className="new-poll__actions">
          <button type="button" onClick={props.onCancel}>Cancel</button>
          <button type="submit">{voted ? 'Change Vote' : 'Vote'}</button>
        </div>
      </form>
    </div>
    // <div className='home'>
    //   <h2>Vote</h2>
    //   <form className='mb-3'
    //     onSubmit={(event) => {
    //       event.preventDefault();
    //       const selected = parseInt(this.candidate.value.toString());
    //       this.props.ballot.methods
    //         .vote([selected - 1])
    //         .send({ from: this.props.account });
    //     }}
    //   >
    //     <div style={{ boardspacing: '0 1em' }}>
    //       <label className='float-left' style={{ marginLeft: '15px' }}><b>Candidate:</b></label>&nbsp;&nbsp;
    //       <input ref={(input) => { this.candidate = input; }} type='text'
    //         placeholder={this.props.voted
    //           ? this.props.candidate
    //           : 'From 1 to ' + this.props.candidates} required/>&nbsp;&nbsp;
    //       <button type='submit' className='btn btn-primary'>{this.props.voted ? 'Change Vote' : 'Vote'}</button>
    //     </div>
    //   </form>
    // </div>
  );
};

export default Vote;
