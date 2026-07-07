import express from 'express';
import mongoose from 'mongoose';
import Apartment from '../models/Apartment.js';
import Booking from '../models/Booking.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 📅 הגדרת תאריכי הגבול של בין הזמנים (לדוגמה עבור הקיץ הנוכחי)
// בקליינט נציג להם רק את הטווח הזה, ובשרת נבצע אכיפה קשיחה
const START_BEIN_HAZMANIM = "2026-07-15"; // א' באב (תאריך משוערך לצורך הדוגמה)
const END_BEIN_HAZMANIM = "2026-08-13";   // כ"ט באב

// 1. יצירת חסימת תאריכים / הזמנה (כולל בדיקת טווח בין הזמנים והגנת דאבל-בוקינג)
router.post('/', protect, async (req, res) => {
    const { apartmentId, dates, bookingType } = req.body; // dates: ["2026-07-20", "2026-07-21"]
    
    if (!apartmentId || !dates || dates.length === 0 || !bookingType) {
        return res.status(400).json({ message: 'נתונים חסרים לביצוע החסימה' });
    }

    // 🔥 בדיקת אבטחה מותאמת: האם כל התאריכים המבוקשים נמצאים בתוך שלושת השבועות של בין הזמנים?
    const isOutOfRange = dates.some(date => date < START_BEIN_HAZMANIM || date > END_BEIN_HAZMANIM);
    if (isOutOfRange) {
        return res.status(400).json({ 
            message: `שגיאה: ניתן להזמין או לחסום תאריכים אך ורק בתוך תקופת בין הזמנים (${START_BEIN_HAZMANIM} עד ${END_BEIN_HAZMANIM})` 
        });
    }

    // פתיחת Session לביצוע טרנזקציה אטומית ב-MongoDB
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const apartment = await Apartment.findById(apartmentId).session(session);
        if (!apartment) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'הדירה לא נמצאה' });
        }

        // בדיקה האם אחד מהתאריכים המבוקשים כבר תפוס בנכס
        const isAlreadyBooked = dates.some(date => apartment.bookedDates.includes(date));
        if (isAlreadyBooked) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'אחד או יותר מהתאריכים שבחרת כבר נתפסו בשניות אלו ממש.' });
        }

        // יצירת מסמך ההזמנה ב-DB
        const newBooking = new Booking({
            apartment: apartmentId,
            guest: req.user.id,
            dates,
            bookingType
        });
        await newBooking.save({ session });

        // דחיפת התאריכים החדשים למערך הכללי של הדירה ושמירה
        apartment.bookedDates.push(...dates);
        await apartment.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: 'התאריכים נחסמו בהצלחה ביומן של בין הזמנים!', booking: newBooking });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'שגיאה במערכת בעת חסימת התאריכים', error: error.message });
    }
});

// 2. ביטול הזמנה / שחרור תאריכים ביומן
router.delete('/:id', protect, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await Booking.findById(req.params.id).session(session);
        if (!booking) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'ההזמנה לא נמצאה' });
        }

        const apartment = await Apartment.findById(booking.apartment).session(session);
        if (!apartment) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'הדירה המשויכת לא נמצאה' });
        }

        if (booking.guest.toString() !== req.user.id && apartment.owner.toString() !== req.user.id) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'אין לך הרשאה לבטל חסימה זו' });
        }

        // הסרת התאריכים המבוטלים ממערך הדירה
        apartment.bookedDates = apartment.bookedDates.filter(date => !booking.dates.includes(date));
        await apartment.save({ session });

        await Booking.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        session.endSession();

        res.json({ message: 'ההזמנה בוטלה והתאריכים שוחררו בהצלחה!' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'שגיאה בביטול ההזמנה', error: error.message });
    }
});

// 3. ייצוא יומן הדירה בפורמט iCal
router.get('/:apartmentId/ical', async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.params.apartmentId);
        if (!apartment) return res.status(404).json({ message: 'דירה לא נמצאה' });

        let icalContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//VacationSwap//NONSGML v1.0//HE\n`;
        const bookings = await Booking.find({ apartment: apartment._id, status: 'confirmed' });
        
        bookings.forEach((b) => {
            if(b.dates.length > 0) {
                const startDate = b.dates[0].replace(/-/g, '');
                const endDate = b.dates[b.dates.length - 1].replace(/-/g, '');
                
                icalContent += `BEGIN:VEVENT\n`;
                icalContent += `UID:${b._id}@vacationswap.com\n`;
                icalContent += `DTSTART;VALUE=DATE:${startDate}\n`;
                icalContent += `DTEND;VALUE=DATE:${endDate}\n`;
                icalContent += `SUMMARY:תפוס - בין הזמנים\n`;
                icalContent += `END:VEVENT\n`;
            }
        });

        icalContent += `END:VCALENDAR`;

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="calendar-${apartment._id}.ics"`);
        return res.send(icalContent);

    } catch (error) {
        res.status(500).json({ message: 'שגיאה בהפקת קובץ iCal', error: error.message });
    }
});

export default router;