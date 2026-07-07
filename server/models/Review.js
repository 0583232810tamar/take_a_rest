import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // מי שכותב את הביקורת
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // מי שמקבל את הביקורת (בעל הנכס או האורח)
    
    reviewType: { type: String, enum: ['property', 'guest'], required: true }, // האם הביקורת היא על הנכס או על האורח/המחליף
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    
    createdAt: { type: Date, default: Date.now }
});

// מניעת כפל ביקורות: כותב לא יכול להשאיר יותר מביקורת אחת עבור אותה הזמנה/סוג
reviewSchema.index({ booking: 1, author: 1, reviewType: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;