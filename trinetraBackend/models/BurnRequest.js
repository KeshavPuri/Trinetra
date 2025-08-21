// backend/models/BurnRequest.js
const mongoose = require('mongoose');

const BurnRequestSchema = new mongoose.Schema({
    burnId: {
        type: Number,
        required: true,
        unique: true,
    },
    from: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    bankDetails: {
        type: String,
        default: '',
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
    approvers: [{
        type: String,
    }],
}, { timestamps: true });

module.exports = mongoose.model('BurnRequest', BurnRequestSchema);