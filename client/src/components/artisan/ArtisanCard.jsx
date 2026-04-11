import { Link } from 'react-router-dom';
import { MapPin, BriefcaseBusiness } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import StarRating from '../ui/StarRating.jsx';
import './ArtisanCard.css';

function formatCurrency(value) {
  if (value == null) {
    return 'Flexible pricing';
  }

  return `From NGN ${Number(value).toLocaleString()}`;
}

export default function ArtisanCard({ artisan }) {
  return (
    <Card className="artisan-card" hover>
      <Link to={`/artisan/${artisan.id}`} className="artisan-card__link" aria-label={`Open ${artisan.fullName} profile`}>
        <div className="artisan-card__header">
          <Avatar src={artisan.avatarUrl} name={artisan.fullName} size="lg" status={artisan.isAvailable ? 'online' : 'busy'} />
          <div>
            <h3 className="artisan-card__name">{artisan.fullName}</h3>
            <p className="artisan-card__category">{artisan.category?.replace('_', ' ')}</p>
          </div>
          <Badge status={artisan.isAvailable ? 'available' : 'busy'} size="sm" dot>
            {artisan.isAvailable ? 'Available' : 'Busy'}
          </Badge>
        </div>

        <p className="artisan-card__bio">{artisan.bio || 'Trusted service provider ready to help around campus.'}</p>

        <div className="artisan-card__meta">
          <div className="artisan-card__rating">
            <StarRating readonly value={artisan.averageRating || 0} size={16} />
            <span>
              {(artisan.averageRating || 0).toFixed(1)} ({artisan.totalReviews || 0})
            </span>
          </div>
          <div className="artisan-card__jobs">
            <BriefcaseBusiness size={16} />
            <span>{artisan.totalJobs || 0} jobs</span>
          </div>
        </div>

        <div className="artisan-card__footer">
          <p className="artisan-card__price">{formatCurrency(artisan.startingPrice)}</p>
          <p className="artisan-card__address">
            <MapPin size={14} />
            <span>{artisan.address || 'Campus area'}</span>
          </p>
        </div>
      </Link>
    </Card>
  );
}
