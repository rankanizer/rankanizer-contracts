import { useState, useEffect } from 'react';
import PollsItem from './PollsItem';
import './rankanizer.css';

function Results (props) {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    async function load () {
      const size = await props.ballot.methods.pollCount().call();

      const temp = [];
      for (let i = 0; i < size; i++) {
        const result = await props.ballot.methods.pollByIndex(i).call();
        if (result[1].finished) {
          const winners = [];
          const aux = await props.ballot.methods.winners(result[0]).call();
          for (let i = 0; i < aux.length; i++) {
            winners[i] = parseInt(aux[i]) + 1;
          }
          const data = {
            ...result[1],
            hash: result[0],
            winners: winners,
            index: i + 1,
          };
          temp.push(data);
        }
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
          winners={poll.winners.toString()}
        />
      ))}
    </div>
  );
};

export default Results;
