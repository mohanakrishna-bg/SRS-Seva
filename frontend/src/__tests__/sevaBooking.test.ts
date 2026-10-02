import { describe, it, expect } from 'vitest';
import {
    SevaBookingCart,
    MAX_SEVAS_PER_BOOKING,
    type SevaCatalogItem,
} from '../domain/booking';

describe('SevaBookingCart Domain Aggregate', () => {
    const catalog: SevaCatalogItem[] = [
        { SevaCode: 'SEVA001', Description: 'ಗಣಪತಿ ಹೋಮ', Amount: 500 },
        { SevaCode: 'SEVA002', Description: 'ನವಗ್ರಹ ಶಾಂತಿ', Amount: 350 },
        { SevaCode: 'SEVA003', Description: 'ಮಹಾಮಂಗಳಾರತಿ', Amount: 100 },
        { SevaCode: 'SEVA004', Description: 'ಅಷ್ಟೋತ್ತರ', Amount: 50 },
        { SevaCode: 'SEVA005', Description: 'ಕನಕಾಭಿಷೇಕ', Amount: 1000 },
        {
            SevaCode: 'EVENT001',
            Description: 'ವಿಶೇಷ ಪೂಜೆ',
            Amount: 250,
            IsSpecialEvent: true,
            StartTime: '10:00',
            IsAllDay: false,
        },
    ];

    it('enforces maximum of 4 sevas per booking order', () => {
        const cart = new SevaBookingCart();
        expect(cart.addSeva(catalog[0])).toBe(true);
        expect(cart.addSeva(catalog[1])).toBe(true);
        expect(cart.addSeva(catalog[2])).toBe(true);
        expect(cart.addSeva(catalog[3])).toBe(true);
        // 5th seva should be rejected
        expect(cart.addSeva(catalog[4])).toBe(false);
        expect(cart.getSelectedSevas().length).toBe(MAX_SEVAS_PER_BOOKING);
    });

    it('prevents adding duplicate sevas to the same order', () => {
        const cart = new SevaBookingCart();
        expect(cart.addSeva(catalog[0])).toBe(true);
        expect(cart.addSeva(catalog[0])).toBe(false);
        expect(cart.getSelectedSevas().length).toBe(1);
    });

    it('normalizes legacy devotee fields (Sgotra, SNakshatra, ID1) at the interface seam', () => {
        const cart = new SevaBookingCart();
        cart.setDevotee({
            Name: '  ರಾಘವೇಂದ್ರ ರಾವ್  ',
            Phone: ' 9876543210 ',
            ID1: 42,
            Sgotra: 'ಕಶ್ಯಪ',
            SNakshatra: 'ಅಶ್ವಿನಿ',
            Email_ID: 'devotee@example.com',
            City: 'ಮೈಸೂರು',
        });

        const dev = cart.getDevotee();
        expect(dev).toBeDefined();
        expect(dev?.Name).toBe('ರಾಘವೇಂದ್ರ ರಾವ್');
        expect(dev?.Phone).toBe('9876543210');
        expect(dev?.DevoteeId).toBe(42);
        expect(dev?.Gotra).toBe('ಕಶ್ಯಪ');
        expect(dev?.Nakshatra).toBe('ಅಶ್ವಿನಿ');
        expect(dev?.Email).toBe('devotee@example.com');
    });

    it('calculates multi-seva total and computes Hastodaka addon correctly', () => {
        const cart = new SevaBookingCart();
        cart.addSeva(catalog[0]); // 500
        cart.addSeva(catalog[1]); // 350
        cart.setHastodaka(true, 3, '200'); // 3 * 200 = 600

        const pricing = cart.calculatePricing();
        expect(pricing.baseAmount).toBe(850);
        expect(pricing.hastodakaAmount).toBe(600);
        expect(pricing.totalAmount).toBe(1450);
        expect(pricing.itemCount).toBe(2);
    });

    it('allocates Hastodaka ONLY to the primary seva in generated payloads to prevent duplicate ledger entries', () => {
        const cart = new SevaBookingCart();
        cart.addSeva(catalog[0]); // 500
        cart.addSeva(catalog[1]); // 350
        cart.setSevaDate('2026-10-15');
        cart.setHastodaka(true, 2, 200); // 400

        const payloads = cart.buildRegistrationPayloads(101, 'VCH-999', { paymentMode: 'Cash' });
        expect(payloads.length).toBe(2);

        // First seva: absorbs full Hastodaka into GrandTotal
        expect(payloads[0].SevaCode).toBe('SEVA001');
        expect(payloads[0].Rate).toBe(500);
        expect(payloads[0].Amount).toBe(500); // base price
        expect(payloads[0].GrandTotal).toBe(900); // 500 + 400
        expect(payloads[0].OptTheerthaPrasada).toBe(true);
        expect(payloads[0].PrasadaCount).toBe(2);

        // Second seva: clean base price only
        expect(payloads[1].SevaCode).toBe('SEVA002');
        expect(payloads[1].Rate).toBe(350);
        expect(payloads[1].Amount).toBe(350);
        expect(payloads[1].GrandTotal).toBe(350);
        expect(payloads[1].OptTheerthaPrasada).toBe(false);
        expect(payloads[1].PrasadaCount).toBe(0);

        // Sum of GrandTotals matches total
        const total = payloads[0].GrandTotal + payloads[1].GrandTotal;
        expect(total).toBe(1250);
    });

    it('rejects booking dates in the past', () => {
        const cart = new SevaBookingCart();
        cart.addSeva(catalog[0]);
        cart.setDevotee({ Name: 'ಭಕ್ತ', Phone: '9999999999' });

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        cart.setSevaDate(pastDate);

        const result = cart.validateSeva(catalog);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('ಹಿಂದಿನ ದಿನಾಂಕಗಳಿಗೆ');
    });

    it('rejects same-day booking if special event start time has already passed', () => {
        const cart = new SevaBookingCart();
        cart.addSeva(catalog[5]); // EVENT001: StartTime '10:00'
        const today = new Date();
        cart.setSevaDate(today);

        // Simulate 11:30 AM
        const mockNow = new Date(today);
        mockNow.setHours(11, 30, 0, 0);

        const result = cart.validateSeva(catalog, mockNow);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('ಸಮಯ ಮುಕ್ತಾಯವಾಗಿದೆ');
    });
});
