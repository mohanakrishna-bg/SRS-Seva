/**
 * SevaBookingCart — Deep domain aggregate for Seva booking and pricing calculation.
 *
 * Encapsulates:
 * - Selected sevas and quantity limits (max 4 per transaction)
 * - Safe numeric calculation without string concatenation bugs
 * - Hastodaka (Anna Prasada) pricing and single-allocation invariant
 * - Canonical Devotee normalization (deprecating Sgotra/SNakshatra leakage)
 * - Seva date validation: past dates & special event cutoff time checks
 * - Batch SevaRegistration API payload generation
 */

export interface SevaCatalogItem {
    SevaCode?: string;
    ItemCode?: string;
    Description: string;
    DescriptionEn?: string;
    Amount?: number;
    Basic?: number;
    TPQty?: number;
    PrasadaAddonLimit?: number;
    Prasada_Addon_Limit?: number;
    IsSpecialEvent?: boolean;
    StartTime?: string;
    IsAllDay?: boolean;
}

export interface SelectedSevaEntry {
    sevaCode: string;
    description: string;
    amount: number | '';
    isCustomPrice: boolean;
}

export interface CanonicalDevotee {
    DevoteeId?: number;
    Name: string;
    NameEn?: string;
    Phone: string;
    WhatsApp_Phone?: string;
    Email?: string;
    Gotra?: string;
    GotraEn?: string;
    Nakshatra?: string;
    NakshatraEn?: string;
    Address?: string;
    City?: string;
    CityEn?: string;
    PinCode?: string;
}

export interface DevoteeInput {
    // Canonical fields
    DevoteeId?: number;
    Name: string;
    NameEn?: string;
    Phone: string;
    WhatsApp_Phone?: string;
    Email?: string;
    Gotra?: string;
    GotraEn?: string;
    Nakshatra?: string;
    NakshatraEn?: string;
    Address?: string;
    City?: string;
    CityEn?: string;
    PinCode?: string;

    // Legacy fields normalized at the seam
    ID1?: number;
    Sgotra?: string;
    SgotraEn?: string;
    SNakshatra?: string;
    SNakshatraEn?: string;
    Email_ID?: string;
}

export interface BookingPricingSummary {
    baseAmount: number;
    hastodakaRate: number;
    hastodakaAmount: number;
    totalAmount: number;
    itemCount: number;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export interface PaymentDetails {
    paymentMode: 'Cash' | 'Cheque' | 'DD' | 'UPI' | 'Netbanking';
    paymentRef?: string;
    upiDetails?: {
        gateway?: string;
        transactionId?: string;
        vpa?: string;
        screenshot?: string;
    };
    chqDetails?: {
        number?: string;
        bank?: string;
        branch?: string;
        date?: string;
        accNo?: string;
        holder?: string;
    };
    netDetails?: {
        utr?: string;
        date?: string;
        bank?: string;
    };
}

export interface SevaRegistrationPayload {
    RegistrationDate: string; // DDMMYY
    SevaDate: string;         // DDMMYY
    DevoteeId: number;
    SevaCode: string;
    Qty: number;
    Rate: number;
    Amount: number;
    GrandTotal: number;
    OptTheerthaPrasada: boolean;
    PrasadaCount: number;
    PrasadaOpted: boolean;
    FamilyCount: number;
    PaymentMode: string;
    VoucherNo: string;
    PaymentRef?: string;
    PaymentReference?: string | null;
    PaymentDetails?: any;
    Remarks?: string | null;
    UpiGateway?: string;
    UpiTransactionId?: string;
    UpiVpa?: string;
    ChequeNumber?: string;
    ChequeBank?: string;
    ChequeBranch?: string;
    ChequeDate?: string;
    BankName?: string;
    UtrNumber?: string;
    TransferDate?: string;
}

export const MAX_SEVAS_PER_BOOKING = 4;

/**
 * Pure calculation helper. Used directly or by the SevaBookingCart aggregate.
 * Sanitizes both number and string amount inputs from the API or forms.
 */
export function calculateBookingTotal(
    itemOrItems: SevaCatalogItem | SelectedSevaEntry | (SevaCatalogItem | SelectedSevaEntry)[] | undefined,
    optPrasada: boolean,
    familyMembers: number,
    foodServiceRateStr: string | number
): number {
    if (!itemOrItems) return 0;
    
    let baseSum = 0;
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];

