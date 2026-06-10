import './Tag.css';

export default function Tag({ children, variant = 'default', icon, selected, onClick, className = '' }) {
  return (
    <span 
      className={`tag tag-${variant} ${selected ? 'tag-selected' : ''} ${onClick ? 'tag-clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {icon && <span className="tag-icon">{icon}</span>}
      {children}
    </span>
  );
}
