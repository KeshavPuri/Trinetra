// src/components/AdminPanel.jsx
'use client'

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { contractAddress, contractABI } from '@/lib/contract';

export function AdminPanel() {
    const { address, isConnected } = useAccount();
    const [isClient, setIsClient] = useState(false);
    
    // State for the "Add Signer" form
    const [addSignerAddress, setAddSignerAddress] = useState('');
    const [addStatus, setAddStatus] = useState('');

    // State for the "Remove Signer" form
    const [removeSignerAddress, setRemoveSignerAddress] = useState('');
    const [removeStatus, setRemoveStatus] = useState('');

    // We'll use two separate instances of the hook for cleaner status management
    const { writeContract: addSigner, isPending: isAdding, isSuccess: addSuccess, error: addError } = useWriteContract();
    const { writeContract: removeSigner, isPending: isRemoving, isSuccess: removeSuccess, error: removeError } = useWriteContract();

    const { data: contractAdmin } = useReadContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'admin',
    });

    useEffect(() => { setIsClient(true); }, []);

    const handleAddSubmit = (e) => {
        e.preventDefault();
        addSigner({
            address: contractAddress,
            abi: contractABI,
            functionName: 'addSigner',
            args: [addSignerAddress],
        });
    };
    
    // --- NEW: Handle Remove Signer ---
    const handleRemoveSubmit = (e) => {
        e.preventDefault();
        removeSigner({
            address: contractAddress,
            abi: contractABI,
            functionName: 'removeSigner',
            args: [removeSignerAddress],
        });
    };

    // Effect for "Add Signer" status
    useEffect(() => {
        if (isAdding) setAddStatus('Waiting for confirmation...');
        else if (addSuccess) { setAddStatus('Success! Signer added.'); setAddSignerAddress(''); }
        else if (addError) setAddStatus(`Error: ${addError.shortMessage || addError.message}`);
    }, [isAdding, addSuccess, addError]);
    
    // --- NEW: Effect for "Remove Signer" status ---
    useEffect(() => {
        if (isRemoving) setRemoveStatus('Waiting for confirmation...');
        else if (removeSuccess) { setRemoveStatus('Success! Signer removed.'); setRemoveSignerAddress(''); }
        else if (removeError) setRemoveStatus(`Error: ${removeError.shortMessage || removeError.message}`);
    }, [isRemoving, removeSuccess, removeError]);

    const isAdmin = isClient && isConnected && address === contractAdmin;

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl p-6 bg-yellow-900/20 border border-yellow-500 rounded-lg shadow-md my-12">
            <h2 className="text-2xl font-bold mb-4 text-yellow-300">Admin Panel</h2>
            
            {/* Add Signer Form */}
            <form onSubmit={handleAddSubmit} className="mb-8">
                <label htmlFor="signerAddress" className="block text-sm font-medium text-gray-300">New Signer Address</label>
                <input type="text" id="signerAddress" value={addSignerAddress} onChange={(e) => setAddSignerAddress(e.target.value)}
                       className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                       placeholder="0x..." required />
                <button type="submit" disabled={isAdding} className="mt-2 w-full px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 disabled:bg-gray-500">
                    {isAdding ? 'Adding...' : 'Add Signer'}
                </button>
                {addStatus && <p className="mt-2 text-center text-sm text-yellow-400">{addStatus}</p>}
            </form>

            {/* --- NEW: Remove Signer Form --- */}
            <form onSubmit={handleRemoveSubmit}>
                <label htmlFor="removeSignerAddress" className="block text-sm font-medium text-gray-300">Signer Address to Remove</label>
                <input type="text" id="removeSignerAddress" value={removeSignerAddress} onChange={(e) => setRemoveSignerAddress(e.target.value)}
                       className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                       placeholder="0x..." required />
                <button type="submit" disabled={isRemoving} className="mt-2 w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-500">
                    {isRemoving ? 'Removing...' : 'Remove Signer'}
                </button>
                {removeStatus && <p className="mt-2 text-center text-sm text-red-400">{removeStatus}</p>}
            </form>
        </div>
    );
}