    for (const item of items) {
        if ('amount' in item && item.amount !== undefined && item.amount !== '') {
            const val = parseFloat(String(item.amount));
            if (!isNaN(val)) {
                baseSum += val;
                continue;
            }
        }

        const rawAmt = 'Amount' in item ? item.Amount : undefined;
        const rawBasic = 'Basic' in item ? item.Basic : undefined;
        const parsedAmt = parseFloat(String(rawAmt ?? ''));
        const parsedBasic = parseFloat(String(rawBasic ?? ''));

        const itemVal = (!isNaN(parsedAmt) && parsedAmt > 0)
            ? parsedAmt
            : (!isNaN(parsedBasic) ? parsedBasic : (parsedAmt === 0 ? 0 : 0));

        // If Amount is explicitly 0 and Basic is provided, fall back to Basic (matches legacy modal invariant)
        const finalVal = (parsedAmt === 0 && !isNaN(parsedBasic) && parsedBasic > 0)
            ? parsedBasic
            : itemVal;

        baseSum += finalVal;
    }

    if (optPrasada && familyMembers > 0) {
        const rate = parseFloat(String(foodServiceRateStr)) || 0;
        baseSum += familyMembers * rate;
    }

    return baseSum;
}

/**
 * Formats a Date object as DDMMYY for backend SevaRegistration storage.
 */
