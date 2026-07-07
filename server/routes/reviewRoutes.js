import express from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Apartment from '../models/Apartment.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. הוספת ביקורת חדשה (עם הגנה ובדיקת תוקף השהות)
router.post('/', protect, async (req, res) => {
    const { bookingId, rating, comment, reviewType } = req.body;

    if (!bookingId || !rating || !comment || !reviewType) {
        return res.status(400).json({ message: 'כל השדות הם חובה' });
    }

    try {
        // א. שליפת ההזמנה הרלוונטית
        const booking = await Booking.findById(bookingId).populate('apartment');
        if (!booking) return res.status(404).json({ message: 'ההזמנה לא נמצאה' });

        // ב. בדיקת הגנה 1: האם ההזמנה מאושרת?
        if (booking.status !== 'confirmed') {
            return res.status(400).json({ message: 'ניתן להשאיר ביקורת אך ורק על שהות שסוכמה ואושרה במערכת' });
        }

        // ג. בדיקת הגנה 2: האם תאריך השהות הסתיים בפועל?
        const todayStr = new Date().toISOString().split('T')[0];
        // לוקחים את התאריך האחרון במערך התאריכים של החסימה
        const lastBookingDate = booking.dates[booking.dates.length - 1]; 
        
        if (todayStr <= lastBookingDate) {
            return res.status(400).json({ message: 'מנגנון אבטחה: לא ניתן להשאיר חוות דעת לפני שהשהות הסתיימה בפועל' });
        }

        // ד. הגדרת יעד הביקורת (Target) ובדיקת הרשאות כותב
        let targetUser;
        if (reviewType === 'property') {
            // ביקורת על הנכס - הכותב חייב להיות האורח (guest)
            if (booking.guest.toString() !== req.user.id) {
                return res.status(403).json({ message: 'רק האורח ששהה בנכס יכול להעריך אותו' });
            }
            targetUser = booking.apartment.owner;
        } else {
            // ביקורת על האורח - הכותב חייב להיות בעל הדירה (owner)
            if (booking.apartment.owner.toString() !== req.user.id) {
                return res.status(403).json({ message: 'רק בעל הדירה יכול להשאיר חוות דעת על האורח שלו' });
            }
            targetUser = booking.guest;
        }

        // ה. יצירת ושמירת הביקורת
        const newReview = new Review({
            apartment: booking.apartment._id,
            booking: bookingId,
            author: req.user.id,
            targetUser,
            reviewType,
            rating: Number(rating),
            comment
        });

        await newReview.save();

        // ו. 📈 עדכון אוטומטי של ממוצע הדירוגים של הדירה (אם זו ביקורת נכס)
        if (reviewType === 'property') {
            const reviews = await Review.find({ apartment: booking.apartment._id, reviewType: 'property' });
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            
            await Apartment.findByIdAndUpdate(booking.apartment._id, { 
                averageRating: avgRating.toFixed(1) 
            });
        }

        res.status(201).json({ message: 'חוות הדעת נשמרה בהצלחה!', review: newReview });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'כבר הגשת חוות דעת עבור עסקה זו' });
        }
        res.status(500).json({ message: 'שגיאה בהוספת חוות הדעת', error: error.message });
    }
});

// 2. קבלת כל הביקורות של דירה ספציפית
router.get('/apartment/:apartmentId', async (req, res) => {
    try {
        const reviews = await Review.find({ apartment: req.params.apartmentId, reviewType: 'property' })
            .populate('author', 'profile.fullName profile.avatar')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת הביקורות של הדירה', error: error.message });
    }
});

// 3. קבלת כל הביקורות שנכתבו על משתמש מסוים כאורח (Guest Reviews)
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ targetUser: req.params.userId, reviewType: 'guest' })
            .populate('author', 'profile.fullName profile.avatar')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת ביקורות המשתמש', error: error.message });
    }
});

export default router;