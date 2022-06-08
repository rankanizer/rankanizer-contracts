import './App.css';

import { useEffect, useState } from 'react';
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider';

import MainPage from './rankanizer/MainPage'
import Navigation from './rankanizer/Navigation.js'

import Ballot from '@rankanizer-contracts/contracts/build/contracts/Ballot.json'

function App() {
  const [account, setAccount] = useState();
  const [open, setOpen] = useState();
  const [ballot, setBallot] = useState();
  const [expire, setExpire] = useState();
  const [candidates, setCandidates] = useState();
  
  useEffect(() => {
    async function load() {
      const provider = await detectEthereumProvider();

      if (provider) {
        web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');

        const accounts = await ethereum.request({ method: 'eth_accounts' });

        setAccount(accounts[0]);

        const ballot = new web3.eth.Contract(Ballot.abi, process.env.REACT_APP_BALLOT_ADDRESS)
        setBallot(ballot)

        let expire = await ballot.methods.expire().call()
        setExpire(expire)

        let open = await ballot.methods.finished().call()
        setOpen(!open)

        let candidates = await ballot.methods.votes().call()
        setCandidates(candidates.length)
      } else {
        console.log('Please install MetaMask!');
      }
    }
    
    load().catch(console.error);
   }, []);
  
   return (
      <div className='app'>
        <h1>Rankanizer</h1>
          <Navigation />
          <MainPage 
              ballot = { ballot }
              expire = { expire }
              account = { account }
              open = { open }
              candidates = { candidates } />
      </div>
   );
}


export default App
