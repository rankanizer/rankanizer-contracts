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
    setWinners(await props.ballot.methods.winners(props.hash).call());
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
            <button type="button" onClick={closeHandler}>Close</button>
          </div>}
          { winners.toString() && <div className="poll-item__number">{winners}</div> }
        </div>
      </div>
    </li>
  );
};

export default MyPollsItem;
