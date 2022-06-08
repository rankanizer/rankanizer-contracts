import React, {Component} from 'react'

class Vote extends Component {

  render() {
    return (
      <div className='home'>
        <h2>Vote</h2>
        <form className='mb-3' 
              onSubmit={(event) => {
                      event.preventDefault()
                  }
              }
          >
              <div style={{boardspacing: '0 1em'}}>
                  <label className='float-left' style={{marginLeft: '15px'}}><b>Candidate:</b></label>
                  <div className='input-group mb-3'>
                      <input ref={(input)=> {this.duration = input}} type='text' placeholder={'From 1 to ' + this.props.candidates} required/>
                  </div>
                  <button type='submit' className='btn btn-primary'>Create</button>
              </div>
          </form>
      </div>
    )
  }
}

export default Vote;