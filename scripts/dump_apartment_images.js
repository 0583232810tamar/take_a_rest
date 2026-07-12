import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Apartment from '../server/models/Apartment.js';

dotenv.config();

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/vacation_db';

async function run() {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    const apartments = await Apartment.find({}).select('title images mainImage').lean();
    console.log('Found', apartments.length, 'apartments');
    apartments.forEach(a => {
        console.log('---');
        console.log('Title:', a.title);
        console.log('mainImage:', a.mainImage);
        console.log('images:', a.images);
    });
    await mongoose.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
