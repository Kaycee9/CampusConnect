import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Navigation } from 'lucide-react';
import ArtisanCard from '../../components/artisan/ArtisanCard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Button from '../../components/ui/Button.jsx';
import api from '../../lib/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import './Browse.css';

const CATEGORIES = [
  'ALL',
  'PLUMBING',
  'ELECTRICAL',
  'PAINTING',
  'CARPENTRY',
  'CLEANING',
  'TAILORING',
  'BARBING',
  'WELDING',
  'MECHANICS',
  'TECH_REPAIR',
  'OTHER',
];

export default function Browse() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [minRating, setMinRating] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(t);
  }, [searchInput]);

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: 12,
      sortBy,
    };

    if (category !== 'ALL') params.category = category;
    if (search) params.search = search;
    if (minRating !== '') params.minRating = Number(minRating);
    if (maxPrice !== '') params.maxPrice = Number(maxPrice);
    if (sortBy === 'distance' && coords) {
      params.lat = coords.lat;
      params.lng = coords.lng;
    }

    return params;
  }, [category, search, minRating, maxPrice, sortBy, page, coords]);

  useEffect(() => {
    let active = true;

    const fetchArtisans = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/artisans', { params: queryParams });
        if (!active) return;
        setItems(data.items || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0, hasNext: false });
      } catch (error) {
        if (!active) return;
        toast.error(error.response?.data?.error || 'Could not load artisans');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchArtisans();

    return () => {
      active = false;
    };
  }, [queryParams, toast]);

  const requestLocationSort = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy('distance');
        setPage(1);
      },
      () => toast.error('Could not access your location')
    );
  };

  return (
    <section className="browse-page animate-fade-in">
      <div className="browse-hero">
        <div>
          <h1>Find trusted artisans around campus</h1>
          <p>Compare ratings, response quality, and pricing before you book.</p>
        </div>
        <Button variant="secondary" onClick={requestLocationSort} icon={Navigation}>
          Sort by distance
        </Button>
      </div>

      <div className="browse-filters card">
        <div className="browse-search">
          <Search size={18} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or service"
          />
        </div>

        <div className="browse-controls">
          <label>
            <span>Category</span>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              {CATEGORIES.map((cat) => (
                <option value={cat} key={cat}>
                  {cat === 'ALL' ? 'All services' : cat.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Min rating</span>
            <select value={minRating} onChange={(e) => { setMinRating(e.target.value); setPage(1); }}>
              <option value="">Any</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
            </select>
          </label>

          <label>
            <span>Max price (NGN)</span>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              placeholder="No limit"
            />
          </label>

          <label>
            <span>Sort by</span>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
              <option value="rating">Top rated</option>
              <option value="price">Lowest price</option>
              <option value="newest">Newest</option>
              <option value="distance">Distance</option>
            </select>
          </label>
        </div>
      </div>

      <div className="browse-results-head">
        <p>{pagination.total || 0} artisans found</p>
        <span><SlidersHorizontal size={14} /> Filtered results</span>
      </div>

      {loading ? (
        <div className="browse-loading">
          <Spinner size={36} />
        </div>
      ) : items.length === 0 ? (
        <div className="browse-empty card">
          <h3>No artisans matched your filters</h3>
          <p>Try removing one filter or switching to a broader category.</p>
        </div>
      ) : (
        <>
          <div className="browse-grid">
            {items.map((artisan) => (
              <ArtisanCard artisan={artisan} key={artisan.id} />
            ))}
          </div>

          <div className="browse-pagination">
            <Button
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <p>Page {pagination.page || 1} of {pagination.totalPages || 1}</p>
            <Button
              variant="ghost"
              disabled={!pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
