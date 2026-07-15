import axios from 'axios';

const baseURL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001' 
  : 'https://take-a-rest.onrender.com';

const api = axios.create({
    baseURL: baseURL
});

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