import { useState, useEffect } from 'react';
import PollsItem from './PollsItem';
import './rankanizer.css';

function AllPolls (props) {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    async function load () {
      const size = await props.ballot.methods.pollCount().call();

      const temp = [];
      for (let i = 0; i < size; i++) {
        const result = await props.ballot.methods.pollByIndex(i).call();
        temp.push(result[1]);
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
          key={poll.owner + poll.uri}
        />
      ))}
    </ul>
  );
};

export default AllPolls;
