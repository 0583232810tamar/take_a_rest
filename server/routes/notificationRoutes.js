import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. קבלת כל ההתראות של המשתמש המחובר (התראות שלא נקראו יופיעו ראשונות)
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50); // החזרת 50 ההתראות האחרונות
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת ההתראות', error: error.message });
    }
});

// 2. סימון התראה ספציפית כנקראה
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'ההתראה לא נמצאה או שאינה שייכת לך' });
        res.json({ message: 'ההתראה סומנה כנקראה', notification });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון ההתראה', error: error.message });
    }
});

// 3. סימון כל ההתראות של המשתמש כנקראו בבת אחת
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'כל ההתראות סומנו כנקראו בהצלחה' });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון כל ההתראות', error: error.message });
    }
});

export default router;