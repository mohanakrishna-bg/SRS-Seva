import axios from 'axios';

const API_BASE = 'http://localhost:8001/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor — attach token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('seva_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response error handler
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('seva_token');
        }
        return Promise.reject(err);
    }
);

// --- Customer API ---
export const customerApi = {
    list: (skip = 0, limit = 2000) => api.get(`/customers?skip=${skip}&limit=${limit}`),
    search: (q: string) => api.get(`/customers/search?q=${encodeURIComponent(q)}`),
    get: (id: number) => api.get(`/customers/${id}`),
    create: (data: any) => api.post('/customers', data),
    update: (id: number, data: any) => api.put(`/customers/${id}`, data),
    delete: (id: number) => api.delete(`/customers/${id}`),
};

// --- Items / Sevas API ---
export const sevaApi = {
    list: () => api.get('/items'),
};

// --- Invoice API ---
export const invoiceApi = {
    create: (data: any) => api.post('/invoices', data),
    list: () => api.get('/invoices'),
};

// --- Auth API ---
export const authApi = {
    login: (username: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        return api.post('/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    },
};

// --- Upload API ---
export const uploadApi = {
    image: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export default api;
