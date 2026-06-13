import './MatchCard.css';

export default function MatchCard({ match }) {
  return (
    <div className="match-card">
      <div className="match-card-header">
        <div className="match-avatar-container">
          <img src={match.photo} alt={match.name} className="match-avatar" />
          {match.isActive && <div className="active-indicator"></div>}
        </div>
        
        <div className="match-info">
          <div className="match-name-row">
            <h3 className="match-name">{match.name}</h3>
            <span className="match-age">{match.age}</span>
          </div>
          <div className="match-status">{match.lastActive}</div>
          <div className="match-badge">{match.drinkPersonality}</div>
        </div>
      </div>

      <div className="match-insights">
        <div className="insight-header">
          <span className="insight-score">{match.compatibility}% Match</span>
        </div>
        <div className="insight-subtitle">Shared:</div>
        <div className="insight-list">
          {match.shared.map((item, idx) => (
            <div key={idx} className="insight-item">
              <span className="insight-check">✓</span> {item}
            </div>
          ))}
        </div>
      </div>

      <div className="match-actions">
        <button className="btn-chat">Start Chat</button>
        <button className="btn-profile">View Profile</button>
      </div>
    </div>
  );
}
