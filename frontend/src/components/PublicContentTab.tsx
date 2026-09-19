import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Building2, Calendar, Plus, Upload, Download, Printer, 
    Edit, Trash2, X, Search, Check, Clock, MapPin 
} from 'lucide-react';
import { useToast } from './Toast';
import TransliteratedInput from './TransliteratedInput';
import { settingsApi } from '../api';
import { defaultFacilities, type FacilityItem } from '../pages/public/PublicFacilitiesPage';
import { defaultUpcomingEvents, type UpcomingEventItem } from '../pages/public/PublicEventsPage';

type ContentSubTab = 'facilities' | 'events';

export default function PublicContentTab() {
    const [subTab, setSubTab] = useState<ContentSubTab>('facilities');
    const { showToast } = useToast();

    // Data states
    const [facilities, setFacilities] = useState<FacilityItem[]>([]);
    const [events, setEvents] = useState<UpcomingEventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [selectedFacility, setSelectedFacility] = useState<FacilityItem | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<UpcomingEventItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form states for Facility
    const [facForm, setFacForm] = useState<FacilityItem>({
        id: '',
        name: '',
        nameEn: '',
        description: '',
        descriptionEn: '',
        features: [],
        featuresEn: [],
        icon: '🏛️',
        image: '',
        docUrl: '',
        docName: '',
        htmlContent: '',
    });
    const [facFeaturesKnText, setFacFeaturesKnText] = useState('');
    const [facFeaturesEnText, setFacFeaturesEnText] = useState('');

    // Form states for Event
    const [evtForm, setEvtForm] = useState<UpcomingEventItem>({
        id: '',
        title: '',
        titleEn: '',
        date: '',
        dateDisplay: '',
        time: '',
        description: '',
        descriptionEn: '',
        venue: '',
        badge: '',
        image: '',
        docUrl: '',
        docName: '',
        htmlContent: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch initial data
    useEffect(() => {
        loadAllContent();
    }, []);

    const loadAllContent = async () => {
        setLoading(true);
        try {
            // Load Facilities
            try {
                const facRes = await settingsApi.get('seva_facilities');
                if (facRes.data?.value && Array.isArray(facRes.data.value) && facRes.data.value.length > 0) {
                    setFacilities(facRes.data.value);
                } else {
                    setFacilities(defaultFacilities);
                    await settingsApi.save('seva_facilities', defaultFacilities);
                }
            } catch {
                setFacilities(defaultFacilities);
            }

            // Load Upcoming Events
            try {
                const evtRes = await settingsApi.get('seva_upcoming_events');
                if (evtRes.data?.value && Array.isArray(evtRes.data.value) && evtRes.data.value.length > 0) {
                    setEvents(evtRes.data.value);
                } else {
                    setEvents(defaultUpcomingEvents);
                    await settingsApi.save('seva_upcoming_events', defaultUpcomingEvents);
                }
            } catch {
                setEvents(defaultUpcomingEvents);
            }
        } catch (e) {
            console.error('Failed to load content settings', e);
            showToast('error', 'ವಿಷಯ ಡೇಟಾ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ');
        } finally {
            setLoading(false);
        }
    };

    // Save helpers
    const saveFacilities = async (updated: FacilityItem[]) => {
        try {
            setFacilities(updated);
            await settingsApi.save('seva_facilities', updated);
            localStorage.setItem('seva_facilities', JSON.stringify(updated));
            showToast('success', 'ಸೌಲಭ್ಯಗಳ ಪಟ್ಟಿ ನವೀಕರಿಸಲಾಗಿದೆ');
        } catch {
            showToast('error', 'ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ');
        }
    };

    const saveEvents = async (updated: UpcomingEventItem[]) => {
        try {
            setEvents(updated);
            await settingsApi.save('seva_upcoming_events', updated);
            localStorage.setItem('seva_upcoming_events', JSON.stringify(updated));
            showToast('success', 'ಕಾರ್ಯಕ್ರಮಗಳ ಪಟ್ಟಿ ನವೀಕರಿಸಲಾಗಿದೆ');
        } catch {
            showToast('error', 'ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ');
        }
    };

    // Open detail modal
    const handleRowClickFacility = (fac: FacilityItem) => {
        setSelectedFacility(fac);
        setFacForm({ ...fac });
        setFacFeaturesKnText((fac.features || []).join('\n'));
        setFacFeaturesEnText((fac.featuresEn || []).join('\n'));
        setIsEditing(false);
        setIsCreating(false);
    };

    const handleRowClickEvent = (evt: UpcomingEventItem) => {
        setSelectedEvent(evt);
        setEvtForm({ ...evt });
        setIsEditing(false);
        setIsCreating(false);
    };

    // Add new modals
    const handleStartCreateFacility = () => {
        const newFac: FacilityItem = {
            id: `facility-${Date.now()}`,
            name: '',
            nameEn: '',
            description: '',
            descriptionEn: '',
            features: [],
            featuresEn: [],
            icon: '🏛️',
            image: '',
            docUrl: '',
            docName: '',
            htmlContent: '',
        };
        setFacForm(newFac);
        setFacFeaturesKnText('');
        setFacFeaturesEnText('');
        setSelectedFacility(newFac);
        setIsEditing(true);
        setIsCreating(true);
    };

    const handleStartCreateEvent = () => {
        const newEvt: UpcomingEventItem = {
            id: `event-${Date.now()}`,
            title: '',
            titleEn: '',
            date: '',
            dateDisplay: '',
            time: '',
            description: '',
            descriptionEn: '',
            venue: 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ',
            badge: 'ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮ',
            image: '',
            docUrl: '',
            docName: '',
            htmlContent: '',
        };
        setEvtForm(newEvt);
        setSelectedEvent(newEvt);
        setIsEditing(true);
        setIsCreating(true);
    };

    // Save handler for Facility
    const handleSaveFacility = async () => {
        if (!facForm.name.trim()) {
            showToast('error', 'ಸೌಲಭ್ಯದ ಹೆಸರು ನಮೂದಿಸಿ');
            return;
        }
        const knFeats = facFeaturesKnText.split('\n').map(s => s.trim()).filter(Boolean);
        const enFeats = facFeaturesEnText.split('\n').map(s => s.trim()).filter(Boolean);
        const finalized: FacilityItem = {
            ...facForm,
            features: knFeats,
            featuresEn: enFeats,
        };

        let updated: FacilityItem[];
        if (isCreating) {
            updated = [...facilities, finalized];
        } else {
            updated = facilities.map(f => f.id === finalized.id ? finalized : f);
        }
        await saveFacilities(updated);
        setSelectedFacility(null);
        setIsEditing(false);
        setIsCreating(false);
    };

    // Save handler for Event
    const handleSaveEvent = async () => {
        if (!evtForm.title.trim()) {
            showToast('error', 'ಕಾರ್ಯಕ್ರಮದ ಶೀರ್ಷಿಕೆ ನಮೂದಿಸಿ');
            return;
        }
        let updated: UpcomingEventItem[];
        if (isCreating) {
            updated = [...events, evtForm];
        } else {
            updated = events.map(e => e.id === evtForm.id ? evtForm : e);
        }
        await saveEvents(updated);
        setSelectedEvent(null);
        setIsEditing(false);
        setIsCreating(false);
    };

    // Soft delete
    const handleDeleteFacility = async (id: string) => {
        if (!confirm('ಈ ಸೌಲಭ್ಯವನ್ನು ಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಬೇಕೇ?')) return;
        const updated = facilities.filter(f => f.id !== id);
        await saveFacilities(updated);
        setSelectedFacility(null);
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('ಈ ಕಾರ್ಯಕ್ರಮವನ್ನು ಪಟ್ಟಿಯಿಂದ ತೆಗೆದುಹಾಕಬೇಕೇ?')) return;
        const updated = events.filter(e => e.id !== id);
        await saveEvents(updated);
        setSelectedEvent(null);
    };

    // File attachments inside modal (JPEG, PDF, HTML)
    const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'fac-img' | 'fac-doc' | 'fac-html' | 'evt-img' | 'evt-doc' | 'evt-html') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        if (target === 'fac-html' || target === 'evt-html') {
            reader.onload = (event) => {
                const text = event.target?.result as string;
                if (target === 'fac-html') setFacForm(f => ({ ...f, htmlContent: text }));
                else setEvtForm(ev => ({ ...ev, htmlContent: text }));
                showToast('success', `${file.name} HTML ವಿಷಯವನ್ನು ಸೇರಿಸಲಾಗಿದೆ`);
            };
            reader.readAsText(file);
        } else {
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (target === 'fac-img') setFacForm(f => ({ ...f, image: dataUrl }));
                else if (target === 'fac-doc') setFacForm(f => ({ ...f, docUrl: dataUrl, docName: file.name }));
                else if (target === 'evt-img') setEvtForm(ev => ({ ...ev, image: dataUrl }));
                else if (target === 'evt-doc') setEvtForm(ev => ({ ...ev, docUrl: dataUrl, docName: file.name }));
                showToast('success', `${file.name} ಲಗತ್ತಿಸಲಾಗಿದೆ`);
            };
            reader.readAsDataURL(file);
        }
    };

    // Global File Upload / Import (JSON, CSV, HTML, PDF, or JPEG/PNG)
    const handleGlobalFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const lowerName = file.name.toLowerCase();
        const isJson = lowerName.endsWith('.json');
        const isCsv = lowerName.endsWith('.csv');
        const isHtml = lowerName.endsWith('.html') || lowerName.endsWith('.htm');
        const isPdf = lowerName.endsWith('.pdf');
        const isImage = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png');

        const cleanName = file.name.replace(/\.[^.]+$/, '');

        if (isJson || isCsv) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const content = event.target?.result as string;
                    if (isJson) {
                        const parsed = JSON.parse(content);
                        if (subTab === 'facilities') {
                            const items = Array.isArray(parsed) ? parsed : (parsed.facilities || [parsed]);
                            await saveFacilities(items);
                        } else {
                            const items = Array.isArray(parsed) ? parsed : (parsed.events || [parsed]);
                            await saveEvents(items);
                        }
                        showToast('success', `${file.name} ನಿಂದ ಡೇಟಾ ಯಶಸ್ವಿಯಾಗಿ ಆಮದು ಮಾಡಿಕೊಳ್ಳಲಾಗಿದೆ`);
                    } else if (isCsv) {
                        const lines = content.split('\n').filter(l => l.trim());
                        if (lines.length > 1) {
                            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                            const rows = lines.slice(1).map((line, idx) => {
                                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                                const obj: any = {};
                                headers.forEach((h, i) => { obj[h] = values[i] || ''; });
                                obj.id = obj.id || `csv-${Date.now()}-${idx}`;
                                return obj;
                            });
                            if (subTab === 'facilities') await saveFacilities(rows);
                            else await saveEvents(rows);
                            showToast('success', `${lines.length - 1} ದಾಖಲೆಗಳನ್ನು CSV ನಿಂದ ಆಮದು ಮಾಡಿಕೊಳ್ಳಲಾಗಿದೆ`);
                        }
                    }
                } catch (err) {
                    console.error('Import error', err);
                    showToast('error', 'ಫೈಲ್ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ');
                }
            };
            reader.readAsText(file);
        } else if (isHtml) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const htmlText = event.target?.result as string;
                    if (subTab === 'facilities') {
                        const newFac: FacilityItem = {
                            id: `fac-html-${Date.now()}`,
                            name: cleanName,
                            nameEn: cleanName,
                            description: `${cleanName} - HTML ನಿಂದ ಆಮದು ಮಾಡಿಕೊಳ್ಳಲಾದ ಮಾಹಿತಿ.`,
                            descriptionEn: `${cleanName} - Information imported from HTML file.`,
                            features: ['HTML ಮಾಹಿತಿ ಲಗತ್ತಿಸಲಾಗಿದೆ'],
                            featuresEn: ['HTML content attached'],
                            icon: '📄',
                            htmlContent: htmlText,
                        };
                        await saveFacilities([...facilities, newFac]);
                    } else {
                        const newEvt: UpcomingEventItem = {
                            id: `evt-html-${Date.now()}`,
                            title: cleanName,
                            titleEn: cleanName,
                            date: new Date().toLocaleDateString('kn-IN'),
                            venue: 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ',
                            description: `${cleanName} - HTML ವಿವರಣೆ.`,
                            descriptionEn: `${cleanName} - Event description imported from HTML file.`,
                            htmlContent: htmlText,
                        };
                        await saveEvents([...events, newEvt]);
                    }
                    showToast('success', `${file.name} HTML ಫೈಲ್ ಸೇರಿಸಲಾಗಿದೆ`);
                } catch {
                    showToast('error', 'HTML ಫೈಲ್ ಓದಲು ವಿಫಲವಾಗಿದೆ');
                }
            };
            reader.readAsText(file);
        } else if (isPdf) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const dataUrl = event.target?.result as string;
                    if (subTab === 'facilities') {
                        const newFac: FacilityItem = {
                            id: `fac-pdf-${Date.now()}`,
                            name: cleanName,
                            nameEn: cleanName,
                            description: `${cleanName} - ಅಧಿಕೃತ PDF ಬ್ರೋಷರ್ ಲಗತ್ತಿಸಲಾಗಿದೆ.`,
                            descriptionEn: `${cleanName} - Official PDF brochure attached.`,
                            features: ['PDF ಬ್ರೋಷರ್ ಲಭ್ಯವಿದೆ'],
                            featuresEn: ['PDF brochure available'],
                            icon: '📑',
                            docUrl: dataUrl,
                            docName: file.name,
                        };
                        await saveFacilities([...facilities, newFac]);
                    } else {
                        const newEvt: UpcomingEventItem = {
                            id: `evt-pdf-${Date.now()}`,
                            title: cleanName,
                            titleEn: cleanName,
                            date: new Date().toLocaleDateString('kn-IN'),
                            venue: 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ',
                            description: `${cleanName} - PDF ಕರಪತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ.`,
                            descriptionEn: `${cleanName} - PDF flyer attached.`,
                            docUrl: dataUrl,
                            docName: file.name,
                        };
                        await saveEvents([...events, newEvt]);
                    }
                    showToast('success', `${file.name} PDF ಫೈಲ್ ಸೇರಿಸಲಾಗಿದೆ`);
                } catch {
                    showToast('error', 'PDF ಫೈಲ್ ಓದಲು ವಿಫಲವಾಗಿದೆ');
                }
            };
            reader.readAsDataURL(file);
        } else if (isImage) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const dataUrl = event.target?.result as string;
                    if (subTab === 'facilities') {
                        const newFac: FacilityItem = {
                            id: `fac-img-${Date.now()}`,
                            name: cleanName,
                            nameEn: cleanName,
                            description: `${cleanName} - ಚಿತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ.`,
                            descriptionEn: `${cleanName} - Image attached.`,
                            features: ['ಫೋಟೋ ಲಭ್ಯವಿದೆ'],
                            featuresEn: ['Photo available'],
                            icon: '🖼️',
                            image: dataUrl,
                        };
                        await saveFacilities([...facilities, newFac]);
                    } else {
                        const newEvt: UpcomingEventItem = {
                            id: `evt-img-${Date.now()}`,
                            title: cleanName,
                            titleEn: cleanName,
                            date: new Date().toLocaleDateString('kn-IN'),
                            venue: 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿ ಮಠ',
                            description: `${cleanName} - ಫ್ಲೈಯರ್ ಚಿತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ.`,
                            descriptionEn: `${cleanName} - Flyer image attached.`,
                            image: dataUrl,
                        };
                        await saveEvents([...events, newEvt]);
                    }
                    showToast('success', `${file.name} ಚಿತ್ರ ಸೇರಿಸಲಾಗಿದೆ`);
                } catch {
                    showToast('error', 'ಚಿತ್ರ ಓದಲು ವಿಫಲವಾಗಿದೆ');
                }
            };
            reader.readAsDataURL(file);
        } else {
            showToast('error', 'ದಯವಿಟ್ಟು .json, .csv, .pdf, .html, ಅಥವಾ .jpg/.png ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ');
        }
        e.target.value = '';
    };

    // Export current data as JSON
    const handleExportData = () => {
        const data = subTab === 'facilities' ? facilities : events;
        const filename = subTab === 'facilities' ? 'srs_facilities.json' : 'srs_upcoming_events.json';
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filtered lists
    const filteredFacilities = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return facilities;
        return facilities.filter(f => 
            f.name?.toLowerCase().includes(q) || 
            f.nameEn?.toLowerCase().includes(q) || 
            f.description?.toLowerCase().includes(q)
        );
    }, [facilities, searchQuery]);

    const filteredEvents = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return events;
        return events.filter(e => 
            e.title?.toLowerCase().includes(q) || 
            e.titleEn?.toLowerCase().includes(q) || 
            e.description?.toLowerCase().includes(q) ||
            e.date?.toLowerCase().includes(q)
        );
    }, [events, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Header & Sub-Tab Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-2 bg-[var(--glass-bg)] p-1 rounded-2xl border border-[var(--glass-border)]">
                    <button
                        onClick={() => { setSubTab('facilities'); setSearchQuery(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                            subTab === 'facilities'
                                ? 'bg-[var(--primary)] text-white shadow-md'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <Building2 size={16} />
                        ಸೌಲಭ್ಯಗಳು (Facilities)
                    </button>
                    <button
                        onClick={() => { setSubTab('events'); setSearchQuery(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                            subTab === 'events'
                                ? 'bg-[var(--primary)] text-white shadow-md'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <Calendar size={16} />
                        ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು (Upcoming Events)
                    </button>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={subTab === 'facilities' ? handleStartCreateFacility : handleStartCreateEvent}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                    >
                        <Plus size={14} />
                        ಹೊಸತು ಸೇರಿಸಿ
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-bold text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm"
                        title="ಫೈಲ್ ಆಮದು (JSON, CSV, PDF, HTML, JPEG/PNG)"
                    >
                        <Upload size={14} className="text-[var(--primary)]" />
                        ಫೈಲ್ ಆಮದು (Import)
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.csv,.html,.htm,.pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleGlobalFileImport}
                    />

                    <button
                        onClick={handleExportData}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs font-bold text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm"
                        title="JSON ಡೇಟಾ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
                    >
                        <Download size={14} className="text-[var(--primary)]" />
                        ರಫ್ತು (Export)
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm"
                        title="ಮುದ್ರಿಸಿ (Print)"
                    >
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {/* Search filter bar */}
            <div className="relative print:hidden">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={subTab === 'facilities' ? 'ಸೌಲಭ್ಯಗಳ ಹೆಸರು, ವಿವರಣೆ ಹುಡುಕಿ...' : 'ಕಾರ್ಯಕ್ರಮದ ಶೀರ್ಷಿಕೆ, ದಿನಾಂಕ ಹುಡುಕಿ...'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
            </div>

            {/* UNIFIED LIST VIEW (Strictly List, No Grid Views per UI Consistency Rule) */}
            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-sm text-[var(--text-secondary)] font-medium">ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...</div>
                ) : subTab === 'facilities' ? (
                    <div className="divide-y divide-[var(--glass-border)]">
                        {filteredFacilities.length === 0 ? (
                            <div className="p-8 text-center text-sm text-[var(--text-secondary)]">ಯಾವುದೇ ಸೌಲಭ್ಯ ಕಂಡುಬಂದಿಲ್ಲ.</div>
                        ) : (
                            filteredFacilities.map((fac) => (
                                <div
                                    key={fac.id}
                                    onClick={() => handleRowClickFacility(fac)}
                                    className="p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl shrink-0">
                                            {fac.icon || '🏛️'}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                                                {fac.name}
                                            </h4>
                                            <p className="text-xs text-[var(--text-secondary)] truncate">
                                                {fac.nameEn || fac.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {fac.image && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">📷 ಫೋಟೋ</span>}
                                        {fac.docUrl && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">📄 PDF</span>}
                                        <span className="text-xs font-semibold text-[var(--primary)]">ವಿವರಗಳು →</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--glass-border)]">
                        {filteredEvents.length === 0 ? (
                            <div className="p-8 text-center text-sm text-[var(--text-secondary)]">ಯಾವುದೇ ಕಾರ್ಯಕ್ರಮ ಕಂಡುಬಂದಿಲ್ಲ.</div>
                        ) : (
                            filteredEvents.map((evt) => (
                                <div
                                    key={evt.id}
                                    onClick={() => handleRowClickEvent(evt)}
                                    className="p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                                                    {evt.title}
                                                </h4>
                                                {evt.badge && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600">
                                                        {evt.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] truncate">
                                                {evt.dateDisplay || evt.date} {evt.time ? `• ${evt.time}` : ''} • {evt.venue || 'ಮಠದ ಆವರಣ'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {evt.image && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">📷 ಫೋಟೋ</span>}
                                        {evt.docUrl && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">📄 PDF</span>}
                                        <span className="text-xs font-semibold text-[var(--primary)]">ವಿವರಗಳು →</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* DETAIL / INLINE EDIT MODAL (Strictly max-w-2xl, max-h-[85vh], centered per UI Consistency Rule) */}
            <AnimatePresence>
                {(selectedFacility || selectedEvent) && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => { setSelectedFacility(null); setSelectedEvent(null); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 border border-[var(--glass-border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[var(--text-primary)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-4 md:p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-black/5 dark:bg-white/5 shrink-0">
                                <h3 className="text-base md:text-lg font-bold">
                                    {selectedFacility
                                        ? (isEditing ? (isCreating ? 'ಹೊಸ ಸೌಲಭ್ಯ ಸೇರಿಸಿ' : 'ಸೌಲಭ್ಯ ಸಂಪಾದಿಸಿ') : selectedFacility.name)
                                        : (isEditing ? (isCreating ? 'ಹೊಸ ಕಾರ್ಯಕ್ರಮ ಸೇರಿಸಿ' : 'ಕಾರ್ಯಕ್ರಮ ಸಂಪಾದಿಸಿ') : selectedEvent?.title)
                                    }
                                </h3>
                                <div className="flex items-center gap-2">
                                    {!isEditing && (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-110 shadow-sm"
                                            >
                                                <Edit size={13} />
                                                ಸಂಪಾದಿಸಿ (Edit)
                                            </button>
                                            <button
                                                onClick={() => selectedFacility ? handleDeleteFacility(selectedFacility.id) : handleDeleteEvent(selectedEvent!.id)}
                                                className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                title="ಅಳಿಸಿ (Delete)"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => { setSelectedFacility(null); setSelectedEvent(null); }}
                                        className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body (Scrollable) */}
                            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 custom-scrollbar">
                                {selectedFacility && (
                                    isEditing ? (
                                        /* Facility Edit / Create Form */
                                        <div className="space-y-4 text-xs md:text-sm">
                                            <div>
                                                <label className="block font-bold mb-1">ಸೌಲಭ್ಯದ ಹೆಸರು (ಕನ್ನಡ) *</label>
                                                <TransliteratedInput
                                                    value={facForm.name}
                                                    onChange={(val) => setFacForm(f => ({ ...f, name: val }))}
                                                    placeholder="ಉದಾ: ಕಲ್ಪವೃಕ್ಷ ಪ್ರಾರ್ಥನಾ ಮಂದಿರ"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-bold mb-1">ಹೆಸರು (English)</label>
                                                <input
                                                    type="text"
                                                    value={facForm.nameEn || ''}
                                                    onChange={(e) => setFacForm(f => ({ ...f, nameEn: e.target.value }))}
                                                    placeholder="e.g. Kalpavruksha Prarthana Mandira"
                                                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-bold mb-1">ವಿವರಣೆ (ಕನ್ನಡ)</label>
                                                <textarea
                                                    rows={3}
                                                    value={facForm.description}
                                                    onChange={(e) => setFacForm(f => ({ ...f, description: e.target.value }))}
                                                    placeholder="ಸೌಲಭ್ಯದ ಕುರಿತ ವಿವರಣೆ..."
                                                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none resize-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-bold mb-1">Description (English)</label>
                                                <textarea
                                                    rows={3}
                                                    value={facForm.descriptionEn || ''}
                                                    onChange={(e) => setFacForm(f => ({ ...f, descriptionEn: e.target.value }))}
                                                    placeholder="Facility description in English..."
                                                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none resize-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-bold mb-1">ವೈಶಿಷ್ಟ್ಯಗಳು (ಪ್ರತಿ ಸಾಲಿಗೆ ಒಂದೊಂದು)</label>
                                                    <textarea
                                                        rows={4}
                                                        value={facFeaturesKnText}
                                                        onChange={(e) => setFacFeaturesKnText(e.target.value)}
                                                        placeholder="250+ ಆಸನ ಸಾಮರ್ಥ್ಯ&#10;ಪ್ರತ್ಯೇಕ ಊಟದ ಹಾಲ್&#10;ಧ್ವನಿವರ್ಧಕ ವ್ಯವಸ್ಥೆ"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none resize-none text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-bold mb-1">Features / Amenities (English)</label>
                                                    <textarea
                                                        rows={4}
                                                        value={facFeaturesEnText}
                                                        onChange={(e) => setFacFeaturesEnText(e.target.value)}
                                                        placeholder="250+ seating capacity&#10;Spacious dining hall&#10;Clean restrooms"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none resize-none text-xs"
                                                    />
                                                </div>
                                            </div>

                                            {/* File & Image attachments */}
                                            <div className="p-4 rounded-2xl border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 space-y-3">
                                                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--primary)]">
                                                    ಫೈಲ್ ಮತ್ತು ಚಿತ್ರ ಲಗತ್ತುಗಳು (JPEG, PDF, HTML)
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1">JPEG / PNG ಚಿತ್ರ</label>
                                                        <input
                                                            type="file"
                                                            accept="image/jpeg,image/png"
                                                            onChange={(e) => handleModalFileUpload(e, 'fac-img')}
                                                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:text-white file:text-xs"
                                                        />
                                                        {facForm.image && <p className="text-[11px] text-emerald-600 mt-1">✓ ಚಿತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1">PDF ಬ್ರೋಷರ್ / ನಿಯಮಾವಳಿ</label>
                                                        <input
                                                            type="file"
                                                            accept="application/pdf"
                                                            onChange={(e) => handleModalFileUpload(e, 'fac-doc')}
                                                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs"
                                                        />
                                                        {facForm.docUrl && <p className="text-[11px] text-indigo-600 mt-1 truncate">✓ {facForm.docName || 'PDF ಲಗತ್ತಿಸಲಾಗಿದೆ'}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1">HTML ಫೈಲ್ ಅಪ್‌ಲೋಡ್</label>
                                                        <input
                                                            type="file"
                                                            accept=".html,.htm"
                                                            onChange={(e) => handleModalFileUpload(e, 'fac-html')}
                                                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:text-xs"
                                                        />
                                                        {facForm.htmlContent && <p className="text-[11px] text-amber-600 mt-1">✓ HTML ವಿಷಯ ಲಗತ್ತಿಸಲಾಗಿದೆ</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Facility View Details */
                                        <div className="space-y-4">
                                            {selectedFacility.image && (
                                                <div className="rounded-2xl overflow-hidden max-h-56 w-full border border-[var(--glass-border)]">
                                                    <img src={selectedFacility.image} alt={selectedFacility.name} className="w-full h-full object-cover" />
                                                </div>
                                            )}

                                            <div>
                                                <h4 className="text-sm font-bold text-[var(--primary)]">ಕನ್ನಡ ವಿವರಣೆ:</h4>
                                                <p className="text-sm leading-relaxed mt-0.5">{selectedFacility.description}</p>
                                            </div>

                                            {selectedFacility.descriptionEn && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-[var(--text-secondary)]">English Description:</h4>
                                                    <p className="text-sm leading-relaxed mt-0.5">{selectedFacility.descriptionEn}</p>
                                                </div>
                                            )}

                                            {selectedFacility.features && selectedFacility.features.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-1.5">ಮುಖ್ಯ ಸೌಲಭ್ಯಗಳು:</h4>
                                                    <ul className="list-disc pl-5 space-y-1 text-xs md:text-sm">
                                                        {selectedFacility.features.map((f, i) => <li key={i}>{f}</li>)}
                                                    </ul>
                                                </div>
                                            )}

                                            {selectedFacility.htmlContent && (
                                                <div className="p-3 rounded-xl border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 text-xs">
                                                    <h5 className="font-bold mb-1">ಲಗತ್ತಿಸಲಾದ HTML ವಿಷಯ:</h5>
                                                    <div dangerouslySetInnerHTML={{ __html: selectedFacility.htmlContent }} />
                                                </div>
                                            )}

                                            {selectedFacility.docUrl && (
                                                <div className="pt-2">
                                                    <a
                                                        href={selectedFacility.docUrl}
                                                        download={selectedFacility.docName || 'brochure.pdf'}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                                                    >
                                                        <Download size={14} />
                                                        ಲಗತ್ತಿಸಲಾದ PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ({selectedFacility.docName || 'Brochure.pdf'})
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}

                                {selectedEvent && (
                                    isEditing ? (
                                        /* Event Edit / Create Form */
                                        <div className="space-y-4 text-xs md:text-sm">
                                            <div>
                                                <label className="block font-bold mb-1">ಕಾರ್ಯಕ್ರಮದ ಶೀರ್ಷಿಕೆ (ಕನ್ನಡ) *</label>
                                                <TransliteratedInput
                                                    value={evtForm.title}
                                                    onChange={(val) => setEvtForm(e => ({ ...e, title: val }))}
                                                    placeholder="ಉದಾ: ಸರ್ವೈಕಾದಶಿ ವಿಶೇಷ ಪೂಜೆ"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-bold mb-1">Title (English)</label>
                                                <input
                                                    type="text"
                                                    value={evtForm.titleEn || ''}
                                                    onChange={(e) => setEvtForm(ev => ({ ...ev, titleEn: e.target.value }))}
                                                    placeholder="e.g. Sarva Ekadashi Special Pooja"
                                                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-bold mb-1">ದಿನಾಂಕ / ದಿನ (ಕನ್ನಡ)</label>
                                                    <TransliteratedInput
                                                        value={evtForm.dateDisplay || evtForm.date}
                                                        onChange={(val) => setEvtForm(e => ({ ...e, date: val, dateDisplay: val }))}
                                                        placeholder="ಉದಾ: ಮುಂಬರುವ ಏಕಾದಶಿ / ಪ್ರತಿ ಗುರುವಾರ"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-bold mb-1">ಸಮಯ (Time)</label>
                                                    <input
                                                        type="text"
                                                        value={evtForm.time || ''}
                                                        onChange={(e) => setEvtForm(ev => ({ ...ev, time: e.target.value }))}
                                                        placeholder="ಉದಾ: ಬೆಳಿಗ್ಗೆ ೮:೦೦ – ಸಂಜೆ ೮:೩೦"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-bold mb-1">ಸ್ಥಳ (Venue)</label>
                                                    <input
                                                        type="text"
                                                        value={evtForm.venue || ''}
                                                        onChange={(e) => setEvtForm(ev => ({ ...ev, venue: e.target.value }))}
                                                        placeholder="ಉದಾ: ಕಲ್ಪವೃಕ್ಷ ಪ್ರಾರ್ಥನಾ ಮಂದಿರ"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-bold mb-1">ಬ್ಯಾಡ್ಜ್ / ವಿಭಾಗ (Badge)</label>
                                                    <input
                                                        type="text"
                                                        value={evtForm.badge || ''}
                                                        onChange={(e) => setEvtForm(ev => ({ ...ev, badge: e.target.value }))}
                                                        placeholder="ಉದಾ: ಮಾಸಿಕ / ಸಾಪ್ತಾಹಿಕ / ಉತ್ಸವ"
                                                        className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block font-bold mb-1">ವಿವರಣೆ (ಕನ್ನಡ)</label>
                                                <textarea
                                                    rows={3}
                                                    value={evtForm.description}
                                                    onChange={(e) => setEvtForm(ev => ({ ...ev, description: e.target.value }))}
                                                    placeholder="ಕಾರ್ಯಕ್ರಮದ ವಿವರಣೆ..."
                                                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none resize-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-bold mb-1">Description (English)</label>
                                                <textarea
                                                    rows={3}
                                                    value={evtForm.descriptionEn || ''}
                                                    onChange={(e) => setEvtForm(ev => ({ ...ev, descriptionEn: e.target.value }))}
                                                    placeholder="Event description in English..."
                                                    className="w-full px-3.5 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] outline-none resize-none"
                                                />
                                            </div>

                                            {/* File & Image attachments */}
                                            <div className="p-4 rounded-2xl border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 space-y-3">
                                                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--primary)]">
                                                    ಫ್ಲೈಯರ್ ಮತ್ತು ಫೈಲ್ ಲಗತ್ತುಗಳು (JPEG, PDF, HTML)
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1">JPEG / PNG ಫ್ಲೈಯರ್</label>
                                                        <input
                                                            type="file"
                                                            accept="image/jpeg,image/png"
                                                            onChange={(e) => handleModalFileUpload(e, 'evt-img')}
                                                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:text-white file:text-xs"
                                                        />
                                                        {evtForm.image && <p className="text-[11px] text-emerald-600 mt-1">✓ ಚಿತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1">PDF ಕರಪತ್ರ (Flyer)</label>
                                                        <input
                                                            type="file"
                                                            accept="application/pdf"
                                                            onChange={(e) => handleModalFileUpload(e, 'evt-doc')}
                                                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs"
                                                        />
                                                        {evtForm.docUrl && <p className="text-[11px] text-indigo-600 mt-1 truncate">✓ {evtForm.docName || 'PDF ಲಗತ್ತಿಸಲಾಗಿದೆ'}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold mb-1">HTML ವಿವರಣೆ ಅಪ್‌ಲೋಡ್</label>
                                                        <input
                                                            type="file"
                                                            accept=".html,.htm"
                                                            onChange={(e) => handleModalFileUpload(e, 'evt-html')}
                                                            className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:text-xs"
                                                        />
                                                        {evtForm.htmlContent && <p className="text-[11px] text-amber-600 mt-1">✓ HTML ವಿಷಯ ಲಗತ್ತಿಸಲಾಗಿದೆ</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Event View Details */
                                        <div className="space-y-4">
                                            {selectedEvent.image && (
                                                <div className="rounded-2xl overflow-hidden max-h-56 w-full border border-[var(--glass-border)]">
                                                    <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-full object-cover" />
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-4 text-xs font-semibold text-[var(--text-secondary)]">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={13} className="text-[var(--primary)]" />
                                                    {selectedEvent.dateDisplay || selectedEvent.date}
                                                </span>
                                                {selectedEvent.time && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={13} className="text-[var(--primary)]" />
                                                        {selectedEvent.time}
                                                    </span>
                                                )}
                                                {selectedEvent.venue && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={13} className="text-[var(--primary)]" />
                                                        {selectedEvent.venue}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-bold text-[var(--primary)]">ವಿವರಣೆ:</h4>
                                                <p className="text-sm leading-relaxed mt-0.5">{selectedEvent.description}</p>
                                            </div>

                                            {selectedEvent.descriptionEn && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-[var(--text-secondary)]">Description (English):</h4>
                                                    <p className="text-sm leading-relaxed mt-0.5">{selectedEvent.descriptionEn}</p>
                                                </div>
                                            )}

                                            {selectedEvent.htmlContent && (
                                                <div className="p-3 rounded-xl border border-[var(--glass-border)] bg-black/5 dark:bg-white/5 text-xs">
                                                    <h5 className="font-bold mb-1">ಲಗತ್ತಿಸಲಾದ HTML ವಿವರ:</h5>
                                                    <div dangerouslySetInnerHTML={{ __html: selectedEvent.htmlContent }} />
                                                </div>
                                            )}

                                            {selectedEvent.docUrl && (
                                                <div className="pt-2">
                                                    <a
                                                        href={selectedEvent.docUrl}
                                                        download={selectedEvent.docName || 'event_flyer.pdf'}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                                                    >
                                                        <Download size={14} />
                                                        PDF ಕರಪತ್ರ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ({selectedEvent.docName || 'flyer.pdf'})
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-[var(--glass-border)] flex items-center justify-between bg-black/5 dark:bg-white/5 shrink-0">
                                {isEditing ? (
                                    <div className="flex items-center justify-end gap-2 w-full">
                                        <button
                                            onClick={() => {
                                                if (isCreating) {
                                                    setSelectedFacility(null);
                                                    setSelectedEvent(null);
                                                }
                                                setIsEditing(false);
                                                setIsCreating(false);
                                            }}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                                        >
                                            ರದ್ದು (Cancel)
                                        </button>
                                        <button
                                            onClick={selectedFacility ? handleSaveFacility : handleSaveEvent}
                                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-110 shadow-md transition-all"
                                        >
                                            <Check size={14} />
                                            ಉಳಿಸಿ (Save)
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-end w-full">
                                        <button
                                            onClick={() => { setSelectedFacility(null); setSelectedEvent(null); }}
                                            className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:brightness-110 shadow-md transition-all"
                                        >
                                            ಮುಚ್ಚಿ (Close)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
