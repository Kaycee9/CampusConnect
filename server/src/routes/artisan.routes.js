import { Router } from 'express';
import { z } from 'zod';
import validate from '../middleware/validate.js';
import { listArtisans, getArtisan, serviceCategories } from '../controllers/artisan.controller.js';

const router = Router();

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : value;
};

const parseBoolean = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
};

const listSchema = z.object({
  category: z.enum(serviceCategories).optional(),
  minRating: z.preprocess(parseNumber, z.number().min(0).max(5).optional()),
  maxPrice: z.preprocess(parseNumber, z.number().positive().optional()),
  search: z.string().trim().optional(),
  isAvailable: z.preprocess(parseBoolean, z.boolean().optional().default(true)),
  sortBy: z.enum(['rating', 'price', 'distance', 'newest']).optional().default('rating'),
  page: z.preprocess(parseNumber, z.number().int().min(1).optional().default(1)),
  limit: z.preprocess(parseNumber, z.number().int().min(1).max(50).optional().default(12)),
  lat: z.preprocess(parseNumber, z.number().min(-90).max(90).optional()),
  lng: z.preprocess(parseNumber, z.number().min(-180).max(180).optional()),
});

const paramsSchema = z.object({
  id: z.string().min(1, 'Artisan ID is required'),
});

router.get('/', validate(listSchema, 'query'), listArtisans);
router.get('/:id', validate(paramsSchema, 'params'), getArtisan);

export default router;
