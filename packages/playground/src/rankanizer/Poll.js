import React, { Component } from 'react';

class Poll extends Component {
  constructor (props) {
    super(props);
    this.candidates = 0;
  }

  // setCandidate (i, newCandidate) {
  //   let items = [...this.candidates];
  //   let item = {...items[1]};
  //   item.name = newCandidate;
  //   items[i] = item;
  //   this.candidates = items;
  // }

  createPoll () {
    const candidatesList = [];
    const n = parseInt(this.candidates.value);
    let i;
    for (i = 1; i <= n; i++) {
      candidatesList[i - 1] = i.toString();
    }
    console.log(this.props.ballot);
    // this.setState({loading: true});
    this.props.ballot.methods
      .initialize(candidatesList, this.duration.value.toString())
      .send({ from: this.props.account });
    // .on('transactionHash', (hash) => {
    //     this.setState({loading: false});
    // });
  }

  render () {
    return (
      <div className='home'>
        <h2>Create Poll</h2>
        <form className='mb-3'
          onSubmit={(event) => {
            event.preventDefault();
            this.createPoll();
          }
          }
        >
          <div style={{ boardspacing: '0 1em' }}>
            <label className='float-left' style={{ marginLeft: '15px' }}><b>Duration</b></label>
            <div className='input-group mb-3'>
              <input ref={(input) => { this.duration = input; }} type='text' placeholder='Blocks to expire' required/>
            </div>
            <label className='float-left' style={{ marginLeft: '15px' }}><b>Candidates</b></label>
            <div className='input-group mb-1'>
              <input ref={(input) => { this.candidates = input; }}
                type='text' placeholder='Number of candidates' required/>
            </div>
            <button type='submit' className='btn btn-primary'>Create</button>
          </div>
        </form>
      </div>
    );
  }
}

export default Poll;
