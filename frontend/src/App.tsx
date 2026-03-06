import { useState, useCallback } from 'react';

// Components
import { ToastProvider, useToast } from './components/Toast';
import Modal from './components/Modal';
import Header from './components/Header';
import ReceiptGenerator from './components/ReceiptGenerator';

// Pages
import LandingPage from './pages/LandingPage';
import ManagePage from './pages/ManagePage';
import SettingsPage from './pages/SettingsPage';

// API
import { sevaApi } from './api';

interface Customer {
  ID1: number;
  ID?: string;
  Name: string;
  Sgotra?: string;
  SNakshatra?: string;
  Address?: string;
  City?: string;
  Phone?: string;
  WhatsApp_Phone?: string;
  Email_ID?: string;
  Google_Maps_Location?: string;
}

interface SevaItem {
  ItemCode?: string;
  Description?: string;
  Basic?: number;
  TPQty?: number;
  Prasada_Addon_Limit?: number;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('Home');

  // Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sevas, setSevas] = useState<SevaItem[]>([]);
  const [selectedSevaCode, setSelectedSevaCode] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Receipt generator state
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    voucherNo: string;
    date: string;
    customerName: string;
    gotra?: string;
    nakshatra?: string;
    sevaDescription: string;
    amount: number;
    paymentMode: string;
  } | null>(null);

  const { showToast } = useToast();

  // --- Receipt Flow ---
  const handleIssueReceipt = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    try {
      const res = await sevaApi.list();
      setSevas(res.data.filter((s: SevaItem) => s.ItemCode && s.Description));
    } catch {
      showToast('error', 'ಸೇವೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗಲಿಲ್ಲ');
    }
    setShowReceiptModal(true);
  }, [showToast]);

  const confirmReceipt = () => {
    if (!selectedCustomer || !selectedSevaCode) return;
    const selectedSeva = sevas.find((s) => s.ItemCode === selectedSevaCode);
    if (!selectedSeva) return;

    const voucherNo = `VCH-${Date.now().toString().slice(-6)}`;
    setShowReceiptModal(false);
    setSelectedSevaCode('');

    setReceiptData({
      voucherNo,
      date: new Date().toISOString(),
      customerName: selectedCustomer.Name,
      gotra: selectedCustomer.Sgotra,
      nakshatra: selectedCustomer.SNakshatra,
      sevaDescription: selectedSeva.Description || '',
      amount: selectedSeva.Basic || 0,
      paymentMode,
    });
    setShowReceiptGenerator(true);

    showToast(
      'success',
      `ರಸೀದಿ ${voucherNo} — ₹${selectedSeva.Basic?.toLocaleString()} (${paymentMode}) ${selectedCustomer.Name} ಅವರಿಗೆ`
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)]">
      <main className="max-w-6xl mx-auto p-6 md:p-10 min-h-screen">
        {/* Page Router */}
        {activeTab === 'Home' && (
          <LandingPage onNavigate={setActiveTab} />
        )}
        {activeTab === 'Manage' && (
          <ManagePage
            onBack={() => setActiveTab('Home')}
            onIssueReceipt={handleIssueReceipt}
          />
        )}
        {activeTab === 'Settings' && (
          <div className="space-y-4">
            <Header compact onBack={() => setActiveTab('Home')} />
            <SettingsPage />
          </div>
        )}
      </main>

      {/* Receipt Modal */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="ಹೊಸ ರಸೀದಿ ನೀಡಿ"
      >
        {selectedCustomer && (
          <div>
            <p className="text-[var(--text-secondary)] mb-6">
              ಭಕ್ತರು: <span className="text-[var(--text-primary)] font-medium">{selectedCustomer.Name}</span>
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">ಸೇವೆ ಆಯ್ಕೆ ಮಾಡಿ</label>
                <select
                  value={selectedSevaCode}
                  onChange={(e) => setSelectedSevaCode(e.target.value)}
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg p-3 text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="" className="bg-[var(--bg-dark)] text-[var(--text-primary)]">-- ಸೇವೆ ಆಯ್ಕೆ ಮಾಡಿ --</option>
                  {sevas.map((s) => (
                    <option key={s.ItemCode} value={s.ItemCode} className="bg-[var(--bg-dark)] text-[var(--text-primary)]">
                      {s.Description} — ₹{s.Basic?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">ಪಾವತಿ ವಿಧಾನ</label>
                <div className="flex gap-4">
                  {['ಯುಪಿಐ', 'ನಗದು', 'ಚೆಕ್'].map((mode) => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMode"
                        value={mode}
                        checked={paymentMode === mode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="accent-[var(--primary)] w-4 h-4"
                      />
                      <span className="text-sm">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-5 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] transition-colors text-sm"
              >
                ರದ್ದುಮಾಡಿ
              </button>
              <button
                onClick={confirmReceipt}
                disabled={!selectedSevaCode}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-saffron)] text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ಉಳಿಸಿ ಮತ್ತು ಮುದ್ರಿಸಿ
              </button>
            </div>
          </div>
        )}
      </Modal>

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
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
