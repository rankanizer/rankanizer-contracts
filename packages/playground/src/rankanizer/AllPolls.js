import { useState, useEffect } from 'react';
import PollsItem from './PollsItem';
import './rankanizer.css';

const AllPolls = (props) => {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    async function load () {
      const size = await props.ballot.methods.pollCount().call();

      const temp = [];
      for (let i = 0; i < size; i++) {
        const result = await props.ballot.methods.pollByIndex(i).call();
        const data = {
          ...result[1],
          hash: result[0],
          index: i + 1,
        };
        temp.push(data);
      }
      setPolls(temp);
    }

    load().catch(console.error);
  }, []);

  return (
    <div className="polls-list">
      {polls.map((poll) => (
        <PollsItem
          candidates={poll.candidates}
          uri={poll.uri}
          expire={poll.expire}
          finished={poll.finished}
          index={poll.index}
          key={poll.hash}
        />
      ))}
    </div>
  );
};

export default AllPolls;
