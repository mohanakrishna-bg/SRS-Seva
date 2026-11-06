import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Search, X, ChevronDown, Trash2, Zap } from 'lucide-react';
import type { SevaItem, SelectedSeva } from '../RegistrationModal';
import { convertKnNumeralsToEn } from './DevoteeSelectionStep';
import { transliterateKnToEn } from '../../transliterate';
import { getDailyQuickPicks } from '../../services/dynamicQuickPicks';
import {
    SEVA_CATEGORIES,
    groupSevasByCategory,
    getCategoryForSeva,
} from '../../constants/sevaCategories';

// Common Kannada words mapped to English phonetic search synonyms for robust bilingual matching
const KN_TO_EN_SEARCH_MAP: Record<string, string> = {
    'ಆರಾಧನೆ': 'aradhana aradhane aaraadhane aaraadhana',
    'ಹೂವಿನ': 'hoovina hoovu flower',
    'ಅಲಂಕಾರ': 'alankara alankar decoration',
    'ಸಂಪೂರ್ಣ': 'sampoorna sampurna complete',
    'ಸೇವೆ': 'seva seve',
    'ಸೇವ': 'seva seve',
    'ಬ್ರಾಹ್ಮಣರ': 'brahmana brahmanara',
    'ಕನಕಾಭಿಷೇಕ': 'kanakabhisheka kanaka abhisheka',
    'ಕನಕ': 'kanaka',
    'ಪಾದಪೂಜೆ': 'padapooje pada pooja paada pooje puja puje',
    'ಪಾದ': 'pada paada padha',
    'ಪೂಜೆ': 'pooja pooje puja puje',
    'ಪಂಚಾಮೃತ': 'panchamruta panchamrutha',
    'ಅನ್ನದಾನ': 'annadana annadanam',
    'ಸತ್ಯನಾರಾಯಣ': 'satyanarayana sathyanarayana satya',
    'ಹಸ್ತೋದಕ': 'hastodaka hasthodaka hastodak',
    'ಧನುರ್ಮಾಸ': 'dhanurmasa dhanurmaasa',
    'ಪೊಂಗಲ್': 'pongal pongala',
    'ರಥೋತ್ಸವ': 'rathotsava rathotsav',
    'ಡೋಲೋತ್ಸವ': 'dolotsava dolotsav',
    'ಫಲ್ಲಕ್ಕಿ': 'pallakki fallakki',
    'ಉತ್ಸವ': 'utsava utsav uthsava',
    'ವಾಹನ': 'vahana vahan',
    'ಕಾರ್ತಿಕ': 'karthika kartika',
    'ದೀಪಾರಾಧನೆ': 'deeparadhane deepaaradhane',
    'ಮಧು': 'madhu',
    'ಅಭಿಷೇಕ': 'abhisheka abhishek',
    'ಶ್ರಾದ್ಧ': 'shraddha shradha',
    'ಚಟಕ': 'chataka chatak',
    'ಸಂಕಲ್ಪ': 'sankalpa sankalp',
    'ತೈಲ': 'taila thaila oil',
    'ಆರತಿ': 'aarati arati arathi',
    'ಗುರುವಾರ': 'guruvara thursday',
};

const normalizeWhitespace = (str: string) => str.replace(/\s+/g, ' ').trim().toLowerCase();

const applyPhoneticNormalization = (text: string): string => {
    return text
        .replace(/\b(puja|puje|pooje)\b/gi, 'pooja')
        .replace(/\b(paada|padha)\b/gi, 'pada')
        .replace(/\bseve\b/gi, 'seva')
        .replace(/\bpanchamrutha\b/gi, 'panchamruta')
        .replace(/\b(sathyanarayana|satya)\b/gi, 'satyanarayana')
        .replace(/\b(aaraadhane|aaraadhana|aradhane)\b/gi, 'aradhana')
        .replace(/\babhisheka\b/gi, 'abhishek')
        .replace(/\bkanika\b/gi, 'kanike')
        .replace(/\balankara\b/gi, 'alankar')
        .replace(/\b(hasthodaka|hastodak)\b/gi, 'hastodaka')
        .replace(/\b(rathotsav|rathotsava)\b/gi, 'rathotsava')
        .replace(/\butsav\b/gi, 'utsava');
};

