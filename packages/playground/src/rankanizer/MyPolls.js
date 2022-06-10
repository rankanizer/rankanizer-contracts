import React, { Component } from 'react';

class MyPolls extends Component {
  render () {
    return (
      <div className='home'>
        <h2>My Polls</h2>
        <div style={{ boardspacing: '0 1em' }}>
          <label className='float-left' style={{ marginLeft: '15px' }}><b>Duration:</b></label>
          <label className='float-left' style={{ marginLeft: '15px' }}>{this.props.expire}</label>&nbsp;&nbsp;
          <label className='float-left' style={{ marginLeft: '15px' }}><b>Candidates:</b></label>
          <label className='float-left' style={{ marginLeft: '15px' }}>{this.props.candidates}</label>&nbsp;&nbsp;
          <label className='float-left' style={{ marginLeft: '15px' }}>
            <b>{this.props.open ? 'Open' : 'Close'}</b></label>
        </div>
      </div>
    );
  }
}

export default MyPolls;
