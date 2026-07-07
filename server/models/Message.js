import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    chatRoom: { type: String, required: true }, // מזהה ייחודי לחדר השיחה, למשל: "apartmentId-user1Id-user2Id"
    apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// אינדקס לשליפה מהירה במיוחד של היסטוריית השיחות
messageSchema.index({ chatRoom: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;