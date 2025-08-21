// src/components/CreateBurnRequest.jsx
'use client'

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { contractAddress, contractABI } from '@/lib/contract';
import { parseEther } from 'viem';

export function CreateBurnRequest() {
    const { isConnected } = useAccount();
    const { writeContract, isPending, isSuccess, error } = useWriteContract();

    const [amount, setAmount] = useState('');
    const [bankDetails, setBankDetails] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !bankDetails) {
            setStatus('Error: Please fill all fields.');
            return;
        }

        setStatus('Initiating burn request...');
        
        writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: 'initiateBurn',
            args: [parseEther(amount), bankDetails],
        });
    };

    useEffect(() => {
        if (isPending) {
            setStatus('Waiting for transaction confirmation...');
        } else if (isSuccess) {
            setStatus('Success! Burn request created.');
            setAmount('');
            setBankDetails('');
        } else if (error) {
            setStatus(`Error: ${error.shortMessage || error.message}`);
        }
    }, [isPending, isSuccess, error]);


    if (!isConnected) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl p-6 bg-red-900/20 border border-red-500 rounded-lg shadow-md mb-12">
            <h2 className="text-2xl font-bold mb-4 text-red-300">Burn Tokens for Cash</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="burnAmount" className="block text-sm font-medium text-gray-300">Amount to Burn (GPT)</label>
                    <input type="text" id="burnAmount" value={amount} onChange={(e) => setAmount(e.target.value)}
                           className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                           placeholder="e.g., 50" required />
                </div>
                <div className="mb-6">
                    <label htmlFor="bankDetails" className="block text-sm font-medium text-gray-300">Your Bank Account Details</label>
                    <input type="text" id="bankDetails" value={bankDetails} onChange={(e) => setBankDetails(e.target.value)}
                           className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                           placeholder="e.g., SBI, Account: 12345, IFSC: SBIN0001" required />
                </div>
                <button type="submit" disabled={isPending}
                        className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-500">
                    {isPending ? 'Submitting...' : 'Initiate Burn Request'}
                </button>
            </form>
            {status && <p className="mt-4 text-center text-sm text-red-400">{status}</p>}
        </div>
    );
}