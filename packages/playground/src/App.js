import './App.css';

import { useEffect, useState } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

import MainPage from './rankanizer/MainPage';
import Navigation from './rankanizer/Navigation.js';

import Ballot from '@rankanizer-contracts/contracts/artifacts/contracts/Ballot.sol/Ballot.json';

function App () {
  const [account, setAccount] = useState();
  const [owner, setOwner] = useState();
  const [ballot, setBallot] = useState();

  useEffect(() => {
    async function load () {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      } else {
        window.alert('No ethereum browser detected. You should consider Metamask!');
        return;
      }

      const provider = await detectEthereumProvider();

      if (provider) {
        // eslint-disable-next-line no-global-assign
        web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');

        // eslint-disable-next-line no-undef
        const accounts = await ethereum.request({ method: 'eth_accounts' });

        setAccount(accounts[0].toLowerCase());

        const ballot = new web3.eth.Contract(Ballot.abi, process.env.REACT_APP_BALLOT_ADDRESS);
        setBallot(ballot);

        const owner = await ballot.methods.owner().call();
        setOwner(owner.toLowerCase());
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
        account = { account } />
    </div>
  );
}

export default App;
