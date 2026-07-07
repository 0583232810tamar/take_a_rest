import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_1234';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_refresh_secret_key_5678';

// הגדרת מאחסן קבצים עבור מסמכי אימות (תעודות זהות)
if (!fs.existsSync('./uploads/verification')) {
    fs.mkdirSync('./uploads/verification', { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/verification/'),
    filename: (req, file, cb) => cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// פונקציות עזר לייצור טוקנים
const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email, role: user.role, isAdmin: !!user.isAdmin }, JWT_SECRET, { expiresIn: '15m' }); // תוקף קצר לביטחון
};
const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' }); // תוקף ארוך
};

// 1. רישום משתמש (Register)
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'כתובת האיมייל הזו כבר רשומה במערכת' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
            profile: { fullName, phone }
        });

        await newUser.save();
        res.status(201).json({ message: 'המשתמש נרשם בהצלחה!' });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בתהליך ההרשמה', error: error.message });
    }
});

// 2. התחברות (Login) - מחזיר את שני סוגי הטוקנים
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'אימייל או סיסמה שגויים' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'אימייל או סיסמה שגויים' });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // שמירת ה-Refresh Token במסד הנתונים
        user.refreshToken = refreshToken;
        await user.save();

        // החזרת השדות גם בשם `token` כדי שתאימות לאחסון הלקוח (client) תעבוד
        res.json({
            accessToken,
            token: accessToken,
            refreshToken,
            user: { id: user._id, email: user.email, role: user.role, profile: user.profile, verification: user.verification }
        });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בתהליך ההתחברות', error: error.message });
    }
});

// 3. מנגנון רענון טוקנים (Refresh Token Endpoint)
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'חסר Refresh Token' });

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: 'Refresh Token אינו תקף או שפג תוקפו' });
        }

        // הנפקת Access Token חדש לחלוטין
        const newAccessToken = generateAccessToken(user);
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(403).json({ message: 'טוקן לא תקין', error: error.message });
    }
});

// 4. העלאת צילום תעודה מזהה לאימות (Verification Upload)
router.post('/upload-id', protect, upload.single('idDocument'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'נא לצרף קובץ תמונה' });

        const user = await User.findById(req.user.id);
        user.verification.idDocumentUrl = `/uploads/verification/${req.file.filename}`;
        user.verification.status = 'pending'; // ממתין לבדיקת אדמין
        
        await user.save();
        res.json({ message: 'תעודת הזהות הועלתה בהצלחה וממתינה לאישור מנהל.', status: 'pending' });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בהעלאת התעודה', error: error.message });
    }
});

// 5. עדכון פרטי פרופיל (מאוחד ל-Host ו-Guest)
router.put('/profile', protect, async (req, res) => {
    try {
        const { fullName, phone, bio, avatar } = req.body;
        const user = await User.findById(req.user.id);

        if (fullName) user.profile.fullName = fullName;
        if (phone) user.profile.phone = phone;
        if (bio) user.profile.bio = bio;
        if (avatar) user.profile.avatar = avatar;

        await user.save();
        res.json({ message: 'הפרופיל עודכן בהצלחה!', profile: user.profile });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון הפרופיל', error: error.message });
    }
});

// 6. [ניהול מנהל] - קבלת רשימת המשתמשים הממתינים לאימות תעודה
router.get('/admin/pending-verifications', protect, adminOnly, async (req, res) => {
    try {
        const pendingUsers = await User.find({ 'verification.status': 'pending' }, '-password');
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בשליפת המשתמשים', error: error.message });
    }
});

// 7. [ניהול מנהל] - אישור או דחיית אימות של משתמש
router.put('/admin/verify-user/:id', protect, adminOnly, async (req, res) => {
    const { status } = req.body; // 'verified' או 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'סטטוס לא תקין' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });

        user.verification.status = status;
        user.verification.isIdVerified = status === 'verified';
        
        await user.save();
        res.json({ message: `סטטוס האימות של המשתמש עודכן ל-${status} בהצלחה!` });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון סטטוס האימות', error: error.message });
    }
});
// נתיב זמני להפיכת משתמש למנהל
router.post('/make-admin', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOneAndUpdate(
            { email: email }, 
            { role: 'admin' }, 
            { new: true }
        );
        
        if (!user) return res.status(404).json({ message: 'משתמש לא נמצא' });
        
        res.json({ message: `המשתמש ${email} עודכן למנהל בהצלחה!`, user });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון', error: error.message });
    }
});
export default router;