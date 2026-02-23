import express from 'express';
import {
  createMenuItem,
  getAllMenuItems,
  getMenuItemsByCategory,
  toggleAvailability,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllMenuItems);
router.get('/category/:category', getMenuItemsByCategory);
router.post('/', protect, admin, createMenuItem);
router.put('/:id', protect, admin, updateMenuItem);
router.put('/:id/toggle', protect, admin, toggleAvailability);
router.delete('/:id', protect, admin, deleteMenuItem);

export default router;
