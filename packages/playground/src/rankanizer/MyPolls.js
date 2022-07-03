import { useState, useEffect } from 'react';
import MyPollsItem from './MyPollsItem';
import './rankanizer.css';

function MyPolls (props) {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    async function load () {
      const size = await props.ballot.methods.ownerPollCount(props.account).call();

      const temp = [];
      for (let i = 0; i < size; i++) {
        const hash = await props.ballot.methods.ownerPollByIndex(props.account, i).call();
        const poll = await props.ballot.methods.pollByHash(hash).call();
        const winners = [];
        if (poll.finished) {
          const temp = await props.ballot.methods.winners(hash).call();
          for (let i = 0; i < temp.length; i++) {
            winners[i] = parseInt(temp[i]) + 1;
          }
        }

        const data = {
          ...poll,
          winners: winners,
          hash: hash,
          index: i + 1,
        };
        temp.push(data);
      }
      setPolls(temp);
    }

    load().catch(console.error);
  }, []);

  return (
    <ul className="polls-list">
      {polls.map((poll) => (
        <MyPollsItem
          candidates={poll.candidates}
          uri={poll.uri}
          expire={poll.expire}
          finished={poll.finished}
          index={poll.index}
          ballot={props.ballot}
          account={props.account}
          hash={poll.hash}
          winners={poll.winners}
          key={poll.hash}
        />
      ))}
    </ul>
  );
};

export default MyPolls;
