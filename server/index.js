import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import path from 'path';

// ייבוא הראוטים של המערכת
import authRoutes from './routes/authRoutes.js';
import apartmentRoutes from './routes/apartmentRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import swapRoutes from './routes/swapRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// ייבוא מודל ההודעות לצורך שמירה אוטומטית בזמן אמת
import Message from './models/Message.js';

dotenv.config();

const app = express();
// לאפשר אמון בפרוקסי (אם מריצים במכונה מקומית או דוקר)
app.set('trust proxy', true);

// --- 🛡️ שכבות הגנה ואבטחה ממתקפות (Security Middlewares) ---

// 1. Helmet - הגנה על כותרי ה-HTTP (Headers) ומניעת חשיפת מידע טכנולוגי על השרת
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);

// 2. XSS Clean - הגנה מפני הזרקות קוד זדוני (Cross-Site Scripting) בתוך ה-Body או ה-Query
app.use(xss());

// 3. הגבלת כמות הבקשות הכללית (Rate Limiter) - מניעת מתקפות DDoS והצפת שרתים
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // חלון זמן של 15 דקות
    // בפיתוח נרשה יותר בקשות מ-localhost כדי שלא נחסם בעת בדיקות אוטומטיות
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    // דלג על המגבלה עבור בקשות מה־localhost (כולל IPv6 ::1)
    skip: (req) => {
        const ip = (req.ip || (req.connection && req.connection.remoteAddress) || '').toString();
        // לדאוג שכל סוגי localhost ייחשבו כדלג (כולל ::ffff:127.0.0.1)
        if (!ip) return false;
        if (ip === '::1' || ip === '127.0.0.1') return true;
        if (ip.includes('127.0.0.1') || ip.includes('::1')) return true;
        if (req.hostname && req.hostname === 'localhost') return true;
        return false;
    },
    message: { message: 'זוהו בקשות רבות מדי מהמחשב שלך. נא להמתין 15 דקות ולנסות שוב.' }
});
app.use('/api/', generalLimiter);

// 4. הגבלת קצב מחמירה במיוחד לראוטים רגישים (כמו התחברות ורישום) למניעת Brute Force
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // חלון זמן של שעה
    max: 15, // מקסימום 15 ניסיונות בשעה
    message: { message: 'יותר מדי ניסיונות התחברות/הרשמה בוצעו. החשבון ננעל זמנית לשעה.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// קונפיגורציית CORS ופארסר מובנה
app.use(cors());
app.use(express.json({ limit: '10kb' })); // הגבלת גודל ה-Body ל-10 קילובייט למניעת קריסת זיכרון השרת
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ניטור בקשות סטטיות ל-/uploads לצורך דיבאג טעינת תמונות
app.use((req, res, next) => {
    if (req.path && req.path.startsWith('/uploads')) {
        try {
            const fileOnDisk = path.join(process.cwd(), req.path);
            const exists = fs.existsSync(fileOnDisk);
            console.log(`[static-check] ${req.method} ${req.path} -> exists: ${exists}`);
            if (!exists) console.warn(`[static-missing] requested file not found on disk: ${fileOnDisk}`);
        } catch (e) {
            console.error('static-check error', e.message);
        }
    }
    next();
});

// חשיפה של קבצים סטטיים מ-uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// מחזיר שגיאות תמיד בפורמט JSON במקום HTML כדי שהלקוח יוכל לפרש אותן
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Server Error', error: err.stack ? String(err.stack) : undefined });
});

// --- 🔀 חיבור נתיבי ה-API של האתר ---
app.use('/api/auth', authRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);

// יצירת שרת HTTP משולב עבור ה-WebSockets
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// expose io to routes via app.locals
app.set('io', io);

// --- 🔌 לוגיקת צ'אט בזמן אמת (Socket.io Engine) ---
io.on('connection', (socket) => {
    console.log(`🔌 משתמש התחבר לצ'אט האתר: ${socket.id}`);

    socket.on('join_room', (chatRoom) => {
        socket.join(chatRoom);
    });

    socket.on('send_message', async (data) => {
        const { chatRoom, apartment, sender, receiver, text } = data;
        try {
            const newMessage = new Message({ chatRoom, apartment, sender, receiver, text });
            await newMessage.save();
            io.to(chatRoom).emit('receive_message', newMessage);
        } catch (error) {
            console.error('שגיאה בשליחת הודעה דרך סוקט:', error.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ משתמש התנתק מהסוקט');
    });
});

// --- 🗄️ חיבור ל-MongoDB והרצת השרת ---
const PORT = process.env.PORT || 5001;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vacation_db')
    .then(() => {
        console.log('🚀 מחובר בהצלחה ל-MongoDB');
        server.listen(PORT, () => console.log(`🔥 השרת המאובטח והצ'אט פועלים יחד על פורט ${PORT}`));
    })
    .catch(err => console.error('שגיאה בחיבור למסד הנתונים:', err));