const buildSearchableItemText = (item: SevaItem): string => {
    const code = String(item.ItemCode ?? item.SevaCode ?? '').toLowerCase();
    const rawKn = normalizeWhitespace(item.Description || '');
    const rawEn = normalizeWhitespace(item.DescriptionEn || '');
    const translitEn = normalizeWhitespace(transliterateKnToEn(item.Description || ''));
    const amount = String(item.Basic ?? item.Amount ?? '');

    const extraTokens: string[] = [];
    for (const [kn, en] of Object.entries(KN_TO_EN_SEARCH_MAP)) {
        if (item.Description?.includes(kn)) {
            extraTokens.push(en);
        }
    }

    const baseText = `${code} ${rawKn} ${rawEn} ${translitEn} ${amount} ${extraTokens.join(' ')}`;
    const phoneticVariant = applyPhoneticNormalization(baseText);
    return `${baseText} ${phoneticVariant}`;
};

interface SevaDetailsStepProps {
    selectedDate: Date | null;
    setSelectedDate: (d: Date | null) => void;
    selectedSevas: SelectedSeva[];
    setSelectedSevas: (sevas: SelectedSeva[]) => void;
    items: SevaItem[];
    optPrasada: boolean;
    setOptPrasada: (v: boolean) => void;
    familyMembers: number;
    setFamilyMembers: (v: number) => void;
    parcelCount: number;
    setParcelCount: (v: number) => void;
    foodServiceRateStr: string;
    setFoodServiceRateStr: (v: string) => void;
    defaultFoodRates: number[];
    calculateTotal: () => number;
}

