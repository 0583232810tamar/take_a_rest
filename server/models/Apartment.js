import mongoose from 'mongoose';

const apartmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['rent', 'exchange', 'both'], required: true },

    location: { type: String, required: true },
    neighborhood: { type: String, required: true },
    street: { type: String, required: true }, // הפך לחובה
    floor: { type: String, required: true },  // הפך לחובה
    nearbyPlaces: { type: String },

    rooms: { type: Number, required: true },
    beds: { type: Number, required: true },
    extraBedding: { type: String },
    maxGuests: { type: Number, required: true },

    ac: { type: String, enum: ['all', 'livingRoom', 'rooms', 'none'], required: true },
    elevator: { type: Boolean, default: false },
    accessible: { type: Boolean, default: false },
    hasBalcony: { type: Boolean, default: false },
    
    // אבזור חצר/מרפסת מורחב
    yardDetails: [{ type: String }], 
    
    // כשרות מטבח
    kitchenKosher: { type: String, required: true }, 

    parking: { type: String, required: true }, // הפך לחובה
    appliances: [{ type: String }],
    linensProvided: { type: Boolean, default: false },

    isShabbatFriendly: { type: Boolean, default: false },
    shabbatEquipment: {
        hasHotPlate: { type: Boolean, default: false },
        hasWaterUrn: { type: Boolean, default: false },
        shabbatClocks: [{ type: String }],
        mechanicalKey: { type: Boolean, default: false },
        kosherBeds: { type: Boolean, default: false },
        diningEquipment: { type: Boolean, default: false },
        havdalahKit: { type: Boolean, default: false }
    },

    mainImage: { type: String },
    images: [{ type: String }],

    // לוח זמנים: תאריכים תפוסים
    bookedDates: [{ 
        date: { type: String }, // YYYY-MM-DD
        status: { type: String, enum: ['booked', 'blocked', 'pending'], default: 'booked' }, // booked = הוזמן, blocked = סגור בעלים, pending = עומד להסגר (?)
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
    }],
    
    pricePerNight: { type: Number, default: 0 },
    priceWeekend: { type: Number, default: 0 },
    minNights: { type: Number, default: 1 },

    swapPreferences: {
        desiredLocations: [{ type: String }],
        minRoomsRequired: { type: Number, default: 0 },
        minBedsRequired: { type: Number, default: 0 }
    },

    rules: {
        petsAllowed: { type: Boolean, default: false },
        smoking: { type: String, enum: ['allowed', 'balconyOnly', 'forbidden'], required: true },
        checkIn: { type: String },
        checkOut: { type: String },
        cancellationPolicy: { type: String }
    },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerEmail: { type: String, required: true },
    phone: { type: String, required: true },  
    isApproved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Apartment = mongoose.model('Apartment', apartmentSchema);
export default Apartment;