import express from 'express';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Apartment from '../models/Apartment.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// 1. קונפיגורציית חיבור ל-Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. הגדרת מאחסן Multer ישירות לענן כולל כיווץ ואופטימיזציה אוטומטית של התמונות
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'vacation_apartments', // שם התיקייה בענן שלך
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }] // כיווץ אוטומטי לגודל אופטימלי לדיבוב
    }
});
const upload = multer({ storage });

// הגדרת Nodemailer לשליחת מיילים - השתמש ב-SMTP אמיתי אם קיים, אחרת צור חשבון Ethereal לבדיקה
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tamar@example.com';
let transporter;
let _useEthereal = false;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('נמצא SMTP חיצוני - ישתמש בשליחת מיילים אמיתית');
} else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
    _useEthereal = true;
    console.log('Ethereal account נוצר לשלב הפיתוח:', testAccount.user);
}

// פונקציית עזר ליצירת מערך תאריכים (YYYY-MM-DD) מתוך טווח תאריכים שהמשתמש שלח
const getDatesInRange = (startDateStr, endDateStr) => {
    const dates = [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    while (start <= end) {
        dates.push(start.toISOString().split('T')[0]);
        start.setDate(start.getDate() + 1);
    }
    return dates;
};

// [CREATE] - יצירת דירה חדשה עם העלאת תמונות מרובות לענן (מוגן למשתמשים מחוברים)
router.post('/', protect, upload.array('images', 10), async (req, res) => {
    try {
        let apartmentData = { ...req.body };

        // פרסור אובייקטים מורכבים במידה והגיעו כ-FormData מהפרונטאנד
        if (typeof apartmentData.shabbatEquipment === 'string') apartmentData.shabbatEquipment = JSON.parse(apartmentData.shabbatEquipment);
        if (typeof apartmentData.swapPreferences === 'string') apartmentData.swapPreferences = JSON.parse(apartmentData.swapPreferences);
        if (typeof apartmentData.rules === 'string') apartmentData.rules = JSON.parse(apartmentData.rules);
        if (typeof apartmentData.yardDetails === 'string') apartmentData.yardDetails = JSON.parse(apartmentData.yardDetails);
        if (typeof apartmentData.appliances === 'string') apartmentData.appliances = JSON.parse(apartmentData.appliances);

        // שמירת הקישורים הרשמיים מ-Cloudinary
        if (req.files && req.files.length > 0) {
            const fileUrls = req.files.map(file => file.path); // Cloudinary מחזיר את הקישור המלא ב-path
            apartmentData.images = fileUrls;
            apartmentData.mainImage = fileUrls[0];
        }

        // שיוך אוטומטי של בעל הדירה לפי המשתמש המחובר מהטוקן
        apartmentData.owner = req.user.id;
        apartmentData.ownerEmail = req.user.email;
        apartmentData.isApproved = false; // ברירת מחדל ממתין לאישור מנהל

        const newApartment = new Apartment(apartmentData);
        const savedApartment = await newApartment.save();

        // Emit socket event so clients can refresh gallery in real-time
        try {
            const io = req.app.get('io');
            if (io) io.emit('apartment:created', savedApartment);
        } catch (e) { console.log('Socket emit error (create):', e.message); }

        // שליחת מייל התראה לאדמין
        try {
            const mailOptions = {
                from: '"מערכת בין הזמנים" <no-reply@vacation.com>',
                to: ADMIN_EMAIL,
                subject: `🏠 דירה חדשה ממתינה לאישורך: ${savedApartment.title}`,
                html: `<div style="direction: rtl; text-align: right; font-family: sans-serif;">
                        <h2>שלום תמר, דירה חדשה עלתה למערכת וממתינה לאישור שלך!</h2>
                        <p><b>כותרת:</b> ${savedApartment.title}</p>
                        <p><b>סוג מודעה:</b> ${savedApartment.type}</p>
                        <p><b>מיקום:</b> ${savedApartment.location}, ${savedApartment.neighborhood}</p>
                        <p><b>טלפון בעלים:</b> ${savedApartment.phone}</p>
                        <hr />
                        <p>כדי לאשר את הדירה, כנסי למערכת הניהול שלך באתר.</p>
                       </div>`
            };
            const info = await transporter.sendMail(mailOptions);
            if (_useEthereal) console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            console.log(`✉️ נשלח מייל התראה לאדמין על דירה חדשה`);
        } catch (err) { console.log('מייל לא נשלח:', err.message); }

        res.status(201).json(savedApartment);
    } catch (error) {
        res.status(400).json({ message: 'שגיאה בהוספת הדירה', error: error.message });
    }
});

// when admin approves/rejects, emit socket events too

// [READ ALL] - מנוע החיפוש והסינון המתקדם של האתר (עבור עמוד הבית)
router.get('/', async (req, res) => {
    try {
        const { 
            location, 
            type, 
            minBeds, 
            maxGuests,
            minPrice, 
            maxPrice, 
            kitchenKosher, 
            isShabbatFriendly,
            startDate, // תאריך תחילת חופשה מבוקש (YYYY-MM-DD)
            endDate    // תאריך סיום חופשה מבוקש (YYYY-MM-DD)
        } = req.query;

        // תנאי בסיס: מציגים רק דירות שאושרו על ידי מנהל המערכת
        let queryConditions = { isApproved: true };

        // 1. חיפוש טקסטואלי גמיש לפי עיר / שכונה
        if (location) {
            queryConditions.$or = [
                { location: new RegExp(location, 'i') },
                { neighborhood: new RegExp(location, 'i') }
            ];
        }

        // 2. סינון לפי סוג מודעה (השכרה, החלפה או שניהם)
        if (type && type !== 'both') {
            queryConditions.type = { $in: [type, 'both'] };
        }

        // 3. סינון לפי קיבולת (מיטות ואורחים מקסימליים)
        if (minBeds) {
            queryConditions.beds = { $gte: Number(minBeds) };
        }
        if (maxGuests) {
            queryConditions.maxGuests = { $gte: Number(maxGuests) };
        }

        // 4. סינון לפי טווח מחירים (נכון לדירות השכרה או 'גם וגם')
        if (minPrice || maxPrice) {
            queryConditions.pricePerNight = {};
            if (minPrice) queryConditions.pricePerNight.$gte = Number(minPrice);
            if (maxPrice) queryConditions.pricePerNight.$lte = Number(maxPrice);
        }

        // 5. סינון מותאם למגזר: כשרות ומאפייני שבת
        if (kitchenKosher) {
            queryConditions.kitchenKosher = kitchenKosher;
        }
        if (isShabbatFriendly === 'true') {
            queryConditions['shabbatEquipment.hasHotPlate'] = true;
            queryConditions['shabbatEquipment.hasWaterUrn'] = true;
        }

        // 6. מנוע סינון הזמינות בשילוב הלו"ז והיומן
        if (startDate && endDate) {
            const requestedDates = getDatesInRange(startDate, endDate);
            // שולפים רק דירות ש*אף אחד* מהתאריכים המבוקשים לא נמצא במערך הימים התפוסים שלהן
            queryConditions.bookedDates = { $nin: requestedDates };
        }

        // ביצוע השליפה כולל חיבור נתוני הפרופיל של בעל הנכס
        const apartments = await Apartment.find(queryConditions)
            .populate('owner', 'profile verification')
            .sort({ createdAt: -1 });

        res.json(apartments);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בהפעלת מנוע החיפוש והסינון', error: error.message });
    }
});

// NOTE: dynamic `/:id` routes are registered later to avoid catching static paths

// --- נתיבי ניהול (Admin Endpoints) ---

// קבלת דירות שממתינות לאישור
router.get('/admin/pending', protect, adminOnly, async (req, res) => {
    try {
        const pendingApartments = await Apartment.find({ isApproved: false }).populate('owner', 'profile');
        res.json(pendingApartments);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת הדירות הממתינות', error: error.message });
    }
});

// Admin: get all apartments (including non-approved)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
    try {
        const all = await Apartment.find({}).populate('owner', 'profile verification').sort({ createdAt: -1 });
        res.json(all);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת כל הדירות', error: error.message });
    }
});

