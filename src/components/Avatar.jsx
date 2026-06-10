import './Avatar.css';

export default function Avatar({ 
  src, 
  alt = '', 
  size = 'md', 
  online,
  border = false,
  className = '' 
}) {
  return (
    <div className={`avatar avatar-${size} ${border ? 'avatar-border' : ''} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="avatar-img" />
      ) : (
        <div className="avatar-placeholder">
          {alt ? alt.charAt(0).toUpperCase() : '?'}
        </div>
      )}
      {online !== undefined && (
        <span className={`avatar-status ${online ? 'online' : 'offline'}`} />
      )}
    </div>
  );
}
