/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import './rankanizer.css';

const CreatePoll = (props) => {
  const [enteredCandidates, setEnteredCandidates] = useState('');
  const [enteredDuration, setEnteredDuration] = useState('');
  const [enteredUri, setEnteredUri] = useState('');

  const candidatesChangeHandler = (event) => {
    setEnteredCandidates(event.target.value);
  };

  const durationChangeHandler = (event) => {
    setEnteredDuration(event.target.value);
  };

  const uriChangeHandler = (event) => {
    setEnteredUri(event.target.value);
  };

  const createPoll = () => {
    const candidatesList = [];
    const n = parseInt(enteredCandidates);
    let i;
    for (i = 1; i <= n; i++) {
      candidatesList[i - 1] = i.toString();
    }
    console.log(this.props.ballot);
    this.props.ballot.methods
      .initialize(candidatesList, this.duration.value.toString())
      .send({ from: this.props.account });
  };

  const submitHandler = (event) => {
    event.preventDefault();

    // const expenseData = {
    //     title: enteredTitle,
    //     amount: +enteredAmount,
    //     date: new Date(enteredDate)
    // }

    // props.onSaveExpenseData(expenseData);
    setEnteredCandidates('');
    setEnteredDuration('');
    setEnteredUri('');
  };

  return (
    <div className='new-poll'>
      <form onSubmit={submitHandler}>
        <div className="new-poll__controls">
          <div className="new-poll__control">
            <label>Candidates</label>
            <input type="number" min="2" step="1" value={enteredCandidates} onChange={candidatesChangeHandler}/>
          </div>
          <div className="new-poll__control">
            <label>Duration</label>
            <input type="number" min="1" step="1" value={enteredDuration} onChange={durationChangeHandler}/>
          </div>
          <div className="new-poll__control">
            <label>URI</label>
            <input type="text" value={enteredUri} onChange={uriChangeHandler}/>
          </div>
        </div>
        <div className="new-poll__actions">
          <button type="button" onClick={props.onCancel}>Cancel</button>
          <button type="submit">Create Poll</button>
        </div>
      </form>
    </div>
  );
};

export default CreatePoll;
