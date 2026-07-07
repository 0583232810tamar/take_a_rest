import express from 'express';
import Message from '../models/Message.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. קבלת היסטוריית הודעות עבור חדר צ'אט ספציפי (כולל פגינציה לעבודה מהירה)
router.get('/history/:chatRoom', protect, async (req, res) => {
    try {
        const { chatRoom } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;

        // שליפת ההודעות בצורה הפוכה (מהחדש לישן) כדי לתמוך בגלילה למעלה
        const messages = await Message.find({ chatRoom })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('sender receiver', 'profile.fullName profile.avatar');

        res.json(messages.reverse()); // מחזירים בסדר כרונולוגי נכון לתצוגה בפרונט
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת היסטוריית ההודעות', error: error.message });
    }
});

// 2. קבלת כל הליסט של הצ'אטים הפעילים של המשתמש המחובר (עבור תיבת הדואר הנכנס)
router.get('/my-chats', protect, async (req, res) => {
    try {
        // מוצאים את כל ההודעות הייחודיות שבהן המשתמש מעורב
        const chats = await Message.aggregate([
            { $match: { $or: [{ sender: req.user.id }, { receiver: req.user.id }] } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$chatRoom",
                    lastMessage: { $first: "$text" },
                    createdAt: { $first: "$createdAt" },
                    apartment: { $first: "$apartment" },
                    sender: { $first: "$sender" },
                    receiver: { $first: "$receiver" }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        // ביצוע Populate ידני על התוצאות האגרגטיביות
        const populatedChats = await Message.populate(chats, [
            { path: 'apartment', select: 'title mainImage' },
            { path: 'sender receiver', select: 'profile.fullName profile.avatar' }
        ]);

        res.json(populatedChats);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת רשימת השיחות', error: error.message });
    }
});

export default router;