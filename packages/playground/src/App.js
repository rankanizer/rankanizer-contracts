import './App.css';

import { useEffect, useState } from 'react';
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider';

import MainPage from './rankanizer/MainPage'
import Navigation from './rankanizer/Navigation.js'

import Ballot from '@rankanizer-contracts/contracts/artifacts/contracts/Ballot.sol/Ballot.json'

function App() {
  const [account, setAccount] = useState();
  const [owner, setOwner] = useState();
  const [open, setOpen] = useState();
  const [voted, setVoted] = useState();
  const [votes, setVotes] = useState();
  const [ballot, setBallot] = useState();
  const [expire, setExpire] = useState();
  const [candidate, setCandidate] = useState();
  const [candidates, setCandidates] = useState();
  
  useEffect(() => {
    async function load() {
      if(window.ethereum) {
          window.web3 = new Web3(window.ethereum)
          await window.ethereum.enable()
      }
      else if (window.web3) {
          window.web3 = new Web3(window.web3.currentProvider)
      }
      else {
          window.alert('No ethereum browser detected. You should consider Metamask!')
          return
      }

      const provider = await detectEthereumProvider();

      if (provider) {
        web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');

        const accounts = await ethereum.request({ method: 'eth_accounts' });

        setAccount(accounts[0].toLowerCase());

        const ballot = new web3.eth.Contract(Ballot.abi, process.env.REACT_APP_BALLOT_ADDRESS)
        setBallot(ballot)

        let owner = await ballot.methods.owner().call()
        setOwner(owner.toLowerCase())

        let expire = await ballot.methods.expire().call()
        setExpire(expire)

        let votes = await ballot.methods.votes().call()
        setVotes(votes)

        let open = await ballot.methods.finished().call()
        setOpen(!open)

        let voted = await ballot.methods.didVote(accounts[0]).call()
        setVoted(voted)

        if (voted) {
          let candidate = parseInt(await ballot.methods.voteOf(accounts[0]).call())
          setCandidate(candidate+1)
        }

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
        <h1>Rankanizer</h1><b>Account: { account }</b>
          <Navigation 
              account = { account }
              owner = { owner } />
          <MainPage 
              ballot = { ballot }
              expire = { expire }
              account = { account }
              open = { open }
              votes = { votes }
              voted = { voted }
              candidate = { candidate }
              candidates = { candidates } />
      </div>
   );
}


export default App
