import db from '../config/database.js';

const SERVICE_CATEGORIES = [
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

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const serializeArtisan = (artisan, withDistance = false, origin = null) => {
  const payload = {
    id: artisan.id,
    firstName: artisan.firstName,
    lastName: artisan.lastName,
    fullName: `${artisan.firstName} ${artisan.lastName}`.trim(),
    avatarUrl: artisan.avatarUrl,
    bio: artisan.bio,
    category: artisan.category,
    address: artisan.address,
    startingPrice: artisan.startingPrice,
    yearsExp: artisan.yearsExp,
    isAvailable: artisan.isAvailable,
    averageRating: artisan.averageRating,
    totalReviews: artisan.totalReviews,
    totalJobs: artisan.totalJobs,
    lat: artisan.lat,
    lng: artisan.lng,
  };

  if (withDistance && origin && artisan.lat != null && artisan.lng != null) {
    payload.distanceKm = Number(haversineKm(origin.lat, origin.lng, artisan.lat, artisan.lng).toFixed(2));
  }

  return payload;
};

export const listArtisans = async (req, res) => {
  try {
    const {
      category,
      minRating,
      maxPrice,
      search,
      isAvailable,
      sortBy,
      page,
      limit,
      lat,
      lng,
    } = req.validatedQuery || req.query;

    const where = {
      ...(typeof isAvailable === 'boolean' ? { isAvailable } : {}),
      ...(category ? { category } : {}),
      ...(typeof minRating === 'number' ? { averageRating: { gte: minRating } } : {}),
      ...(typeof maxPrice === 'number' ? { startingPrice: { lte: maxPrice } } : {}),
      ...(search
        ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { bio: { contains: search, mode: 'insensitive' } },
          ],
        }
        : {}),
    };

    const safePage = Math.max(1, toNumber(page, 1));
    const safeLimit = Math.min(50, Math.max(1, toNumber(limit, 12)));
    const skip = (safePage - 1) * safeLimit;

    const useDistanceSort = sortBy === 'distance' && typeof lat === 'number' && typeof lng === 'number';

    if (useDistanceSort) {
      const raw = await db.artisanProfile.findMany({
        where,
      });

      const origin = { lat, lng };

      const sorted = raw
        .map((artisan) => serializeArtisan(artisan, true, origin))
        .sort((a, b) => {
          if (a.distanceKm == null && b.distanceKm == null) return 0;
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });

      const items = sorted.slice(skip, skip + safeLimit);
      const total = sorted.length;

      return res.json({
        items,
        pagination: {
          total,
          page: safePage,
          limit: safeLimit,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
          hasNext: skip + safeLimit < total,
        },
      });
    }

    const orderBy =
      sortBy === 'price'
        ? [{ startingPrice: 'asc' }]
        : sortBy === 'newest'
          ? [{ createdAt: 'desc' }]
          : [{ averageRating: 'desc' }, { totalReviews: 'desc' }];

    const [rows, total] = await Promise.all([
      db.artisanProfile.findMany({
        where,
        orderBy,
        skip,
        take: safeLimit,
      }),
      db.artisanProfile.count({ where }),
    ]);

    const items = rows.map((artisan) => serializeArtisan(artisan));

    return res.json({
      items,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        hasNext: skip + safeLimit < total,
      },
    });
  } catch (error) {
    console.error('List artisans error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getArtisan = async (req, res) => {
  try {
    const artisanId = req.validatedParams?.id || req.params.id;
    const artisan = await db.artisanProfile.findUnique({
      where: { id: artisanId },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!artisan) {
      return res.status(404).json({ error: 'Artisan not found' });
    }

    const data = serializeArtisan(artisan);
    data.reviews = artisan.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      student: {
        firstName: review.student.firstName,
        lastName: review.student.lastName,
        fullName: `${review.student.firstName} ${review.student.lastName}`.trim(),
        avatarUrl: review.student.avatarUrl,
      },
    }));

    return res.json({ artisan: data });
  } catch (error) {
    console.error('Get artisan error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const serviceCategories = SERVICE_CATEGORIES;
