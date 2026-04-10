import { Router } from 'express';

const router = Router();

router.all('*', (req, res) => {
  res.status(501).json({ message: 'Artisan routes — Not implemented yet' });
});

export default router;
