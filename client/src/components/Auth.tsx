import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import api from '../api';

interface AuthProps {
    onLoginSuccess: (user: any) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // שדות נוספים עבור הרשמה (מתואם למודל המשתמש בשרת)
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    
    const [message, setMessage] = useState({ text: '', isError: false });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ text: '', isError: false });

        // שינוי לכתובות המדויקות שהשרת מגדיר (ה־api.baseURL כבר שומר /api)
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        // בניית הגוף של הבקשה בהתאם לסוג הפעולה - מייצרים `fullName` לפי השרת
        const payload = isLogin
            ? { email, password }
            : { email, password, fullName: name, phone, city };

        try {
            const response = await api.post(endpoint, payload);
            
            if (isLogin) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setMessage({ text: 'התחברת בהצלחה!', isError: false });
                onLoginSuccess(response.data.user);
            } else {
                setMessage({ text: 'נרשמת בהצלחה! עובר למסך התחברות...', isError: false });
                setTimeout(() => setIsLogin(true), 2000);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'התרחשה שגיאה בתקשורת עם השרת';
            setMessage({ text: errorMsg, isError: true });
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8, direction: 'rtl' }}>
            <Paper elevation={4} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
                <Typography variant="h5" component="h1" gutterBottom fontWeight="bold" color="primary">
                    {isLogin ? 'כניסת משתמש' : 'הרשמה למערכת הנופש'}
                </Typography>
                
                {message.text && (
                    <Alert severity={message.isError ? 'error' : 'success'} sx={{ mb: 2, textAlign: 'right' }}>
                        {message.text}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {!isLogin && (
                        <>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="שם מלא"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="מספר טלפון נייד"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="05XXXXXXXX"
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="עיר מגורים"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </>
                    )}

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="כתובת אימייל"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        slotProps={{ htmlInput: { style: { textAlign: 'right', direction: 'ltr' } } }}
                    />
                    
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="סיסמה"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        slotProps={{ htmlInput: { style: { textAlign: 'right', direction: 'ltr' } } }}
                    />

                    <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2, py: 1.2, fontWeight: 'bold', borderRadius: '10px' }}>
                        {isLogin ? 'התחבר למערכת' : 'סיום הרשמה ויצירת חשבון'}
                    </Button>
                    
                    <Button fullWidth variant="text" onClick={() => setIsLogin(!isLogin)} sx={{ color: 'text.secondary' }}>
                        {isLogin ? 'אין לך חשבון חשבון? הירשם כאן' : 'כבר רשום במערכת? היכנס כאן'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}