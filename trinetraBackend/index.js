const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');
const mongoose = require('mongoose');

// Import the ABI and BOTH Mongoose Models
const contractJson = require('./contracts/GovtProjectToken.json');
const TransferRequest = require('./models/TransferRequest');
const BurnRequest = require('./models/BurnRequest');

const contractABI = contractJson.abi;
const app = express();
const PORT = process.env.PORT || 5001;

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected...");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        process.exit(1);
    }
};

async function startServer() {
    await connectDB();
    const upload = multer({ storage: multer.memoryStorage() });
    
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const tokenContract = new ethers.Contract(contractAddress, contractABI, provider);
    console.log(`✅ Successfully connected to the smart contract at: ${contractAddress}`);
    
    console.log("👂 Listening for ALL contract events...");

    tokenContract.on("TransferRequestCreated", async (requestId, from, to, amount, billHash) => {
        try { await TransferRequest.findOneAndUpdate({ requestId: Number(requestId) }, { from, to, amount: ethers.formatEther(amount), billHash, status: 'Pending' }, { upsert: true, new: true }); console.log(`✅ DB: Saved Transfer Request [ID: ${requestId}].`); } catch (error) { console.error("DB Error on TransferRequestCreated:", error); }
    });
    tokenContract.on("TransferApproved", async (requestId, signer) => {
        try {
            const request = await TransferRequest.findOne({ requestId: Number(requestId) });
            if (request && !request.approvers.includes(signer)) {
                request.approvers.push(signer);
                request.approvalCount += 1;
                const requiredSignatures = await tokenContract.requiredSignatures();
                if (request.approvalCount >= requiredSignatures) {
                    request.status = 'Completed';
                }
                await request.save();
                console.log(`✅ DB: Updated Transfer Approval [ID: ${requestId}].`);
            }
        } catch (error) { console.error("DB Error on TransferApproved:", error); }
    });
    tokenContract.on("BurnRequestCreated", async (burnId, from, amount, bankDetails) => {
        try {
            await BurnRequest.findOneAndUpdate({ burnId: Number(burnId) }, { from, amount: ethers.formatEther(amount), bankDetails, status: 'Pending' }, { upsert: true, new: true });
            console.log(`✅ DB: Saved Burn Request [ID: ${burnId}].`);
        } catch (error) { console.error("DB Error on BurnRequestCreated:", error); }
    });
    tokenContract.on("BurnRequestApproved", async (burnId, from, amount, bankDetails) => {
        try {
            // This listener fires when the burn is fully approved and executed on-chain
            await BurnRequest.findOneAndUpdate({ burnId: Number(burnId) }, { status: 'Completed', bankDetails });
            console.log(`✅ DB: Marked Burn [ID: ${burnId}] as Completed.`);
        } catch (error) { console.error("DB Error on BurnRequestApproved:", error); }
    });

    app.use(cors());
    app.use(express.json());
    
    app.post('/api/upload-bill', upload.single('billFile'), async (req, res) => {
        try {
            if (!req.file) { return res.status(400).json({ error: 'No file uploaded.' }); }
            const formData = new FormData();
            const stream = Readable.from(req.file.buffer);
            formData.append('file', stream, { filename: req.file.originalname });
            const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, { headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${process.env.PINATA_JWT}` } });
            res.status(201).json({ ipfsHash: response.data.IpfsHash });
        } catch (error) { res.status(500).json({ error: 'Failed to upload file to Pinata' }); }
    });
    
    app.get('/api/pending-transfers', async (req, res) => {
        try { const requests = await TransferRequest.find({ status: 'Pending' }).sort({ createdAt: -1 }); res.json(requests); } catch (error) { res.status(500).json({ error: "Failed to fetch pending transfers" }); }
    });
    app.get('/api/completed-transfers', async (req, res) => {
        try { const requests = await TransferRequest.find({ status: 'Completed' }).sort({ createdAt: -1 }); res.json(requests); } catch (error) { res.status(500).json({ error: "Failed to fetch completed transfers" }); }
    });
    app.get('/api/pending-burns', async (req, res) => {
        try { const requests = await BurnRequest.find({ status: 'Pending' }).sort({ createdAt: -1 }); res.json(requests); } catch (error) { res.status(500).json({ error: "Failed to fetch pending burns" }); }
    });
    app.get('/api/completed-burns', async (req, res) => {
        try { const requests = await BurnRequest.find({ status: 'Completed' }).sort({ createdAt: -1 }); res.json(requests); } catch (error) { res.status(500).json({ error: "Failed to fetch completed burns" }); }
    });
     app.get('/api/transfers/:requestId', async (req, res) => {
        try {
            const request = await TransferRequest.findOne({ requestId: req.params.requestId });
            if (!request) { return res.status(404).json({ error: "Request not found" });}
            res.json(request);
        } catch (error) { res.status(500).json({ error: "Failed to fetch request details" }); }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}

startServer();