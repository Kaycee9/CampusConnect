import './Avatar.css';

const COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#EA580C',
  '#059669', '#0891B2', '#4F46E5', '#C026D3',
];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ src, name = '', size = 'md', status, className = '' }) {
  const initials = getInitials(name || '?');
  const bgColor = getColor(name || '?');

  return (
    <div className={`avatar avatar--${size} ${className}`}>
      {src ? (
        <img src={src} alt={name} className="avatar__img" />
      ) : (
        <span className="avatar__initials" style={{ backgroundColor: bgColor }}>
          {initials}
        </span>
      )}
      {status && <span className={`avatar__status avatar__status--${status}`} />}
    </div>
  );
}
