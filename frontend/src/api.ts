import axios from 'axios';

// API routes are proxied by Vite or Vercel, or set via VITE_API_BASE env var.
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('seva_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('seva_token');
        }
        return Promise.reject(err);
    }
);

// ─── Devotee API ───
export const devoteeApi = {
    list: (skip = 0, limit = 2000) =>
        api.get(`/devotees?skip=${skip}&limit=${limit}`),
    get: (id: number) => api.get(`/devotees/${id}`),
    create: (data: any) => api.post('/devotees', data),
    update: (id: number, data: any) => api.put(`/devotees/${id}`, data),
    delete: (id: number, permanent = false) =>
        api.delete(`/devotees/${id}?permanent=${permanent}`),
    cleanup: () => api.post('/devotees/cleanup'),
    searchBasic: (q: string) =>
        api.get(`/devotees/search/basic?q=${encodeURIComponent(q)}`),
    searchAdvanced: (params: Record<string, string>) => {
        const qs = new URLSearchParams(params).toString();
        return api.get(`/devotees/search/advanced?${qs}`);
    },
    uploadPhoto: (id: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/devotees/${id}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ─── Seva API ───
export const sevaApi = {
    list: () => api.get('/sevas'),
    create: (data: any) => api.post('/sevas', data),
    update: (code: string, data: any) => api.put(`/sevas/${code}`, data),
    delete: (code: string) => api.delete(`/sevas/${code}`),
};

// ─── Events API ───
export const eventsApi = {
    calendar: (date: string) => api.get(`/events/calendar?date=${date}`),
};

// ─── Registration API ───
export const registrationApi = {
    list: (skip = 0, limit = 100) =>
        api.get(`/registrations?skip=${skip}&limit=${limit}`),
    create: (data: any) => api.post('/registrations', data),
    byDevotee: (id: number) => api.get(`/registrations/by-devotee/${id}`),
    byDate: (date: string, dateType: string = "SevaDate") => api.get(`/registrations/by-date/${date}?date_type=${dateType}`),
    fulfil: (id: number, isFulfilled: boolean) => api.put(`/registrations/${id}/fulfil?is_fulfilled=${isFulfilled}`),
    cancel: (id: number, data: { refund_amount: number; refund_mode: string }) => api.put(`/registrations/${id}/cancel`, data),
    modify: (id: number, data: any) => api.put(`/registrations/${id}/modify`, data),
};

// ─── Lookup API ───
export const lookupApi = {
    gotra: () => api.get('/lookups/gotra'),
    nakshatra: () => api.get('/lookups/nakshatra'),
};

// ─── Stats API ───
export const statsApi = {
    daily: (date: string) => api.get(`/stats/daily?date=${date}`),
    dailySummary: (date: string) => api.get(`/stats/daily-summary?date=${date}`),
};

// ─── Auth API ───
export const authApi = {
    login: (username: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        return api.post('/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    },
    me: () => api.get('/me'),
    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/change-password', { current_password: currentPassword, new_password: newPassword }),
};

// ─── Users API (Admin) ───
export const usersApi = {
    list: (role?: string) => api.get('/users', { params: role ? { role } : {} }),
    get: (id: number) => api.get(`/users/${id}`),
    create: (data: { username: string; password: string; role: string; display_name?: string; modules?: Record<string, string> | null }) =>
        api.post('/users', data),
    update: (id: number, data: any) => api.put(`/users/${id}`, data),
    delete: (id: number) => api.delete(`/users/${id}`),
    resetPassword: (id: number, newPassword: string) =>
        api.post(`/users/${id}/reset-password?new_password=${encodeURIComponent(newPassword)}`),
    getRoles: () => api.get('/users/roles/available'),
    getPermissionMatrix: () => api.get('/users/permissions/matrix'),
    getAuditLog: (targetUserId?: number, limit?: number) =>
        api.get('/users/audit-log', { params: { target_user_id: targetUserId, limit } }),
};

// ─── Roles API (Admin) ───
export const rolesApi = {
    list: () => api.get('/roles'),
    get: (id: number) => api.get(`/roles/${id}`),
    create: (data: { name: string; label: string; description?: string; permissions: Record<string, string> }) =>
        api.post('/roles', data),
    update: (id: number, data: { label?: string; description?: string; permissions?: Record<string, string> }) =>
        api.put(`/roles/${id}`, data),
    delete: (id: number) => api.delete(`/roles/${id}`),
    getModulesMeta: () => api.get('/roles/modules-meta'),
};

// ─── Legacy (backward compat) ───
export const customerApi = {
    list: (skip = 0, limit = 2000) => api.get(`/customers?skip=${skip}&limit=${limit}`),
    search: (q: string) => api.get(`/customers/search?q=${encodeURIComponent(q)}`),
    get: (id: number) => api.get(`/customers/${id}`),
    create: (data: any) => api.post('/customers', data),
    update: (id: number, data: any) => api.put(`/customers/${id}`, data),
    delete: (id: number) => api.delete(`/customers/${id}`),
};

export const invoiceApi = {
    create: (data: any) => api.post('/invoices', data),
    list: () => api.get('/invoices'),
};

export const uploadApi = {
    image: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const paymentApi = {
    verifyUPI: (data: { gateway: string, transaction_id: string }) => 
        api.post('/payments/verify-upi', data),
};

export const accountingApi = {
    getAccounts: () => api.get('/accounting/accounts'),
    getJournal: (params?: any) => api.get('/accounting/journal', { params }),
    getBankAccounts: () => api.get('/accounting/bank-accounts'),
    createBankAccount: (data: any) => api.post('/accounting/bank-accounts', data),
    getBankTransactions: (params?: any) => api.get('/accounting/bank-transactions', { params }),
    createBankTransaction: (data: any) => api.post('/accounting/bank-transactions', data),
    reconcileTransaction: (id: number, status: string = 'Reconciled') => api.post(`/accounting/bank-transactions/${id}/reconcile?status=${status}`),
    getExpenseAccounts: () => api.get('/accounting/accounts/expenses'),
    saveExpenseVoucher: (data: any) => api.post('/accounting/expenses', data),
    closeDay: (date: string) => api.post('/accounting/close-day', { Date: date }),
    getLedgerDrilldown: (accountId: string | number) => api.get(`/accounting/ledger/${accountId}`),
};

export const reportsApi = {
    getCollectionSummary: (from: string, to: string) => 
        api.get(`/accounting/reports/collection?from_date=${from}&to_date=${to}`),
    getIncomeExpenditure: (from?: string, to?: string) => 
        api.get('/accounting/reports/income-expenditure', { params: { from_date: from, to_date: to } }),
    getBalanceSheet: (asOf?: string) => 
        api.get('/accounting/reports/balance-sheet', { params: { as_of: asOf } }),
    getReceiptsPayments: (from?: string, to?: string) =>
        api.get('/accounting/reports/receipts-payments', { params: { from_date: from, to_date: to } }),
    getBankReconciliation: (bankId: number) =>
        api.get(`/accounting/reports/bank-reconciliation?bank_id=${bankId}`),
};

export const testApi = {
    simulate: () => api.post('/test/simulate'),
    cleanup: () => api.delete('/test/cleanup'),
};

// ─── Inventory API ───
export const inventoryApi = {
    // Items
    listItems: (params?: { search?: string; category?: string; material?: string; item_type?: string; include_deleted?: boolean }) =>
        api.get('/inventory/items', { params }),
    getItem: (id: number) => api.get(`/inventory/items/${id}`),
    createItem: (data: any) => api.post('/inventory/items', data),
    updateItem: (id: number, data: any) => api.put(`/inventory/items/${id}`, data),
    deleteItem: (id: number, hard = false, reason?: string) => 
        api.delete(`/inventory/items/${id}`, { params: { hard, reason } }),
    restoreItem: (id: number) => api.put(`/inventory/items/${id}/restore`),
    uncategorizedImages: () => api.get('/inventory/uncategorized-images'),
    browseImages: (category?: string) => api.get('/inventory/browse-images', { params: { category } }),
    discardUncategorizedImage: (filename: string) => api.delete(`/inventory/uncategorized-images/${filename}`),
    uploadToUncategorized: (files: FileList | File[]) => {
        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('files', f));
        return api.post('/inventory/uncategorized-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    // Categories
    listCategories: (forType?: string) => api.get('/inventory/categories', { params: forType ? { for_type: forType } : {} }),
    createCategory: (data: { Name: string; ForType?: string }) => api.post('/inventory/categories', data),
    deleteCategory: (id: number) => api.delete(`/inventory/categories/${id}`),
    // Materials
    listMaterials: () => api.get('/inventory/materials'),
    createMaterial: (data: { Name: string; BullionRate?: number }) => api.post('/inventory/materials', data),
    updateMaterial: (id: number, data: { BullionRate: number }) => api.put(`/inventory/materials/${id}`, data),
    // Locations
    listLocations: () => api.get('/inventory/locations'),
    createLocation: (data: { Name: string; Description?: string }) => api.post('/inventory/locations', data),
    deleteLocation: (id: number) => api.delete(`/inventory/locations/${id}`),
    // Revaluation
    revalueAll: () => api.post('/inventory/revalue'),
    refreshBullionRates: () => api.post('/inventory/bullion-rates-refresh'),
    // Audit
    auditLog: (params?: { item_id?: number; action?: string; limit?: number }) =>
        api.get('/inventory/audit-log', { params }),
    // Summary
    summary: (params?: { item_type?: string }) => api.get('/inventory/summary', { params }),
    // Wipe Test Data
    wipeTestData: () => api.delete('/inventory/test-data'),
    // Reports Export
    exportReport: (params?: { item_type?: string; category?: string; material?: string; search?: string; include_deleted?: boolean }) => {
        const qs = new URLSearchParams(params as any).toString();
        return `${API_BASE}/inventory/reports/export?${qs}`;
    },
    // Donations
    createDonation: (data: any) => api.post('/inventory/donations', data),
    listDonations: (params?: any) => api.get('/inventory/donations', { params }),
    getDonation: (id: number) => api.get(`/inventory/donations/${id}`),
    // Image Sync
    syncConfig: () => api.get('/inventory/sync/config'),
    updateSyncConfig: (data: any) => api.put('/inventory/sync/config', data),
    syncInbox: () => api.get('/inventory/sync/inbox'),
    runSync: (data: any) => api.post('/inventory/sync/run', data),
    syncUpload: (files: File[] | FileList) => {
        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('files', f));
        return api.post('/inventory/sync/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    syncCheckpoints: () => api.get('/inventory/sync/checkpoints'),
    // Quick Capture (Mobile Camera → Repository)
    quickCapture: (file: File, metadata?: { item_name?: string; category?: string; notes?: string }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (metadata?.item_name) formData.append('item_name', metadata.item_name);
        if (metadata?.category) formData.append('category', metadata.category);
        if (metadata?.notes) formData.append('notes', metadata.notes);
        return api.post('/inventory/quick-capture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ─── Settings API ───
export const settingsApi = {
    get: (key: string) => api.get(`/settings/${key}`),
    list: () => api.get('/settings'),
    save: (key: string, value: any) => api.post('/settings', { key, value }),
};

export default api;
