/* eslint-disable no-unused-vars */
import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';

import CreatePoll from './CreatePoll.js';
import MyPolls from './MyPolls.js';
import AllPolls from './AllPolls.js';
import Vote from './Vote.js';
import Results from './Results.js';

class MainPage extends Component {
  render () {
    return (
      <Routes>
        <Route exact path='/' element={<CreatePoll
          ballot={this.props.ballot}
          account={this.props.account}
        />}></Route>
        <Route exact path='/allpolls' element={<AllPolls
          ballot={this.props.ballot}
          account={this.props.account}
        />}></Route>
        <Route exact path='/mypolls' element={<MyPolls
          ballot={this.props.ballot}
          account={this.props.account}
          block={this.props.block}
        />}></Route>
        <Route exact path='/vote' element={<Vote
          ballot={this.props.ballot}
          account={this.props.account}
        />}></Route>
        <Route exact path='/results' element={<Results
          ballot={this.props.ballot}
          account={this.props.account}
        />}></Route>
      </Routes>
    );
  }
}

export default MainPage;
