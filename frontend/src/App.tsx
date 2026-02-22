import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Users, HeartHandshake, Mic, Camera,
  Settings, LogOut, Plus, Phone, Mail, Globe, MapPin,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Webcam from 'react-webcam';

const API_BASE = "http://localhost:8001/api";

// Interfaces based on Backend Pydantic Schemas
interface User {
  username: string;
  role: string;
}

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
  ItemCode: string;
  Description: string;
  Basic: number;
  Prasada_Addon_Limit?: number;
}

interface InvoicePayload {
  Date: string;
  VoucherNo: string;
  CustomerCode: string;
  TotalAmount: number;
  Payment_Mode: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sevas, setSevas] = useState<SevaItem[]>([]);

  // Invoice Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSevaCode, setSelectedSevaCode] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');


  // Multi-modal state
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [custRes, sevaRes] = await Promise.all([
        axios.get(`${API_BASE}/customers`),
        axios.get(`${API_BASE}/items`)
      ]);
      setCustomers(custRes.data);
      setSevas(sevaRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      playFeedbackSound('error');
    }
  };

  // --- Audio / Visual Feedback ---
  const playFeedbackSound = (type: 'success' | 'error' | 'shutter' | 'chime') => {
    const sounds = {
      success: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      error: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
      shutter: 'https://assets.mixkit.co/active_storage/sfx/2561/2561-preview.mp3',
      chime: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
    };
    new Audio(sounds[type]).play().catch(e => console.log("Audio play blocked", e));
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster for efficiency
    window.speechSynthesis.speak(utterance);
  };

  // --- Multi-Modal Input: Voice ---
  const startVoiceCapture = () => {
    // @ts-ignore - Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    setIsListening(true);
    playFeedbackSound('chime');

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Voice Input Captured:", transcript);

      // Audio readback of the captured text
      speakText(`I heard: ${transcript}`);
      playFeedbackSound('success');
    };

    recognition.onerror = (event: any) => {
      console.error("Voice recognition error", event.error);
      playFeedbackSound('error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // --- Multi-Modal Input: Camera ---
  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        console.log("Image Captured (Base64 length):", imageSrc.length);
        playFeedbackSound('shutter');
        setShowCamera(false);
        // Here you would upload imageSrc to API_BASE/upload-image
      }
    }
  }, [webcamRef]);

  // --- Issue Receipt Logic ---
  const handleIssueReceiptClick = (cust: Customer) => {
    setSelectedCustomer(cust);
    setShowReceiptModal(true);
  };

  const confirmReceipt = async () => {
    if (!selectedCustomer || !selectedSevaCode) return;
    const selectedSeva = sevas.find(s => s.ItemCode === selectedSevaCode);
    if (!selectedSeva) return;

    const payload: InvoicePayload = {
      Date: new Date().toISOString(),
      VoucherNo: `VCH-${Date.now().toString().slice(-4)}`,
      CustomerCode: selectedCustomer.ID || selectedCustomer.ID1.toString(),
      TotalAmount: selectedSeva.Basic,
      Payment_Mode: paymentMode
    };

    try {
      // In a real app we would POST this to API_BASE/invoices
      // await axios.post(`${API_BASE}/invoices`, payload);
      playFeedbackSound('success');
      setShowReceiptModal(false);
      alert(`Receipt ${payload.VoucherNo} generated for ${payload.TotalAmount} (${paymentMode})`);
    } catch (e) {
      console.error(e);
      playFeedbackSound('error');
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)]">

      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10 tracking-wider text-[var(--accent-blue)]">
          SEVA CORE
        </h1>

        <nav className="flex-1 space-y-2">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Customers', icon: Users },
            { name: 'Sevas', icon: HeartHandshake }, // Renamed from Items
            { name: 'Settings', icon: Settings }
          ].map(item => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.name
                ? 'bg-[var(--primary)] text-white shadow-lg shadow-indigo-500/20'
                : 'text-[var(--text-secondary)] hover:bg-white/5'
                }`}
            >
              <item.icon size={20} />
              {item.name}
            </button>
          ))}
        </nav>

        <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl mt-auto transition-all w-full text-left">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">

        {/* Header with Contact Details Placeholder */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-6">
            {/* Placeholder Image / Logo */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--accent-purple)] shadow-lg flex items-center justify-center text-xl font-bold">
              SC
            </div>

            <div>
              <h2 className="text-3xl font-bold leading-tight">Sri Mutt Administration</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1"><MapPin size={14} /> 123 Temple Road, City</span>
                <span className="flex items-center gap-1"><Phone size={14} /> +91 98765 43210</span>
                <span className="flex items-center gap-1"><MessageCircle size={14} /> WhatsApp</span>
                <span className="flex items-center gap-1 text-[var(--accent-blue)] cursor-pointer hover:underline">
                  <Globe size={14} /> www.srimutt.example.com
                </span>
              </div>
            </div>
          </div>

          {/* Global Multi-Modal Actions */}
          <div className="flex gap-4 self-end md:self-auto">
            <button
              onClick={startVoiceCapture}
              className={`p-4 rounded-full border transition-all shadow-lg ${isListening
                ? 'bg-red-500/20 border-red-500 animate-pulse text-red-500'
                : 'bg-[var(--glass-bg)] border-[var(--glass-border)] hover:bg-white/10 text-[var(--accent-blue)]'
                }`}
              title="Voice Input (Auto-Readback)"
            >
              <Mic size={24} />
            </button>
            <button
              onClick={() => setShowCamera(!showCamera)}
              className="p-4 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-white/10 text-[var(--accent-purple)] transition-all shadow-lg"
              title="Toggle Camera"
            >
              <Camera size={24} />
            </button>
          </div>
        </header>

        {/* Dynamic Camera Overlay */}
        <AnimatePresence>
          {showCamera && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-10 overflow-hidden"
            >
              <div className="glass-card relative max-w-2xl mx-auto flex flex-col items-center p-4">
                <h3 className="text-lg font-bold mb-4 w-full text-left">Document / ID Scanner</h3>
                <div className="rounded-xl overflow-hidden shadow-2xl w-full bg-black/50 aspect-video relative">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none border-2 border-[var(--accent-blue)]/30 m-8 rounded-lg"></div>
                </div>
                <button
                  onClick={captureImage}
                  className="mt-6 px-8 py-3 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] font-bold text-white shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <Camera size={20} /> Capture Frame
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Content */}
        {activeTab === 'Dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass-card flex flex-col justify-center">
                <Users size={32} className="text-[var(--accent-blue)] mb-2" />
                <p className="text-[var(--text-secondary)] font-medium uppercase text-xs tracking-wider">Total Devotees</p>
                <h3 className="text-4xl font-bold mt-1">{customers.length.toLocaleString()}</h3>
              </div>
              <div className="glass-card flex flex-col justify-center">
                <HeartHandshake size={32} className="text-[var(--accent-purple)] mb-2" />
                <p className="text-[var(--text-secondary)] font-medium uppercase text-xs tracking-wider">Active Sevas</p>
                <h3 className="text-4xl font-bold mt-1">{sevas.length}</h3>
              </div>
              <div className="glass-card flex flex-col justify-center">
                <div className="flex gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">UPI</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">CASH</span>
                </div>
                <p className="text-[var(--text-secondary)] font-medium uppercase text-xs tracking-wider">Today's Receipts</p>
                <h3 className="text-4xl font-bold mt-1">₹0.00</h3>
              </div>
            </section>

            {/* Data Table */}
            <div className="glass-card mt-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-bold">Recent Registrations</h4>
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
                  <Plus size={16} /> Add Devotee
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="pb-4 font-semibold text-[var(--text-secondary)] uppercase text-xs">Name & Gotra</th>
                      <th className="pb-4 font-semibold text-[var(--text-secondary)] uppercase text-xs">Contact</th>
                      <th className="pb-4 font-semibold text-[var(--text-secondary)] uppercase text-xs">Location</th>
                      <th className="pb-4 font-semibold text-[var(--text-secondary)] uppercase text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.slice(0, 8).map((c) => (
                      <tr key={c.ID1} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="py-4">
                          <p className="font-medium text-white">{c.Name}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {c.Sgotra || 'N/A'} • {c.SNakshatra || 'N/A'}
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                            {c.Phone && <span className="flex items-center gap-1"><Phone size={12} />{c.Phone}</span>}
                            {c.WhatsApp_Phone && <span className="flex items-center gap-1 text-green-400"><MessageCircle size={12} />{c.WhatsApp_Phone}</span>}
                            {c.Email_ID && <span className="flex items-center gap-1"><Mail size={12} />{c.Email_ID}</span>}
                            {!c.Phone && !c.Email_ID && 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-[var(--text-secondary)]">
                          {c.City || 'N/A'}
                          {c.Google_Maps_Location && (
                            <a href={c.Google_Maps_Location} target="_blank" rel="noreferrer" className="block text-[var(--accent-blue)] text-xs mt-1 hover:underline">
                              View Map
                            </a>
                          )}
                        </td>
                        <td className="py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleIssueReceiptClick(c)}
                            className="px-3 py-1 bg-[var(--primary)] text-white text-xs rounded-md shadow hover:bg-[var(--primary-hover)]"
                          >
                            Issue Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customers.length === 0 && (
                  <div className="text-center py-10 text-[var(--text-secondary)]">
                    No customers found. Connecting to database...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sevas Tab Preview */}
        {activeTab === 'Sevas' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card">
            <h4 className="text-xl font-bold mb-6">Available Sevas & Prasada</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sevas.slice(0, 12).map(s => (
                <div key={s.ItemCode} className="p-4 border border-white/10 rounded-xl bg-black/20 hover:bg-black/40 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-lg">{s.Description}</span>
                    <span className="text-[var(--accent-green)] font-mono">₹{s.Basic}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-mono mb-3">CODE: {s.ItemCode}</p>
                  {s.Prasada_Addon_Limit !== undefined && (
                    <div className="flex items-center gap-2 text-sm bg-white/5 p-2 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-purple)]"></span>
                      Prasada Included: {s.Prasada_Addon_Limit > 0 ? `Up to ${s.Prasada_Addon_Limit} people` : 'Standard'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Dynamic Receipt Modal Overlay */}
      <AnimatePresence>
        {showReceiptModal && selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card max-w-lg w-full p-8"
            >
              <h3 className="text-2xl font-bold mb-4">Issue New Receipt</h3>
              <p className="text-[var(--text-secondary)] mb-6">For Devotee: <span className="text-white font-medium">{selectedCustomer.Name}</span></p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Select Seva</label>
                  <select
                    value={selectedSevaCode}
                    onChange={(e) => setSelectedSevaCode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white appearance-none"
                  >
                    <option value="">-- Choose Seva --</option>
                    {sevas.map(s => (
                      <option key={s.ItemCode} value={s.ItemCode}>{s.Description} - ₹{s.Basic}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Mode of Payment</label>
                  <div className="flex gap-4">
                    {['UPI', 'Cash', 'Cheque'].map(mode => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMode"
                          value={mode}
                          checked={paymentMode === mode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                          className="accent-[var(--primary)] w-4 h-4"
                        />
                        <span>{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-6 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReceipt}
                  disabled={!selectedSevaCode}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save & Print
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
