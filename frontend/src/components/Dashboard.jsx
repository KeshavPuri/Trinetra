// src/components/Dashboard.jsx
'use client'

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { contractAddress, contractABI } from '@/lib/contract';

export function Dashboard() {
    const { isConnected } = useAccount();
    const [requests, setRequests] = useState([]); // Simple empty array
    const [isLoading, setIsLoading] = useState(true);
    const { writeContract, isPending, isSuccess } = useWriteContract();

    const handleApprove = (requestId) => {
        writeContract({
            address: contractAddress,
            abi: contractABI,
            functionName: 'approveTransfer',
            args: [BigInt(requestId)],
        });
    };

    useEffect(() => {
        async function fetchPendingRequests() {
            try {
                const response = await fetch('http://localhost:5001/api/pending-transfers');
                const data = await response.json();
                setRequests(data);
            } catch (error) {
                console.error("Failed to fetch pending requests:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (isConnected) {
            fetchPendingRequests();
        }
    }, [isConnected, isSuccess]);

    if (!isConnected) {
        return <div className="mt-8 text-center text-yellow-400">Please connect your wallet to see the dashboard.</div>;
    }

    if (isLoading) {
        return <div className="mt-8 text-center">Loading pending requests...</div>;
    }

    return (
        <div className="mt-8 w-full max-w-4xl">
            <h2 className="text-2xl font-semibold mb-4 text-center">Pending Transfer Requests</h2>
            {requests.length === 0 ? (
                <p className="text-center text-gray-400">No pending requests found.</p>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.requestId} className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
                            <div>
                                <p><strong>Request ID:</strong> {req.requestId}</p>
                                <p><strong>From:</strong> {req.from.substring(0, 6)}...{req.from.substring(38)}</p>
                                <p><strong>Amount:</strong> {req.amount} GPT</p>
                                <p><strong>Approvals:</strong> {req.approvalCount}</p>
                                <a href={`https://ipfs.io/ipfs/${req.billHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Bill</a>
                            </div>
                            <button 
                                onClick={() => handleApprove(req.requestId)}
                                disabled={isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-500"
                            >
                                {isPending ? 'Approving...' : 'Approve'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {isSuccess && <p className="mt-4 text-center text-green-400">Transaction successful! Refreshing...</p>}
        </div>
    );
}