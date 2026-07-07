import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/vacation_db';

(async function(){
  try{
    await mongoose.connect(uri, { dbName: undefined });
    console.log('Connected to', uri);
    const admin = mongoose.connection.db.admin();
    const stats = await mongoose.connection.db.listCollections().toArray();
    if(!stats || stats.length === 0) {
      console.log('No collections found in the database.');
    } else {
      console.log('Collections:');
      for(const c of stats){
        const name = c.name;
        const count = await mongoose.connection.db.collection(name).countDocuments();
        console.log(`- ${name}: ${count} documents`);
      }
    }
    await mongoose.disconnect();
  }catch(err){
    console.error('Error connecting to DB:', err.message);
    process.exit(1);
  }
})();
