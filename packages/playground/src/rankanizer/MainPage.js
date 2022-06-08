import React, {Component} from 'react';
import { Routes, Route } from 'react-router-dom';

import Poll from './Poll.js';
import MyPolls from './MyPolls.js';
import Vote from './Vote.js';
import Results from './Results.js';


class MainPage extends Component {

  render() {
    return (
      <Routes>
        <Route exact path='/' element={<MyPolls
                              ballot={this.props.ballot}
                              expire={this.props.expire}
                              candidates={this.props.candidates}
                              open={this.props.open}
                              />}></Route>
        <Route exact path='/create' element={<Poll
                              ballot={this.props.ballot}
                              account={this.props.account}
                              />}></Route>
        <Route exact path='/vote' element={<Vote
                              candidates={this.props.candidates}
                              />}></Route>
        <Route exact path='/results' element={<Results/>}></Route>
      </Routes>
    )
  }
}

export default MainPage;