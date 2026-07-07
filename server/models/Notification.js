import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // המשתמש שמקבל את ההתראה
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // המשתמש שגרם להתראה (אופציונלי)
    type: { 
        type: String, 
        enum: ['new_swap_request', 'swap_approved', 'swap_declined', 'new_message', 'booking_confirmed'], 
        required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // מזהה של הישות הקשורה (למשל מזהה בקשת ההחלפה או הדירה)
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// אינדקס לשליפה מהירה של ההתראות החדשות ביותר של המשתמש
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;