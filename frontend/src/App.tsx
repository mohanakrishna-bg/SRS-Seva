import { useState } from 'react';
import { ToastProvider } from './components/Toast';
import ReceiptGenerator from './components/ReceiptGenerator';
import LandingPage from './pages/LandingPage';
import ManagePage from './pages/ManagePage';
import AccountingPage from './pages/AccountingPage';
import InventoryPage from './pages/InventoryPage';
import { useEffect } from 'react';
import { InputProvider } from './context/InputContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('Home');

  // Receipt generator state
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    voucherNo: string;
    date: string;
    customerName: string;
    customerNameEn?: string;
    gotra?: string;
    gotraEn?: string;
    nakshatra?: string;
    nakshatraEn?: string;
    sevaDescription: string;
    sevaDescriptionEn?: string;
    amount: number;
    paymentMode: string;
    paymentModeEn?: string;
  } | null>(null);

  // Disable browser back button
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)]">
      <main className="max-w-6xl mx-auto p-6 md:p-10 min-h-screen">
        {/* Page Router */}
        {activeTab === 'Home' && (
          <LandingPage 
            onNavigate={setActiveTab} 
            onShowReceipt={(data: any) => {
              setReceiptData(data);
              setShowReceiptGenerator(true);
            }} 
          />
        )}
        {activeTab === 'Manage' && (
          <ManagePage
            onHome={() => setActiveTab('Home')}
          />
        )}
        {activeTab === 'Accounting' && (
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
            <AccountingPage onHome={() => setActiveTab('Home')} />
          </div>
        )}
        {activeTab === 'Inventory' && (
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
            <InventoryPage onHome={() => setActiveTab('Home')} />
          </div>
        )}
      </main>

      {/* Receipt Generator Modal */}
      <ReceiptGenerator
        isOpen={showReceiptGenerator}
        onClose={() => setShowReceiptGenerator(false)}
        receiptData={receiptData}
      />
    </div>
  );
}

export default function App() {
  return (
    <InputProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </InputProvider>
  );
}
