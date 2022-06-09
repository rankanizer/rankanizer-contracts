import React, {Component} from 'react'

class Vote extends Component {

  constructor(props) {
    super(props)
    this.candidate = 0
  }

  render() {
    return (
      <div className='home'>
        <h2>Vote</h2>
        <form className='mb-3' 
              onSubmit={(event) => {
                      event.preventDefault()
                      const selected = parseInt(this.candidate.value.toString())
                      this.props.ballot.methods
                          .vote([selected-1])
                          .send({from:this.props.account})
                  }
              }
          >
              <div style={{boardspacing: '0 1em'}}>
                  <label className='float-left' style={{marginLeft: '15px'}}><b>Candidate:</b></label>&nbsp;&nbsp;
                  <input ref={(input)=> {this.candidate = input}} type='text' placeholder={this.props.voted ? this.props.candidate : 'From 1 to ' + this.props.candidates} required/>&nbsp;&nbsp;
                  <button type='submit' className='btn btn-primary'>{this.props.voted ? "Change Vote" : "Vote"}</button>
              </div>
          </form>
      </div>
    )
  }
}

export default Vote;