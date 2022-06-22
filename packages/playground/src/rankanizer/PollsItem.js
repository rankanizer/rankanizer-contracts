import './rankanizer.css';

function PollsItem (props) {
  return (
    <li>
      <div className="poll-item">
        <div className="poll-item__description">
          <h2>{props.uri}</h2>
          <div className="poll-item__number">Candidates: {props.candidates}</div>
          <div className="poll-item__number">Expire: {props.expire}</div>
          <div className="poll-item__number">{props.finished ? 'Closed' : 'Open'}</div>
        </div>
      </div>
    </li>
  );
}

export default PollsItem;
