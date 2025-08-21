const mongoose = require('mongoose');

const TransferRequestSchema = new mongoose.Schema({
    requestId: {
        type: Number,
        required: true,
        unique: true, // Each request ID should be unique
    },
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    amount: {
        type: String, // Storing as a string to handle large numbers
        required: true,
    },
    billHash: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Completed', 'Rejected'],
        default: 'Pending',
    },
    approvalCount: {
        type: Number,
        default: 0,
    },
    // We'll store the addresses of those who have approved
    approvers: [{
        type: String,
    }],
}, { timestamps: true }); // Automatically add createdAt and updatedAt timestamps

module.exports = mongoose.model('TransferRequest', TransferRequestSchema);