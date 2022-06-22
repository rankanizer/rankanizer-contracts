import React, { useState } from 'react';
import './rankanizer.css';

const Vote = (props) => {
  const [enteredCandidate, setEnteredCandidate] = useState('');

  const candidateChangeHandler = (event) => {
    setEnteredCandidate(event.target.value);
  };

  const submitHandler = (event) => {
    event.preventDefault();

    // const expenseData = {
    //     title: enteredTitle,
    //     amount: +enteredAmount,
    //     date: new Date(enteredDate)
    // }

    // props.onSaveExpenseData(expenseData);
    setEnteredCandidate('');
  };

  return (
    <div className='new-poll'>
      <form onSubmit={submitHandler}>
        <div className="new-poll__controls">
          <div className="new-poll__control">
            <label>Candidate</label>
            <input type="number" min="1" step="1" value={enteredCandidate} onChange={candidateChangeHandler}/>
          </div>
        </div>
        <div className="new-poll__actions">
          <button type="button" onClick={props.onCancel}>Cancel</button>
          <button type="submit">Vote</button>
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
