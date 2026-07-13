import express from 'express';
import nodemailer from 'nodemailer';
import Message from '../models/Message.js';
import Apartment from '../models/Apartment.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

let transporter;
let useEthereal = false;
const getTransporter = async () => {
    if (transporter) return transporter;

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
        return transporter;
    }

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
    useEthereal = true;
    console.log('Ethereal account נוצר לשלב הפיתוח:', testAccount.user);
    return transporter;
};

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

router.post('/send-email', protect, async (req, res) => {
    try {
        const { apartmentId, message } = req.body;
        if (!apartmentId) {
            return res.status(400).json({ message: 'Missing apartment id' });
        }

        const apartment = await Apartment.findById(apartmentId);
        if (!apartment) {
            return res.status(404).json({ message: 'Apartment not found' });
        }

        if (!apartment.ownerEmail) {
            return res.status(400).json({ message: 'No owner email defined for this apartment' });
        }

        const senderEmail = req.user.email || 'no-reply@vacation.com';
        const senderName = req.user.name || req.user.profile?.fullName || req.user.email || 'משתמש';
        const emailBody = message || `שלום,\n\nאני רוצה לבדוק אפשרות להזמנה של הדירה "${apartment.title}".\n\nשם: ${senderName}\nאימייל: ${senderEmail}\n\nאשמח לתיאום איתך בהקדם.\n\nתודה,`;

        const mailOptions = {
            from: `"${senderName}" <${senderEmail}>`,
            to: apartment.ownerEmail,
            subject: `בקשת הזמנה - ${apartment.title}`,
            text: emailBody,
            html: `<div dir="rtl" style="font-family: sans-serif; color:#222; line-height:1.6; text-align:right;">\n                    <h2>שלום,</h2>\n                    <p>יש בקשה להזמנה עבור הדירה <strong>${apartment.title}</strong>.</p>\n                    <p><strong>שם השולח:</strong> ${senderName}</p>\n                    <p><strong>אימייל:</strong> ${senderEmail}</p>\n                    <p><strong>הודעה:</strong><br />${emailBody.replace(/\n/g, '<br />')}</p>\n                    <hr />\n                    <p>הודעה נשלחה דרך מערכת ההזמנות המקומית.</p>\n                   </div>`
        };

        const mailer = await getTransporter();
        const info = await mailer.sendMail(mailOptions);

        const responsePayload = { message: 'Email sent successfully' };
        if (useEthereal) {
            responsePayload.previewUrl = nodemailer.getTestMessageUrl(info);
        }

        res.json(responsePayload);
    } catch (error) {
        console.error('Email send failed:', error.message);
        res.status(500).json({ message: 'שגיאה בשליחת המייל', error: error.message });
    }
});

export default router;