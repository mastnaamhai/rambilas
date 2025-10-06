import express, { Request, Response } from 'express';
import { resetData, backupData, restoreData } from '../controllers/dataController';
import expressAsyncHandler from 'express-async-handler';
import NumberingConfig from '../models/numbering';

const router = express.Router();

// @desc    Reset all application data
// @route   POST /api/data/reset
router.post('/reset', resetData);

// @desc    Backup all application data
// @route   GET /api/data/backup
router.get('/backup', backupData);

// @desc    Restore application data from a backup
// @route   POST /api/data/restore
router.post('/restore', restoreData);

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Data routes are working', timestamp: new Date().toISOString() });
});

// Numbering config endpoints - simplified version
router.get('/numbering', async (req: Request, res: Response) => {
  try {
    const items = await NumberingConfig.find({});
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching numbering configs' });
  }
});

router.post('/numbering', async (req: Request, res: Response) => {
  try {
    const { type, prefix, startNumber, endNumber, allowOutsideRange } = req.body;
    if (!type || !prefix || typeof startNumber !== 'number' || typeof endNumber !== 'number' || startNumber > endNumber) {
      res.status(400).json({ message: 'Invalid numbering configuration payload' });
      return;
    }
    const existing = await NumberingConfig.findOne({ type });
    if (existing) {
      existing.prefix = prefix;
      existing.startNumber = startNumber;
      existing.endNumber = endNumber;
      existing.allowOutsideRange = !!allowOutsideRange;
      // If current number is outside new range, reset to start
      if (existing.currentNumber < startNumber) {
        existing.currentNumber = startNumber;
      } else if (existing.currentNumber > endNumber && !allowOutsideRange) {
        existing.currentNumber = startNumber;
      }
      await existing.save();
      res.json(existing);
      return;
    }
    const created = await NumberingConfig.create({ 
      type, 
      prefix, 
      startNumber, 
      endNumber, 
      currentNumber: startNumber, 
      allowOutsideRange: !!allowOutsideRange 
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Error saving numbering config' });
  }
});

export default router;
