// src/app/page.jsx
import { ConnectWallet } from "@/components/ConnectWallet.jsx";
import { Dashboard } from "@/components/Dashboard.jsx";
import { CreateTransfer } from "@/components/CreateTransfer.jsx";
import { AdminPanel } from "@/components/AdminPanel.jsx";
import { CreateBurnRequest } from "@/components/CreateBurnRequest.jsx"; // Import the new component
import { CompletedTransfers } from "@/components/CompletedTransfers.jsx";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-24 bg-gray-900 text-white">
      <div className="w-full max-w-5xl flex justify-between items-center mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold">Trinetra Project</h1>
        <ConnectWallet />
      </div>
      
      <AdminPanel />

      {/* Forms Section */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <CreateTransfer />
        <CreateBurnRequest /> {/* Add the burn form here */}
      </div>

      {/* Dashboards Section */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Dashboard />
        <CompletedTransfers />
      </div>
    </main>
  );
}