export function formatDateToDdmmyy(d: Date): string {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${day}${month}${year}`;
}

export class SevaBookingCart {
    private devotee: CanonicalDevotee | null = null;
    private selectedSevas: SelectedSevaEntry[] = [];
    private selectedDate: Date | null = null;
    private optPrasada: boolean = false;
    private familyMembers: number = 0;
    private foodServiceRate: number = 200;

    // ─── Devotee Management ───
    setDevotee(input: DevoteeInput | null): void {
        if (!input) {
            this.devotee = null;
            return;
        }
        this.devotee = {
            DevoteeId: input.DevoteeId ?? input.ID1,
            Name: input.Name?.trim() || '',
            NameEn: input.NameEn?.trim(),
            Phone: input.Phone?.trim() || '',
            WhatsApp_Phone: input.WhatsApp_Phone?.trim(),
            Email: input.Email?.trim() || input.Email_ID?.trim(),
            Gotra: input.Gotra?.trim() || input.Sgotra?.trim(),
            GotraEn: input.GotraEn?.trim() || input.SgotraEn?.trim(),
            Nakshatra: input.Nakshatra?.trim() || input.SNakshatra?.trim(),
            NakshatraEn: input.NakshatraEn?.trim() || input.SNakshatraEn?.trim(),
            Address: input.Address?.trim(),
            City: input.City?.trim(),
            CityEn: input.CityEn?.trim(),
            PinCode: input.PinCode?.trim(),
        };
    }

    getDevotee(): CanonicalDevotee | null {
        return this.devotee;
    }

    buildDevoteeCreatePayload(): Record<string, any> {
        if (!this.devotee) throw new Error('No devotee set in cart');
        return {
            Name: this.devotee.Name,
            Phone: this.devotee.Phone || null,
            WhatsApp_Phone: this.devotee.WhatsApp_Phone || null,
            Email: this.devotee.Email || null,
            Gotra: this.devotee.Gotra || null,
            Nakshatra: this.devotee.Nakshatra || null,
            Address: this.devotee.Address || null,
            City: this.devotee.City || null,
            PinCode: this.devotee.PinCode || null,
        };
    }

    // ─── Seva Selection Management ───
    addSeva(item: SevaCatalogItem, customAmount?: number): boolean {
        const code = String(item.SevaCode ?? item.ItemCode ?? '').trim();
        if (!code) return false;
        if (this.selectedSevas.length >= MAX_SEVAS_PER_BOOKING) return false;
        if (this.selectedSevas.some(s => s.sevaCode === code)) return false;

        const rawAmt = parseFloat(String(item.Amount ?? ''));
        const rawBasic = parseFloat(String(item.Basic ?? ''));
        const defaultPrice = (!isNaN(rawAmt) && rawAmt > 0)
            ? rawAmt
            : (!isNaN(rawBasic) && rawBasic > 0 ? rawBasic : 0);
        const initialAmount = customAmount !== undefined
            ? customAmount
            : (defaultPrice > 0 ? defaultPrice : '');

        this.selectedSevas.push({
            sevaCode: code,
            description: item.Description,
            amount: initialAmount,
            isCustomPrice: defaultPrice <= 0,
        });
        return true;
    }

    removeSeva(code: string): void {
        this.selectedSevas = this.selectedSevas.filter(s => s.sevaCode !== code);
    }

    updateSevaAmount(code: string, amount: number | ''): void {
        this.selectedSevas = this.selectedSevas.map(s => {
            if (s.sevaCode === code) {
                return { ...s, amount: amount === '' || isNaN(Number(amount)) ? '' : Number(amount) };
            }
            return s;
        });
    }

    setSelectedSevas(sevas: SelectedSevaEntry[]): void {
        this.selectedSevas = sevas.slice(0, MAX_SEVAS_PER_BOOKING);
    }

    getSelectedSevas(): SelectedSevaEntry[] {
        return [...this.selectedSevas];
    }

    clearSevas(): void {
        this.selectedSevas = [];
    }

    // ─── Seva Date Management ───
    setSevaDate(date: Date | string | null): void {
        if (!date) {
            this.selectedDate = null;
            return;
        }
        if (typeof date === 'string') {
            this.selectedDate = new Date(date);
        } else {
            this.selectedDate = new Date(date);
        }
    }

    getSevaDate(): Date | null {
        return this.selectedDate ? new Date(this.selectedDate) : null;
    }

    // ─── Hastodaka (Anna Prasada) Management ───
    setHastodaka(optPrasada: boolean, familyMembers: number, rate: number | string): void {
        this.optPrasada = Boolean(optPrasada);
        this.familyMembers = Math.max(0, parseInt(String(familyMembers), 10) || 0);
        const parsedRate = parseFloat(String(rate));
        this.foodServiceRate = !isNaN(parsedRate) && parsedRate > 0 ? parsedRate : 200;
    }

    isHastodakaOpted(): boolean {
        return this.optPrasada;
    }

    getFamilyMembers(): number {
        return this.familyMembers;
    }

    getHastodakaRate(): number {
        return this.foodServiceRate;
    }

    // ─── Pricing Calculation ───
    calculatePricing(): BookingPricingSummary {
        let baseAmount = 0;
        for (const s of this.selectedSevas) {
            if (typeof s.amount === 'number' && !isNaN(s.amount)) {
                baseAmount += s.amount;
            }
        }

        const hastodakaAmount = this.optPrasada ? this.familyMembers * this.foodServiceRate : 0;
        const totalAmount = baseAmount + hastodakaAmount;

        return {
            baseAmount,
            hastodakaRate: this.foodServiceRate,
            hastodakaAmount,
            totalAmount,
            itemCount: this.selectedSevas.length,
        };
    }

    // ─── Validations ───
    validateDevotee(): ValidationResult {
        if (!this.devotee || !this.devotee.Name.trim()) {
            return { valid: false, error: 'ಹೆಸರು ಕಡ್ಡಾಯವಾಗಿದೆ (Devotee name is required)' };
        }
        if (!this.devotee.Phone.trim()) {
            return { valid: false, error: 'ಫೋನ್ ಸಂಖ್ಯೆ ಕಡ್ಡಾಯವಾಗಿದೆ (Phone number is required)' };
        }
        return { valid: true };
    }

    validateSeva(catalogItems: SevaCatalogItem[] = [], now: Date = new Date()): ValidationResult {
        if (!this.selectedDate) {
            return { valid: false, error: 'ದಯವಿಟ್ಟು ಸೇವಾ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ (Please select seva date)' };
        }
        if (this.selectedSevas.length === 0) {
            return { valid: false, error: 'ದಯವಿಟ್ಟು ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ (Please select seva)' };
        }

        // Prevent booking dates in the past
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const selDate = new Date(this.selectedDate);
        selDate.setHours(0, 0, 0, 0);

        if (selDate < today) {
            return { valid: false, error: 'ಹಿಂದಿನ ದಿನಾಂಕಗಳಿಗೆ ಸೇವೆ ಬುಕ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ (Cannot book for past dates)' };
        }

        // Check if event start time has already passed for today
        if (selDate.getTime() === today.getTime() && catalogItems.length > 0) {
            for (const selected of this.selectedSevas) {
                const item = catalogItems.find(
                    i => String(i.SevaCode ?? i.ItemCode) === String(selected.sevaCode)
                );
                if (item && item.IsSpecialEvent && item.StartTime && !item.IsAllDay) {
                    const timeParts = item.StartTime.split(':');
                    if (timeParts.length >= 2) {
                        const eventHours = parseInt(timeParts[0], 10);
                        const eventMins = parseInt(timeParts[1], 10);
                        if (
                            now.getHours() > eventHours ||
                            (now.getHours() === eventHours && now.getMinutes() >= eventMins)
                        ) {
                            return {
                                valid: false,
                                error: `ಈ ಸೇವೆಯ ಸಮಯ ಮುಕ್ತಾಯವಾಗಿದೆ (Event time ${item.StartTime} has passed for today)`,
                            };
                        }
                    }
                }
            }
        }

        return { valid: true };
    }

    validateAll(catalogItems: SevaCatalogItem[] = [], now: Date = new Date()): ValidationResult {
        const devoteeValidation = this.validateDevotee();
        if (!devoteeValidation.valid) return devoteeValidation;
        return this.validateSeva(catalogItems, now);
    }

    // ─── Payload Assembly ───
    buildRegistrationPayloads(
        devoteeId: number,
        voucherNo: string,
        payment: PaymentDetails,
        registrationDate: Date = new Date()
    ): SevaRegistrationPayload[] {
        if (!this.selectedDate) {
            throw new Error('Cannot build registration payloads without a selected seva date');
        }

        const regDdmmyy = formatDateToDdmmyy(registrationDate);
        const sevaDdmmyy = formatDateToDdmmyy(this.selectedDate);
        const pricing = this.calculatePricing();

        const payloads: SevaRegistrationPayload[] = [];

        for (let i = 0; i < this.selectedSevas.length; i++) {
            const s = this.selectedSevas[i];
            const baseAmount = typeof s.amount === 'number' ? s.amount : 0;
            // Invariant: Hastodaka is allocated ONLY to the primary (first) seva to avoid duplicate accounting entries
            const isFirst = (i === 0);
            const totalForSeva = baseAmount + (isFirst ? pricing.hastodakaAmount : 0);

            const paymentDetails = payment.paymentMode === 'UPI' ? payment.upiDetails :
                (payment.paymentMode === 'Cheque' || payment.paymentMode === 'DD') ? payment.chqDetails :
                payment.paymentMode === 'Netbanking' ? payment.netDetails : null;

            const payload: SevaRegistrationPayload = {
                RegistrationDate: regDdmmyy,
                SevaDate: sevaDdmmyy,
                DevoteeId: devoteeId,
                SevaCode: s.sevaCode,
                Qty: 1,
                Rate: baseAmount,
                Amount: baseAmount,
                GrandTotal: totalForSeva,
                OptTheerthaPrasada: isFirst ? this.optPrasada : false,
                PrasadaCount: isFirst && this.optPrasada ? this.familyMembers : 0,
                PrasadaOpted: isFirst && this.optPrasada,
                FamilyCount: isFirst ? this.familyMembers : 0,
                PaymentMode: payment.paymentMode,
                VoucherNo: voucherNo,
                PaymentRef: payment.paymentRef || undefined,
                PaymentReference: payment.paymentRef || null,
                PaymentDetails: paymentDetails,
                Remarks: null,
            };

            if (payment.paymentMode === 'UPI' && payment.upiDetails) {
                payload.UpiGateway = payment.upiDetails.gateway;
                payload.UpiTransactionId = payment.upiDetails.transactionId;
                payload.UpiVpa = payment.upiDetails.vpa;
            } else if ((payment.paymentMode === 'Cheque' || payment.paymentMode === 'DD') && payment.chqDetails) {
                payload.ChequeNumber = payment.chqDetails.number;
                payload.ChequeBank = payment.chqDetails.bank;
                payload.ChequeBranch = payment.chqDetails.branch;
                payload.ChequeDate = payment.chqDetails.date;
            } else if (payment.paymentMode === 'Netbanking' && payment.netDetails) {
                payload.BankName = payment.netDetails.bank;
                payload.UtrNumber = payment.netDetails.utr;
                payload.TransferDate = payment.netDetails.date;
            }

            payloads.push(payload);
        }

        return payloads;
    }

    // ─── Reset ───
    reset(): void {
        this.devotee = null;
        this.selectedSevas = [];
        this.selectedDate = null;
        this.optPrasada = false;
        this.familyMembers = 0;
        this.foodServiceRate = 200;
    }
}
