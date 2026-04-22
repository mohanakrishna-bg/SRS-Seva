import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { InputProvider } from './context/InputContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ManagePage from './pages/ManagePage';
import AccountingPage from './pages/AccountingPage';
import AssetsPage from './pages/AssetsPage';
import ConsumablesPage from './pages/ConsumablesPage';

export default function App() {
  return (
    <InputProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/manage/*" element={<ManagePage />} />
              <Route path="/accounting/*" element={
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
                  <AccountingPage />
                </div>
              } />
              <Route path="/assets" element={
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
                  <AssetsPage />
                </div>
              } />
              <Route path="/consumables" element={
                <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-md shadow-lg h-full">
                  <ConsumablesPage />
                </div>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </InputProvider>
  );
}