// אישור דירה והעלאתה לאוויר
router.put('/:id/approve', protect, adminOnly, async (req, res) => {
    const { subject, message } = req.body; // optional custom subject/message from admin
    try {
        const approvedApartment = await Apartment.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        );

        // שליחת מייל לבעל הדירה על אישור — עם אפשרות להודעה מותאמת
        try {
            const mailSubject = subject || `✅ דירתך אושרה: ${approvedApartment.title}`;
            const mailHtml = message || `<div style="direction: rtl; text-align: right; font-family: sans-serif;">
                        <h2>שלום,</h2>
                        <p>הדירה שלך <b>${approvedApartment.title}</b> אושרה ונוספה למערכת.</p>
                        <p>ניתן לצפות בפרטי המודעה ולשלוח הודעות למתעניינים דרך המערכת.</p>
                        <hr/>
                        <p>תודה, צוות המערכת.</p>
                       </div>`;

            const mailOptions = {
                from: '"מערכת בין הזמנים" <no-reply@vacation.com>',
                to: approvedApartment.ownerEmail,
                subject: mailSubject,
                html: mailHtml
            };
            const info = await transporter.sendMail(mailOptions);
            if (_useEthereal) console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            console.log(`✉️ מייל אישור נשלח ל-${approvedApartment.ownerEmail}`);
        } catch (err) { console.log('שגיאה בשליחת מייל אישור:', err.message); }

        res.json({ message: 'הדירה אושרה בהצלחה וזמינה כעת לקהל הרחב!', approvedApartment });
    } catch (error) {
        res.status(400).json({ message: 'שגיאה באישור הדירה', error: error.message });
    }
});

