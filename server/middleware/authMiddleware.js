import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_1234';

// מידלוור לאימות משתמש רגיל / מאוחד
export const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // אימות הטוקן
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // הזרקת נתוני המשתמש לתוך אובייקט הבקשה (req.user)
            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'פג תוקף הטוקן או שהוא אינו תקין' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'אין הרשאה, לא נשלח טוקן במערכת' });
    }
};

// מידלוור מיוחד לחסימת נתיבים לאדמין בלבד
export const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
        return next();
    }
    return res.status(403).json({ message: 'גישה נדחתה. נתיב זה מיועד למנהלי מערכת בלבד' });
};