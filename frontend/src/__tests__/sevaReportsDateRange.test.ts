import { describe, it, expect, vi } from 'vitest';
import { REPORTS_REGISTRY } from '../components/seva/SevaReportsTab';
import { statsApi, sevaReportsApi } from '../api';
import api from '../api';

describe('Seva Reports Date Range Support', () => {
    it('daily operations reports are single day only (supportsDateRange: false)', () => {
        const priestReport = REPORTS_REGISTRY.find(r => r.id === 'daily_priest');
        const kitchenReport = REPORTS_REGISTRY.find(r => r.id === 'daily_kitchen');

        expect(priestReport).toBeDefined();
        expect(priestReport?.category).toBe('daily');
        expect(priestReport?.supportsDateRange).toBe(false);

        expect(kitchenReport).toBeDefined();
        expect(kitchenReport?.category).toBe('daily');
        expect(kitchenReport?.supportsDateRange).toBe(false);
    });

    it('on-demand reports support date range selection (supportsDateRange: true)', () => {
        const onDemandReports = REPORTS_REGISTRY.filter(r => r.category === 'on_demand');
        expect(onDemandReports.length).toBeGreaterThan(0);

        onDemandReports.forEach(report => {
            expect(report.supportsDateRange).toBe(true);
        });

        // Also financial summary supports date range
        const finReport = REPORTS_REGISTRY.find(r => r.id === 'financial_summary');
        expect(finReport?.supportsDateRange).toBe(true);
    });

    it('contains expected reports in registry', () => {
        const ids = REPORTS_REGISTRY.map(r => r.id);
        expect(ids).toContain('daily_priest');
        expect(ids).toContain('daily_kitchen');
        expect(ids).toContain('on_demand_full');
        expect(ids).toContain('hastodaka_distribution');
        expect(ids).toContain('financial_summary');
        expect(ids).toContain('exigency_exceptions');
    });

    it('statsApi.dailySummary passes end_date when provided', async () => {
        const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
            data: {
                total_registrations: 25,
                total_income: 15000,
                total_expense: 3000,
                payment_breakdown: { 'Cash': { count: 10, total: 5000 }, 'UPI': { count: 15, total: 10000 } }
            }
        });

        // Test single date
        await statsApi.dailySummary('061126');
        expect(getSpy).toHaveBeenLastCalledWith('/stats/daily-summary?date=061126');

        // Test date range
        await statsApi.dailySummary('061126', '081126');
        expect(getSpy).toHaveBeenLastCalledWith('/stats/daily-summary?date=061126&end_date=081126');

        getSpy.mockRestore();
    });

    it('sevaReportsApi.getSevaBookings passes start_date, end_date and date_type', async () => {
        const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
            data: {
                report_type: 'on_demand_full',
                start_date: '2026-11-06',
                end_date: '2026-11-08',
                start_date_formatted: '06/11/2026',
                end_date_formatted: '08/11/2026',
                is_single_day: false,
                total_bookings: 12,
                total_devotees: 10,
                days: [
                    { iso_date: '2026-11-06', formatted_date: '06/11/2026', day_bookings: 6, sevas: [] },
                    { iso_date: '2026-11-07', formatted_date: '07/11/2026', day_bookings: 4, sevas: [] },
                    { iso_date: '2026-11-08', formatted_date: '08/11/2026', day_bookings: 2, sevas: [] }
                ]
            }
        });

        const res = await sevaReportsApi.getSevaBookings({
            start_date: '2026-11-06',
            end_date: '2026-11-08',
            report_type: 'on_demand_full',
            date_type: 'SevaDate'
        });

        expect(getSpy).toHaveBeenCalledWith('/reports/seva-bookings', {
            params: {
                start_date: '2026-11-06',
                end_date: '2026-11-08',
                report_type: 'on_demand_full',
                date_type: 'SevaDate'
            }
        });
        expect(res.data.is_single_day).toBe(false);
        expect(res.data.days).toHaveLength(3);

        getSpy.mockRestore();
    });

    it('sevaReportsApi.getHastodaka passes start_date and end_date', async () => {
        const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
            data: {
                start_date: '2026-11-06',
                end_date: '2026-11-08',
                is_single_day: false,
                grand_total_hastodaka: 150,
                days: [
                    { iso_date: '2026-11-06', formatted_date: '06/11/2026', day_total_hastodaka: 50, sevas: [] },
                    { iso_date: '2026-11-07', formatted_date: '07/11/2026', day_total_hastodaka: 60, sevas: [] },
                    { iso_date: '2026-11-08', formatted_date: '08/11/2026', day_total_hastodaka: 40, sevas: [] }
                ]
            }
        });

        const res = await sevaReportsApi.getHastodaka({
            start_date: '2026-11-06',
            end_date: '2026-11-08'
        });

        expect(getSpy).toHaveBeenCalledWith('/reports/hastodaka', {
            params: {
                start_date: '2026-11-06',
                end_date: '2026-11-08'
            }
        });
        expect(res.data.is_single_day).toBe(false);
        expect(res.data.grand_total_hastodaka).toBe(150);

        getSpy.mockRestore();
    });
});
