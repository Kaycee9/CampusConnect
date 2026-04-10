import { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

export default function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = 20,
  readonly = false,
  showValue = false,
  className = '',
}) {
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || value;

  return (
    <div className={`star-rating ${readonly ? 'star-rating--readonly' : ''} ${className}`}>
      <div className="star-rating__stars">
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1;
          const filled = starValue <= displayValue;

          return (
            <button
              key={i}
              type="button"
              className={`star-rating__star ${filled ? 'star-rating__star--filled' : ''}`}
              onClick={() => !readonly && onChange?.(starValue)}
              onMouseEnter={() => !readonly && setHovered(starValue)}
              onMouseLeave={() => !readonly && setHovered(0)}
              disabled={readonly}
              aria-label={`Rate ${starValue} of ${max}`}
            >
              <Star size={size} fill={filled ? 'currentColor' : 'none'} />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="star-rating__value">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
