import { useState, useEffect } from 'react';
import PollsItem from './PollsItem';
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
        const data = {
          uri: poll.uri,
          candidates: poll.candidates,
          expire: poll.expire,
          finished: poll.finished,
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
        <PollsItem
          candidates={poll.candidates}
          uri={poll.uri}
          expire={poll.expire}
          finished={poll.finished}
          index={poll.index}
          key={poll.owner + poll.uri}
        />
      ))}
    </ul>
  );
};

export default MyPolls;
