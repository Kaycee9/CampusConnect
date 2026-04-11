import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, BriefcaseBusiness } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import StarRating from '../../components/ui/StarRating.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../lib/api.js';
import './ArtisanPublicProfile.css';

function ReviewItem({ review }) {
  return (
    <article className="artisan-review card">
      <div className="artisan-review__head">
        <div className="artisan-review__author">
          <Avatar src={review.student.avatarUrl} name={review.student.fullName} size="sm" />
          <div>
            <p>{review.student.fullName}</p>
            <small>{new Date(review.createdAt).toLocaleDateString()}</small>
          </div>
        </div>
        <StarRating readonly value={review.rating} size={14} />
      </div>
      <p>{review.comment || 'Great experience.'}</p>
    </article>
  );
}

function ArtisanProfilePage({ artisan, onBack, onBookNow }) {
  return (
    <main className="artisan-profile-page animate-fade-in">
      <div className="artisan-profile-toolbar">
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>
          Back to browse
        </Button>
        <span className="artisan-profile-toolbar__crumb">Artisan profile</span>
      </div>

      <header className="artisan-profile-hero card">
        <div className="artisan-profile-hero__top">
          <Avatar src={artisan.avatarUrl} name={artisan.fullName} size="xl" status={artisan.isAvailable ? 'online' : 'busy'} />
          <div>
            <h1>{artisan.fullName}</h1>
            <p>{artisan.category.replace('_', ' ')}</p>
            <div className="artisan-profile-hero__badges">
              <Badge status={artisan.isAvailable ? 'available' : 'busy'} dot>
                {artisan.isAvailable ? 'Available now' : 'Currently busy'}
              </Badge>
              <span><MapPin size={14} /> {artisan.address || 'Campus area'}</span>
            </div>
          </div>
        </div>

        <div className="artisan-profile-stats">
          <div>
            <h3>{(artisan.averageRating || 0).toFixed(1)}</h3>
            <p>Average rating</p>
          </div>
          <div>
            <h3>{artisan.totalReviews || 0}</h3>
            <p>Reviews</p>
          </div>
          <div>
            <h3>{artisan.totalJobs || 0}</h3>
            <p>Completed jobs</p>
          </div>
        </div>

        <div className="artisan-profile-cta">
          <Button onClick={onBookNow}>
            Book now
          </Button>
        </div>
      </header>

      <section className="artisan-profile-section card">
        <h2>About this artisan</h2>
        <p>{artisan.bio || 'Professional artisan serving students around campus.'}</p>
        <div className="artisan-profile-price">
          <BriefcaseBusiness size={16} />
          <span>
            {artisan.startingPrice == null
              ? 'Pricing depends on request scope'
              : `Starting from NGN ${Number(artisan.startingPrice).toLocaleString()}`}
          </span>
        </div>
      </section>

      <section className="artisan-profile-section">
        <h2>Recent reviews</h2>
        <div className="artisan-profile-reviews">
          {(artisan.reviews || []).length === 0 ? (
            <div className="card artisan-review-empty">
              <p>No reviews yet.</p>
            </div>
          ) : (
            artisan.reviews.map((review) => <ReviewItem review={review} key={review.id} />)
          )}
        </div>
      </section>
    </main>
  );
}

export default function ArtisanPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data } = await api.get(`/artisans/${id}`);
        if (!active) return;
        setArtisan(data.artisan);
      } catch (error) {
        if (!active) return;
        toast.error(error.response?.data?.error || 'Could not load artisan profile');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id, toast]);

  if (loading) {
    return (
      user ? (
        <DashboardLayout>
          <div className="artisan-profile-loading">
            <Spinner size={40} />
          </div>
        </DashboardLayout>
      ) : (
        <>
          <Navbar />
          <div className="artisan-profile-loading">
            <Spinner size={40} />
          </div>
        </>
      )
    );
  }

  if (!artisan) {
    return (
      user ? (
        <DashboardLayout>
          <div className="artisan-profile-loading">
            <p>Profile not found.</p>
          </div>
        </DashboardLayout>
      ) : (
        <>
          <Navbar />
          <div className="artisan-profile-loading">
            <p>Profile not found.</p>
          </div>
        </>
      )
    );
  }

  const handleBack = (fallback = '/browse') => {
    if (window.history.length > 2) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };

  const handleBookNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'STUDENT') {
      navigate('/dashboard');
      return;
    }

    navigate(`/bookings/new?artisan=${artisan.id}`);
  };

  const page = <ArtisanProfilePage artisan={artisan} onBack={handleBack} onBookNow={handleBookNow} />;

  return user ? (
    <DashboardLayout>{page}</DashboardLayout>
  ) : (
    <>
      <Navbar />
      {page}
    </>
  );
}
