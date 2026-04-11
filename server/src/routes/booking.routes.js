import { Router } from 'express';

const router = Router();

router.use((req, res) => {
  res.status(501).json({ message: 'Booking routes — Not implemented yet' });
});

export default router;
