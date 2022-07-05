import React, { useState } from 'react';
import './rankanizer.css';

const MyPollsItem = (props) => {
  const [finished, setFinished] = useState(props.finished);
  const [winners, setWinners] = useState(props.winners);

  async function closeHandler (event) {
    event.preventDefault();

    await props.ballot.methods
      .closePoll(props.hash)
      .send({ from: props.account });

    setFinished(true);
    const aux = await props.ballot.methods.winners(props.hash).call();
    setWinners(aux.map(winner => parseInt(winner) + 1));
  };

  return (
    <li>
      <div className="poll-item">
        <div className="poll-item__description">
          <h2>{`${props.uri}`}</h2>
          <div className="poll-item__number">Candidates: {props.candidates}</div>
          <div className="poll-item__number">Expire: {props.expire}</div>
          { finished && <div className="poll-item__number">Closed</div> }
          { !finished && <div className="new-poll__actions">
            <button type="button" disabled={props.expire > props.block} onClick={closeHandler}>Close</button>
          </div>}
          { winners.length > 0 &&
            <div className="poll-item__number">{winners.join(', ')}</div> }
        </div>
      </div>
    </li>
  );
};

export default MyPollsItem;
