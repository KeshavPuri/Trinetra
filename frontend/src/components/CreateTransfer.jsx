// src/components/CreateTransfer.jsx
'use client'

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import axios from 'axios';
import { contractAddress, contractABI } from '@/lib/contract';
import { parseEther } from 'viem';

export function CreateTransfer() {
    const { isConnected } = useAccount();
    const { writeContract, isPending, isSuccess, error } = useWriteContract();

    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [billFile, setBillFile] = useState(null);
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!billFile || !toAddress || !amount) {
            setStatus('Error: Please fill all fields.');
            return;
        }

        setStatus('Uploading bill to IPFS...');
        try {
            // Step 1: Upload the file to the backend to get the IPFS hash
            const formData = new FormData();
            formData.append('billFile', billFile);
            const uploadResponse = await axios.post('http://localhost:5001/api/upload-bill', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const ipfsHash = uploadResponse.data.ipfsHash;
            setStatus(`Bill uploaded! IPFS Hash: ${ipfsHash}. Now creating request...`);

            // Step 2: Call the smart contract with the IPFS hash
            writeContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'initiateTransfer',
                args: [toAddress, parseEther(amount), ipfsHash],
            });

        } catch (err) {
            console.error(err);
            setStatus('Error: Failed to upload bill.');
        }
    };

    // Update status message based on transaction state
    useEffect(() => {
        if (isPending) {
            setStatus('Waiting for transaction confirmation...');
        } else if (isSuccess) {
            setStatus('Success! Transfer request created. It will appear in the dashboard below shortly.');
            // Clear form
            setToAddress('');
            setAmount('');
            setBillFile(null);
        } else if (error) {
            setStatus(`Error: ${error.shortMessage || error.message}`);
        }
    }, [isPending, isSuccess, error]);


    if (!isConnected) {
        return null; // Don't show the form if the wallet is not connected
    }

    return (
        <div className="w-full max-w-2xl p-6 bg-gray-800 rounded-lg shadow-md mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">Create New Transfer Request</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="toAddress" className="block text-sm font-medium text-gray-300">Recipient Address</label>
                    <input type="text" id="toAddress" value={toAddress} onChange={(e) => setToAddress(e.target.value)}
                           className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="0x..." required />
                </div>
                <div className="mb-4">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Amount (GPT)</label>
                    <input type="text" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                           className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="e.g., 100" required />
                </div>
                <div className="mb-6">
                    <label htmlFor="billFile" className="block text-sm font-medium text-gray-300">Bill File (PDF, JPG, etc.)</label>
                    <input type="file" id="billFile" onChange={(e) => setBillFile(e.target.files[0])}
                           className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                           required />
                </div>
                <button type="submit" disabled={isPending}
                        className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500">
                    {isPending ? 'Submitting...' : 'Create Request'}
                </button>
            </form>
            {status && <p className="mt-4 text-center text-sm text-gray-400">{status}</p>}
        </div>
    );
}