export default function SevaDetailsStep({
    selectedDate, setSelectedDate, selectedSevas, setSelectedSevas,
    items,
    optPrasada, setOptPrasada, familyMembers, setFamilyMembers,
    parcelCount, setParcelCount,
    foodServiceRateStr, setFoodServiceRateStr, defaultFoodRates, calculateTotal
}: SevaDetailsStepProps) {

    // Progressive selection states
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
    const [isPillsSectionOpen, setIsPillsSectionOpen] = useState<boolean>(false);

    const comboboxRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Dynamic daily quick-pick pills evaluated & frozen for the day
    const dailyQuickPicks = useMemo(() => {
        return getDailyQuickPicks(selectedDate || new Date());
    }, [selectedDate]);

    // Immediately open dropdown & focus search input upon category selection
    const handleSelectCategory = (catId: string) => {
        const nextCategory = selectedCategory === catId ? 'all' : catId;
        setSelectedCategory(nextCategory);
        setIsDropdownOpen(true);
        setSearchQuery('');
        setHighlightedIndex(0);
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 40);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddSeva = (code: string) => {
        if (!code) return;
        if (selectedSevas.length >= 4) return;
        if (selectedSevas.find(s => s.sevaCode === code)) return;
        
        const item = items.find(i => String(i.ItemCode ?? i.SevaCode) === String(code));
        if (item) {
            const baseAmount = parseFloat(String(item.Amount ?? item.Basic ?? 0)) || 0;
            setSelectedSevas([
                ...selectedSevas, 
                { 
                    sevaCode: code, 
                    description: item.Description, 
                    amount: baseAmount > 0 ? baseAmount : '', 
                    isCustomPrice: baseAmount <= 0 
                }
            ]);
            setSearchQuery('');
            setIsDropdownOpen(false);
        }
    };

    const handleRemoveSeva = (code: string) => {
        setSelectedSevas(selectedSevas.filter(s => s.sevaCode !== code));
    };

    const handleUpdateAmount = (code: string, amountStr: string) => {
        const val = parseFloat(convertKnNumeralsToEn(amountStr));
        setSelectedSevas(selectedSevas.map(s => {
            if (s.sevaCode === code) {
                return { ...s, amount: isNaN(val) ? '' : val };
            }
            return s;
        }));
    };

    // Filter items based on selected category & bilingual search query
    const filteredItems = useMemo(() => {
        const query = normalizeWhitespace(searchQuery);

        if (query) {
            // When user types a search query, search globally across all sevas (unconstrained by category)
            const queryPhonetic = applyPhoneticNormalization(query);
            const tokens = queryPhonetic.split(' ').filter(Boolean);

            return items.filter(item => {
                const searchable = buildSearchableItemText(item);
                return tokens.every(tok => searchable.includes(tok));
            });
        }

        // When no search query, filter by selected category if not 'all'
        if (selectedCategory !== 'all') {
            return items.filter(item => {
                const cat = getCategoryForSeva(item);
                return cat.id === selectedCategory;
            });
        }

        return items;
    }, [items, selectedCategory, searchQuery]);

    // Group filtered items for structured presentation
    const groupedFilteredItems = useMemo(() => {
        return groupSevasByCategory(filteredItems);
    }, [filteredItems]);

    // Flat list of selectable items for keyboard navigation
    const flatSelectableItems = useMemo(() => {
        if (searchQuery.trim()) {
            return filteredItems;
        }
        return groupedFilteredItems.flatMap(g => g.items);
    }, [searchQuery, filteredItems, groupedFilteredItems]);

    // Reset highlighted index when flat list changes
    useEffect(() => {
        setHighlightedIndex(0);
    }, [flatSelectableItems.length]);

    // Keyboard navigation within combobox & live search results
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (flatSelectableItems.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => 
                flatSelectableItems.length === 0 ? 0 : (prev + 1) % flatSelectableItems.length
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => 
                flatSelectableItems.length === 0 ? 0 : (prev - 1 + flatSelectableItems.length) % flatSelectableItems.length
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatSelectableItems[highlightedIndex]) {
                const target = flatSelectableItems[highlightedIndex];
                const code = String(target.ItemCode ?? target.SevaCode);
                handleAddSeva(code);
            }
        } else if (e.key === 'Escape') {
            setIsDropdownOpen(false);
            setSearchQuery('');
        }
    };

    // Thursday detection for intelligent highlighting
    const isThursday = selectedDate && selectedDate.getDay() === 4;

    return (
        <div className="flex flex-col space-y-3.5 bg-slate-50/60 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-[var(--glass-border)] h-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-2.5">
                <span className="flex items-center gap-2 text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    <Receipt className="text-[var(--primary)]" size={18} /> 
                    <span>ಸೇವಾ ವಿವರಗಳು</span>
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)]">
                    ಆಯ್ಕೆಯಾದ ಸೇವೆ: <strong className="text-[var(--primary)] text-sm">{selectedSevas.length}/4</strong>
                </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 overflow-y-auto pr-1">
                {/* ── 1. Seva Date Picker ── */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center justify-between">
                        <span>ಸೇವಾ ದಿನಾಂಕ <span className="text-red-500">*</span></span>
                        {isThursday && (
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                                🛞 ಗುರುವಾರ ವಿಶೇಷ
                            </span>
                        )}
                    </label>
                    <input
                        type="date"
                        min={new Date().toLocaleDateString('en-CA')}
                        value={selectedDate ? selectedDate.toLocaleDateString('en-CA') : ''}
                        onChange={(e) => {
                            const d = e.target.value;
                            if (d) {
                                const [y, m, day] = d.split('-');
                                setSelectedDate(new Date(Number(y), Number(m) - 1, Number(day)));
                            } else {
                                setSelectedDate(null);
                            }
                        }}
                        className="w-full px-3.5 py-2 text-sm font-medium rounded-xl bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] shadow-2xs"
                    />
                </div>

                {/* ── 2. Collapsible Quick Add & Category Filter Section ── */}
                <div className="rounded-xl border border-[var(--glass-border)] bg-white/70 dark:bg-black/25 overflow-hidden transition-all shadow-2xs">
                    {/* Collapsible Header Toggle */}
                    <button
                        type="button"
                        aria-expanded={isPillsSectionOpen}
                        aria-controls="quick-pills-categories-section"
                        onClick={() => setIsPillsSectionOpen(prev => !prev)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded-md bg-amber-500/10 dark:bg-amber-400/15 flex items-center justify-center shrink-0">
                                <Zap size={13} className="text-amber-600 dark:text-amber-400 fill-amber-500/40" />
                            </div>
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                                ತ್ವರಿತ ಸೇವೆಗಳು ಮತ್ತು ವರ್ಗಗಳು
                            </span>
                            {selectedCategory !== 'all' && (
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectCategory('all');
                                    }}
                                    className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/30 hover:bg-[var(--primary)]/20 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                    title="ಫಿಲ್ಟರ್ ರದ್ದುಗೊಳಿಸಿ"
                                >
                                    <span>{SEVA_CATEGORIES.find(c => c.id === selectedCategory)?.labelKn || selectedCategory}</span>
                                    <X size={11} className="hover:text-red-500" />
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {dailyQuickPicks.reasonKn && !isPillsSectionOpen && (
                                <span className="hidden sm:inline-block text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300/40">
                                    {dailyQuickPicks.reasonKn}
                                </span>
                            )}
                            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                                {isPillsSectionOpen ? 'ಮರೆಮಾಡಿ' : 'ತೋರಿಸಿ'}
                            </span>
                            <ChevronDown
                                size={16}
                                className={`text-[var(--text-secondary)] transition-transform duration-200 ${
                                    isPillsSectionOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </div>
                    </button>

                    {/* Collapsible Body */}
                    <AnimatePresence initial={false}>
                        {isPillsSectionOpen && (
                            <motion.div
                                id="quick-pills-categories-section"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                className="overflow-hidden border-t border-[var(--glass-border)]/60"
                            >
                                <div className="p-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                                    {/* Tier 1: Dynamic Daily Quick-Pick High Turnover Chips */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                                                <Zap size={13} className="text-amber-500 fill-amber-500" /> ತ್ವರಿತ ಸೇವೆಗಳು:
                                            </span>
                                            {dailyQuickPicks.reasonKn && (
                                                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300/40">
                                                    {dailyQuickPicks.reasonKn}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {dailyQuickPicks.codes.map(code => {
                                                const item = items.find(i => String(i.ItemCode ?? i.SevaCode) === code);
                                                if (!item) return null;
                                                const isSelected = selectedSevas.some(s => s.sevaCode === code);
                                                const amount = item.Basic ?? item.Amount ?? 0;
                                                const shortName = (item.Description || '').split('-')[0].split('(')[0].trim();
                                                const isAtMax = selectedSevas.length >= 4;

                                                return (
                                                    <button
                                                        key={code}
                                                        type="button"
                                                        disabled={isSelected || isAtMax}
                                                        onClick={() => handleAddSeva(code)}
                                                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                                            isSelected
                                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                                                : isAtMax
                                                                ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                                                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-400'
                                                        }`}
                                                        title={item.Description}
                                                    >
                                                        <span>+ {shortName}</span>
                                                        <span className="text-amber-700 dark:text-amber-400 font-bold font-mono">₹{amount}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Tier 2: Category Filter Strip with Instant Dropdown Reveal */}
                                    <div className="space-y-1.5 pt-2 border-t border-[var(--glass-border)]/40">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                                                ವರ್ಗವಾರು ಆಯ್ಕೆ
                                            </span>
                                            {selectedCategory !== 'all' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectCategory('all')}
                                                    className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                                                >
                                                    ರದ್ದು
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none no-scrollbar">
                                            <button
                                                type="button"
                                                onClick={() => handleSelectCategory('all')}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-2xs ${
                                                    selectedCategory === 'all'
                                                        ? 'bg-[var(--primary)] text-white shadow-xs'
                                                        : 'bg-white dark:bg-slate-800 border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                ಎಲ್ಲವೂ
                                            </button>
                                            {SEVA_CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => handleSelectCategory(cat.id)}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs ${
                                                        selectedCategory === cat.id
                                                            ? 'bg-[var(--primary)] text-white font-bold shadow-xs'
                                                            : 'bg-white dark:bg-slate-800 border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    <span>{cat.icon}</span>
                                                    <span>{cat.labelKn}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── 4. Tier 3: Bilingual Searchable Grouped Combobox ── */}
                <div className="space-y-1 relative" ref={comboboxRef}>
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                        ಸೇವೆ ಸೇರಿಸಿ <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                        <div className="flex items-center w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] focus-within:border-[var(--primary)] shadow-2xs">
                            <Search size={16} className="text-[var(--text-secondary)] mr-2 shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                disabled={selectedSevas.length >= 4}
                                placeholder={selectedSevas.length >= 4 ? 'ಗರಿಷ್ಠ 4 ಸೇವೆಗಳು ತಲುಪಿದೆ' : 'ಹೆಸರು, ಕೋಡ್ ಅಥವಾ ₹ ನಮೂದಿಸಿ...'}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => {
                                    if (selectedSevas.length < 4) setIsDropdownOpen(true);
                                }}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-slate-400"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        searchInputRef.current?.focus();
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <button
                                type="button"
                                disabled={selectedSevas.length >= 4}
                                onClick={() => setIsDropdownOpen(prev => !prev)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 cursor-pointer"
                            >
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Dropdown Menu with Category Headers (Active when browsing without search query) */}
                        <AnimatePresence>
                            {isDropdownOpen && !searchQuery.trim() && selectedSevas.length < 4 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-[var(--glass-border)] max-h-64 overflow-y-auto"
                                >
                                    {groupedFilteredItems.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
                                            ಯಾವುದೇ ಸೇವೆ ಲಭ್ಯವಿಲ್ಲ
                                        </div>
                                    ) : (
                                        groupedFilteredItems.map((group) => (
                                            <div key={group.category.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-b-0">
                                                {/* Category Section Header */}
                                                <div className="sticky top-0 z-10 px-3.5 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50/95 dark:bg-amber-950/70 backdrop-blur-xs flex items-center justify-between border-y border-amber-200/50 dark:border-amber-800/50">
                                                    <span className="flex items-center gap-1.5">
                                                        <span>{group.category.icon}</span>
                                                        <span>{group.category.labelKn}</span>
                                                    </span>
                                                    <span className="text-[11px] opacity-75 font-normal">
                                                        {group.items.length} ಸೇವೆಗಳು
                                                    </span>
                                                </div>

                                                {/* Category Items */}
                                                <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                                                    {group.items.map((item) => {
                                                        const itemCode = String(item.ItemCode ?? item.SevaCode);
                                                        const isSelected = selectedSevas.some(s => s.sevaCode === itemCode);
                                                        const flatIdx = flatSelectableItems.findIndex(i => String(i.ItemCode ?? i.SevaCode) === itemCode);
                                                        const isHighlighted = flatIdx === highlightedIndex;
                                                        const amount = item.Basic ?? item.Amount ?? 0;

                                                        return (
                                                            <div
                                                                key={itemCode}
                                                                onMouseEnter={() => setHighlightedIndex(flatIdx)}
                                                                onClick={() => {
                                                                    if (!isSelected) handleAddSeva(itemCode);
                                                                }}
                                                                className={`px-3.5 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                                                                    isSelected
                                                                        ? 'bg-slate-50 dark:bg-slate-900/40 text-slate-400 cursor-not-allowed opacity-60'
                                                                        : isHighlighted
                                                                        ? 'bg-amber-100/70 dark:bg-amber-900/40 text-[var(--text-primary)] font-medium'
                                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-[var(--text-primary)]'
                                                                }`}
                                                            >
                                                                <div className="min-w-0 pr-3">
                                                                    <p className="truncate text-sm font-semibold leading-normal">
                                                                        {item.Description}
                                                                    </p>
                                                                    {item.DescriptionEn && (
                                                                        <p className="truncate text-xs text-[var(--text-secondary)] mt-0.5">
                                                                            {item.DescriptionEn}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="shrink-0 text-right">
                                                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                                                        {amount > 0 ? `₹${amount}` : 'ಇಚ್ಛೆಯಂತೆ'}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <span className="block text-[10px] text-slate-400 font-normal">
                                                                            ಆಯ್ಕೆಯಾಗಿದೆ
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Live Filtered Search Results (Appears as seva name is entered) ── */}
                    {searchQuery.trim() !== '' && (
                        <div className="mt-2 space-y-1.5" data-testid="live-filtered-sevas">
                            <div className="flex items-center justify-between text-xs font-bold text-[var(--primary)] px-1">
                                <span>
                                    {filteredItems.length} ಸೇವೆಗಳು ಕಂಡುಬಂದಿವೆ:
                                </span>
                                <span className="text-[11px] font-normal text-[var(--text-secondary)]">
                                    ಆಯ್ಕೆ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ / Enter ಒತ್ತಿರಿ
                                </span>
                            </div>
                            <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-amber-300/70 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/20 p-1.5 shadow-2xs">
                                {filteredItems.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-[var(--text-secondary)] font-medium">
                                        ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ಸೇವೆ ಕಂಡುಬಂದಿಲ್ಲ
                                    </div>
                                ) : (
                                    filteredItems.map((item, idx) => {
                                        const itemCode = String(item.ItemCode ?? item.SevaCode);
                                        const isSelected = selectedSevas.some(s => s.sevaCode === itemCode);
                                        const isHighlighted = idx === highlightedIndex;
                                        const amount = item.Basic ?? item.Amount ?? 0;
                                        const cat = getCategoryForSeva(item);

                                        return (
                                            <div
                                                key={itemCode}
                                                onMouseEnter={() => setHighlightedIndex(idx)}
                                                onClick={() => {
                                                    if (!isSelected && selectedSevas.length < 4) {
                                                        handleAddSeva(itemCode);
                                                    }
                                                }}
                                                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 text-xs shadow-2xs ${
                                                    isSelected
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                                                        : isHighlighted
                                                        ? 'bg-amber-100 dark:bg-amber-900/50 border-[var(--primary)] text-[var(--text-primary)] cursor-pointer'
                                                        : 'bg-white dark:bg-slate-800 border-amber-200/60 dark:border-slate-700 hover:border-[var(--primary)] hover:bg-amber-50/60 dark:hover:bg-slate-700/60 cursor-pointer text-[var(--text-primary)]'
                                                }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                                                            {itemCode}
                                                        </span>
                                                        <span className="font-bold text-sm text-[var(--text-primary)]">
                                                            {item.Description}
                                                        </span>
                                                        <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-medium">
                                                            {cat.labelKn}
                                                        </span>
                                                    </div>
                                                    {item.DescriptionEn && (
                                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                                                            {item.DescriptionEn}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 flex items-center gap-2">
                                                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                                                        {amount > 0 ? `₹${amount}` : 'ಇಚ್ಛೆಯಂತೆ'}
                                                    </span>
                                                    {isSelected ? (
                                                        <span className="text-[10px] text-slate-400 font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                                                            ✓ ಆಯ್ಕೆಯಾಗಿದೆ
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="text-xs text-white font-bold px-2.5 py-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-md shadow-2xs transition-colors cursor-pointer"
                                                        >
                                                            + ಆಯ್ಕೆ ಮಾಡಿ
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 5. Selected Sevas List (The Cart) ── */}
                {selectedSevas.length > 0 && (
                    <div className="space-y-2 mt-1">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                            ಆಯ್ಕೆಯಾದ ಸೇವೆಗಳು:
                        </label>
                        {selectedSevas.map(seva => (
                            <div key={seva.sevaCode} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-[var(--glass-border)] shadow-2xs">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{seva.description}</p>
                                    {!seva.isCustomPrice && <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">₹{seva.amount}</p>}
                                </div>
                                {seva.isCustomPrice && (
                                    <div className="w-28">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="ಮೊತ್ತ (₹)"
                                            value={seva.amount}
                                            onChange={(e) => handleUpdateAmount(seva.sevaCode, e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 rounded-lg border border-orange-300/50 focus:outline-none focus:border-[var(--primary)]"
                                        />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSeva(seva.sevaCode)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                                    title="ಸೇವೆ ತೆಗೆದುಹಾಕಿ"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── 6. Hastodaka (Anna Prasada Allocation) ── */}
            <div className="bg-blue-50/80 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 sm:p-3.5 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-blue-100 dark:border-blue-900/40">
                    <div className="space-y-0.5 cursor-pointer" onClick={() => setOptPrasada(!optPrasada)}>
                        <label className="text-sm font-bold text-orange-600 dark:text-orange-400 cursor-pointer">ಹಸ್ತೋದಕ</label>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOptPrasada(!optPrasada)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${optPrasada ? 'bg-[var(--accent-saffron)]' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <motion.div
                            animate={{ x: optPrasada ? 22 : 2 }}
                            className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
                        />
                    </button>
                </div>

                <AnimatePresence>
                    {optPrasada && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden flex flex-col gap-2.5 pt-1"
                        >
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">ಊಟ</label>
                                    <input
                                        type="number" min="0" max="20"
                                        value={familyMembers}
                                        onChange={(e) => setFamilyMembers(parseInt(convertKnNumeralsToEn(e.target.value)) || 0)}
                                        className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">ಪಾರ್ಸಲ್</label>
                                    <input
                                        type="number" min="0" max="20"
                                        value={parcelCount}
                                        onChange={(e) => setParcelCount(parseInt(convertKnNumeralsToEn(e.target.value)) || 0)}
                                        className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">ದರ</label>
                                    <select
                                        value={foodServiceRateStr}
                                        onChange={(e) => setFoodServiceRateStr(convertKnNumeralsToEn(e.target.value))}
                                        className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-black/20 border border-[var(--glass-border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)]"
                                    >
                                        {defaultFoodRates.map((rate: number) => (
                                            <option key={rate} value={rate.toString()}>₹{rate}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {(familyMembers > 0 || parcelCount > 0) && (
                                <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg flex justify-between">
                                    <span>ಒಟ್ಟು ಹಸ್ತೋದಕ: {familyMembers + parcelCount} (ಊಟ: {familyMembers}, ಪಾರ್ಸಲ್: {parcelCount})</span>
                                    <span className="font-bold font-mono">+₹{(familyMembers + parcelCount) * (parseFloat(foodServiceRateStr) || 0)}</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1 min-h-[4px]" />

            {/* ── 7. Total Summary Block ── */}
            {selectedSevas.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 border border-[var(--primary)]/40 rounded-xl p-3 sm:p-4 flex justify-between items-center bg-gradient-to-r from-[var(--glass-bg)] to-orange-50 dark:to-orange-900/20 shrink-0 shadow-2xs">
                    <span className="font-bold text-[var(--text-secondary)] uppercase text-xs sm:text-sm tracking-wider">ಒಟ್ಟು ಮೊತ್ತ</span>
                    <span className="text-base sm:text-xl font-black text-[var(--primary)] font-mono">₹{calculateTotal()}</span>
                </div>
            )}
        </div>
    );
}
