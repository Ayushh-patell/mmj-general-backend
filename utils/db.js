const mongoose = require('mongoose');
require('dotenv').config();

const connectZeejayDB = async () => {
    try {
        // Use your MongoDB URI from .env
        const conn = await mongoose.connect(process.env.ZEEJAY_DB);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectZeejayDB;