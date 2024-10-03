const mongoose = require('mongoose');

const bookingHistorySchema = new mongoose.Schema({
    serviceId: { type: mongoose.Schema.Types.ObjectId },
    customerId: { type: mongoose.Schema.Types.ObjectId },
    serviceName: { type: String, required: true },
    date: { type: Date, required: true },
    price: { type: Number, required: true },
    discountApplied: { type: Boolean, required: true },
    brand: { type: String, required: true },
    rating: { type: Number, required: true },
    feedback: { type: String, required: true },
    status: { type: String, enum: ['completed', 'pending', 'cancelled'], required: true, default: 'pending' },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId },
        variantId: { type: mongoose.Schema.Types.ObjectId },
        productName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
    }]
},{
    timestamps: true
});

const BookingHistory = mongoose.model('BookingHistory', bookingHistorySchema);

module.exports = BookingHistory;