// emit socket event after approve
router.put('/:id/approve', protect, adminOnly, async (req, res, next) => {
    next();
});

// דחיית דירה (עם סיבת דחייה אופציונלית) וידוע לבעל הדירה
router.put('/:id/reject', protect, adminOnly, async (req, res) => {
    const { reason } = req.body;
    try {
        const apartment = await Apartment.findById(req.params.id);
        if (!apartment) return res.status(404).json({ message: 'הדירה לא נמצאה' });

        apartment.isApproved = false;
        await apartment.save();

        try {
            const mailOptions = {
                from: '"מערכת בין הזמנים" <no-reply@vacation.com>',
                to: apartment.ownerEmail,
                subject: `❌ דירתך נדחתה: ${apartment.title}`,
                html: `<div style="direction: rtl; text-align: right; font-family: sans-serif;">
                        <h2>שלום,</h2>
                        <p>הדירה שלך <b>${apartment.title}</b> נדחתה על ידי המנהל.</p>
                        ${reason ? `<p><b>סיבת הדחיה:</b> ${reason}</p>` : ''}
                        <p>ניתן לעדכן את פרטי המודעה ולשלוח שוב לאישור דרך המערכת.</p>
                        <hr/>
                        <p>תודה, צוות המערכת.</p>
                       </div>`
            };
            const info = await transporter.sendMail(mailOptions);
            if (_useEthereal) console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            console.log(`✉️ מייל דחייה נשלח ל-${apartment.ownerEmail}`);
        } catch (err) { console.log('שגיאה בשליחת מייל דחייה:', err.message); }

        res.json({ message: 'הדירה נדחתה והבעלים עודכן באמצעות מייל.', apartment });
    } catch (error) {
        res.status(400).json({ message: 'שגיאה בדחיית הדירה', error: error.message });
    }
});
router.post('/seed-test-apartment', async (req, res) => {
    try {
        const testApartment = new Apartment({
            title: "דירה ראשונה במערכת",
            description: "דירת בדיקה שהוספנו דרך הפוסטמן",
            type: "both",
            location: "ירושלים",
            neighborhood: "מרכז העיר",
            street: "יפו 1",
            floor: "1",
            rooms: 3,
            beds: 3,
            maxGuests: 4,
            ac: "all",
            kitchenKosher: "mehadrin",
            parking: "none",
            pricePerNight: 400,
            phone: "0501234567",
            // יצירת ID תקין בתוך הקוד
            owner: new mongoose.Types.ObjectId("507f1f1c8b9d4b0003e38721"), 
            ownerEmail: "test@test.com",
            isApproved: true, // <--- תוסיפי את השורה הזו כאן
            rules: {
                smoking: "forbidden"
            }
        });
        
        await testApartment.save();
        res.status(201).json({ message: "הדירה נוצרה בהצלחה!", apartment: testApartment });
    } catch (error) {
        res.status(500).json({ message: "שגיאה ביצירת הדירה", error: error.message });
    }
});

// נקודת קצה לזיהוי בדיקה - יוצרת דירה שממתינה לאישור על מנת לבדוק את זרימת האדמין
router.post('/seed-pending-apartment', async (req, res) => {
    try {
        const testApartment = new Apartment({
            title: "דירת בדיקה לממתינים",
            description: "דירה שנוצרה לבדיקה - ממתינה לאישור אדמין",
            type: "rent",
            location: "תל אביב",
            neighborhood: "מרכז",
            street: "הרצל 10",
            floor: "2",
            rooms: 2,
            beds: 2,
            maxGuests: 4,
            ac: "all",
            kitchenKosher: "mehadrin",
            parking: "none",
            pricePerNight: 300,
            phone: "0500000000",
            owner: new mongoose.Types.ObjectId(),
            ownerEmail: req.body.ownerEmail || 'owner@example.com',
            isApproved: false,
            rules: { smoking: 'forbidden' }
        });

        await testApartment.save();
        res.status(201).json({ message: 'דירת בדיקה נוצרה וממתינה לאישור', apartment: testApartment });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה ביצירת דירת בדיקה', error: error.message });
    }
});
// [READ MY APARTMENTS] - שליפת דירות של המשתמש המחובר בלבד
router.get('/my-apartments', protect, async (req, res) => {
    try {
        const myApartments = await Apartment.find({ owner: req.user.id });
        res.json(myApartments);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת הדירות שלך', error: error.message });
    }
});

// --- Dynamic ID-based routes (registered after static/admin routes)

// [READ ONE] - קבלת פרטי דירה ספציפית לפי מזהה (עבור עמוד כרטיס דירה מורחב)
router.get('/:id', async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.params.id).populate('owner', 'profile verification');
        if (!apartment) return res.status(404).json({ message: 'הדירה לא נמצאה במערכת' });
        res.json(apartment);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת פרטי הדירה', error: error.message });
    }
});

// [UPDATE] - עדכון נתוני דירה (מוגן: רק בעל הנכס יכול לערוך!)
router.put('/:id', protect, upload.array('images', 10), async (req, res) => {
    try {
        let apartment = await Apartment.findById(req.params.id);
        if (!apartment) return res.status(404).json({ message: 'הדירה לא נמצאה' });

        // בדיקה אבטחתית: האם המשתמש שמנסה לערוך הוא אכן בעל הנכס?
        // מתיר גם למנהלים לערוך כל דירה
        if (apartment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין לך הרשאה לערוך נכס זה, אינך בעל הדירה' });
        }

        let updateData = { ...req.body };

        // פרסור אובייקטים מורכבים במידה ועודכנו
        if (typeof updateData.shabbatEquipment === 'string') updateData.shabbatEquipment = JSON.parse(updateData.shabbatEquipment);
        if (typeof updateData.swapPreferences === 'string') updateData.swapPreferences = JSON.parse(updateData.swapPreferences);
        if (typeof updateData.rules === 'string') updateData.rules = JSON.parse(updateData.rules);
        if (typeof updateData.yardDetails === 'string') updateData.yardDetails = JSON.parse(updateData.yardDetails);
        if (typeof updateData.appliances === 'string') updateData.appliances = JSON.parse(updateData.appliances);

        // אם הועלו תמונות חדשות, נצרף אותן או נחליף
        if (req.files && req.files.length > 0) {
            const fileUrls = req.files.map(file => file.path);
            updateData.images = fileUrls;
            updateData.mainImage = fileUrls[0];
        }

        // שמור על סטטוס האישור הקיים — אל תחזיר את הדירה לבדיקה מחדש אם היא כבר מאושרת.
        // גם נמנע מהלקוח לשנות את שדה `isApproved` ישירות.
        const wasApproved = apartment.isApproved;
        if ('isApproved' in updateData) delete updateData.isApproved;

        const updatedApartment = await Apartment.findByIdAndUpdate(
            req.params.id,
            { ...updateData, isApproved: wasApproved },
            { new: true }
        );
        res.json({ message: 'הדירה עודכנה בהצלחה וממתינה לאישור מחדש!', updatedApartment });
    } catch (error) {
        res.status(400).json({ message: 'שגיאה בעדכון הדירה', error: error.message });
    }
});

// [DELETE] - מחיקת דירה (מוגן: רק בעל הנכס או אדמין יכולים למחוק!)
router.delete('/:id', protect, async (req, res) => {
    try {
        const apartment = await Apartment.findById(req.params.id);
        if (!apartment) return res.status(404).json({ message: 'הדירה לא נמצאה' });

        // אישור מחיקה רק אם הוא הבעלים או שהוא מנהל מערכת
        if (apartment.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'אין לך הרשאה למחוק דירה זו' });
        }

        await Apartment.findByIdAndDelete(req.params.id);
        res.json({ message: 'הדירה נמחקה בהצלחה מהמערכת!' });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה במחיקת הדירה', error: error.message });
    }
});
export default router;