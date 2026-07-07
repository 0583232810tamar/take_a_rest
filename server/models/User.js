import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isAdmin: { type: Boolean, default: false },
    
    // פרופיל ופרטים אישיים (לניהול פרופיל כפול מאוחד)
    profile: {
        fullName: { type: String, default: '' },
        phone: { type: String, default: '' },
        avatar: { type: String, default: '' }, // קישור לתמונת פרופיל
        bio: { type: String, default: '' },
    },

    // מנגנון אימות משתמשים קשוח למניעת הונאות (Verification)
    verification: {
        isPhoneVerified: { type: Boolean, default: false },
        isIdVerified: { type: Boolean, default: false },
        idDocumentUrl: { type: String, default: '' }, // קישור לצילום תעודה מזהה שהועלה
        status: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' }
    },

    // ניהול מנגנון Tokens מאובטח
    refreshToken: { type: String, default: null },
    
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
export default User;