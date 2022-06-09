import React, {Component} from 'react'

class Results extends Component {


  render() {
    return (
      <div className='home'>
        <h2>Results</h2>
        { this.props.votes }
      </div>
    );
  }
}

export default Results;