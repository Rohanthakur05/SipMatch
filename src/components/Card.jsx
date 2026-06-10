import './Card.css';

export default function Card({ 
  children, 
  variant = 'default', 
  padding = true,
  hover = false,
  glow = false,
  className = '',
  onClick,
  ...props 
}) {
  return (
    <div
      className={`card card-${variant} ${padding ? 'card-padded' : ''} ${hover ? 'card-hover' : ''} ${glow ? 'card-glow' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
