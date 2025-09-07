// Purchases.jsx
import React, { useState } from 'react';
import PurchaseForm from '../components/PurchaseForm';
import PurchaseList from '../components/PurchaseList';
import { useAuth0 } from '@auth0/auth0-react';

export default function Purchases() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [refresh, setRefresh] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Purchases</h2>
        <p className="text-blue-600">Please log in to view and make purchases.</p>
      </div>
    );
  }

  // Refresh PurchaseList after a successful purchase
  const handleSuccess = () => setRefresh(r => !r);

  return (
    <div>
      <PurchaseForm onSuccess={handleSuccess} />
      <PurchaseList key={refresh} />
    </div>
  );
}
