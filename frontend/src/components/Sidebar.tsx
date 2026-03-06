import {
    Users, HeartHandshake, Settings, LogOut, Home, Menu, X
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isMobileOpen: boolean;
    onMobileToggle: () => void;
}

const navItems = [
    { name: 'Home', icon: Home, label: 'ಮುಖಪುಟ' },
    { name: 'Customers', icon: Users, label: 'ಭಕ್ತರು' },
    { name: 'Sevas', icon: HeartHandshake, label: 'ಸೇವೆಗಳು' },
    { name: 'Settings', icon: Settings, label: 'ಸೆಟ್ಟಿಂಗ್ಸ್' },
];

export default function Sidebar({ activeTab, onTabChange, isMobileOpen, onMobileToggle }: SidebarProps) {
    const handleTabClick = (tab: string) => {
        onTabChange(tab);
        if (isMobileOpen) onMobileToggle();
    };

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={onMobileToggle}
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-xl md:hidden"
            >
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={onMobileToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:sticky top-0 left-0 h-screen w-64 border-r border-[var(--glass-border)] bg-[#0c1222]/95 backdrop-blur-xl p-6 flex flex-col z-40 transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                <h1 className="text-2xl font-bold mb-10 tracking-wider text-[var(--accent-blue)]">
                    SEVA CORE
                </h1>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => handleTabClick(item.name)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === item.name
                                ? 'bg-[var(--primary)] text-white shadow-lg shadow-indigo-500/20'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]'
                                }`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl mt-auto transition-all w-full text-left">
                    <LogOut size={20} /> ನಿರ್ಗಮಿಸಿ
                </button>
            </aside>
        </>
    );
}
