import './Badge.css';

const statusMap = {
  PENDING: 'warning',
  ACCEPTED: 'info',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  REJECTED: 'error',
  CANCELLED: 'neutral',
  SUCCESS: 'success',
  FAILED: 'error',
  REFUNDED: 'neutral',
  available: 'success',
  busy: 'error',
};

export default function Badge({ children, variant, status, size = 'md', dot = false, className = '' }) {
  const resolved = variant || statusMap[status] || 'neutral';

  return (
    <span className={`badge badge--${resolved} badge--${size} ${className}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}
