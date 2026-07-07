import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // מי שסגר את הדירה
    dates: [{ type: String, required: true }], // מערך של תאריכים חסומים בפורמט YYYY-MM-DD
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' },
    bookingType: { type: String, enum: ['rent', 'swap', 'owner_block'], required: true },
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;