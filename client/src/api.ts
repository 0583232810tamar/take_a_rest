import axios from 'axios';

// בסביבת ה־build ניתן להגדיר `VITE_API_BASE_URL` (ל‑Vercel וכו')
// אחרת: בפיתוח נשתמש ב־localhost; בפרודקשן נפל בקש על onrender
const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
const base = envBase
    ? envBase
    : (window.location.hostname === 'localhost' ? 'http://localhost:5001' : 'https://take-a-rest.onrender.com');

const api = axios.create({ baseURL: `${base}/api` });

// הוספת הטוקן לכל בקשה באופן אוטומטי
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;