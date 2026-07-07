import mongoose from 'mongoose';

const swapRequestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // המשתמש שיזם את הבקשה
    senderApartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true }, // הדירה של היוזם
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // המשתמש שמקבל את ההצעה
    receiverApartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true }, // הדירה שמבוקשת להחלפה
    
    startDate: { type: String, required: true }, // תאריך תחילת ההחלפה המבוקש YYYY-MM-DD
    endDate: { type: String, required: true },   // תאריך סיום ההחלפה המבוקש YYYY-MM-DD
    
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'declined', 'cancelled'], 
        default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now }
});

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);
export default SwapRequest;
