// src/components/CompletedTransfers.jsx
'use client'

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function CompletedTransfers() {
    const { isConnected } = useAccount();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCompletedRequests() {
            try {
                // We call the new API endpoint for completed transfers
                const response = await fetch('http://localhost:5001/api/completed-transfers');
                const data = await response.json();
                setRequests(data);
            } catch (error) {
                console.error("Failed to fetch completed requests:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (isConnected) {
            fetchCompletedRequests();
        }
    }, [isConnected]);

    if (!isConnected) {
        return null; // Don't show anything if not connected
    }

    return (
        <div className="mt-12 w-full max-w-4xl">
            <h2 className="text-2xl font-semibold mb-4 text-center text-green-400">Completed Transfer History</h2>
            {isLoading ? (
                 <p className="text-center text-gray-400">Loading history...</p>
            ) : requests.length === 0 ? (
                <p className="text-center text-gray-400">No completed requests found.</p>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.requestId} className="bg-gray-800 p-4 rounded-lg shadow-md opacity-70">
                            <p><strong>Request ID:</strong> {req.requestId}</p>
                            <p><strong>From:</strong> {req.from}</p>
                            <p><strong>To:</strong> {req.to}</p>
                            <p><strong>Amount:</strong> {req.amount} GPT</p>
                            <p className="text-green-500 font-bold">Status: {req.status}</p>
                            <a 
                                href={`https://ipfs.io/ipfs/${req.billHash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                            >
                                View Bill
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}