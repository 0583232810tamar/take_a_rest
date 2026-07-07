import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';
import api from '../api';
import AdminPendingList from './AdminPendingList';
import ApartmentEditDialog from './ApartmentEditDialog';

// fetch all apartments for admin

interface AdminDashboardProps {
    onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
    const [pendingApartments, setPendingApartments] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [allApartments, setAllApartments] = useState<any[]>([]);
    const [editOpen, setEditOpen] = useState(false);
    const [editApt, setEditApt] = useState<any | null>(null);

    const fetchPending = async () => {
        try {
            const res = await api.get('/apartments/admin/pending');
            setPendingApartments(res.data);
        } catch (err) {
            console.error("שגיאה בשליפת דירות ממתינות", err);
        }
    };

    useEffect(() => {
        fetchPending();
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const res = await api.get('/apartments/admin/all');
            setAllApartments(res.data);
        } catch (err) { console.error('שגיאה בשליפת כל הדירות', err); }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.put(`/apartments/${id}/approve`);
            setMessage('הדירה אושרה בהצלחה!');
            fetchPending();
            fetchAll();
        } catch (err) {
            setMessage('שגיאה באישור הדירה');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button onClick={onBack} sx={{ mb: 2 }}>← חזור לדף הבית</Button>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>לוח ניהול - אישור דירות</Typography>
            {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}
            <Paper sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ p: 2 }}>דירות שממתינות לאישור</Typography>
                <List>
                    {pendingApartments.length === 0 ? (
                        <ListItem><ListItemText primary="אין דירות שממתינות לאישור כרגע" /></ListItem>
                    ) : (
                        pendingApartments.map((apt) => (
                            <React.Fragment key={apt._id}>
                                <ListItem>
                                    <ListItemText primary={apt.title} secondary={`בעלים: ${apt.ownerEmail}`} />
                                    <Button variant="contained" color="success" onClick={() => handleApprove(apt._id)}>אשר דירה</Button>
                                    <Button variant="outlined" sx={{ ml: 1 }} onClick={() => { setEditApt(apt); setEditOpen(true); }}>ערוך</Button>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))
                    )}
                </List>
            </Paper>

            <Paper sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ p: 2 }}>כל הדירות במערכת</Typography>
                <List>
                    {allApartments.length === 0 ? (
                        <ListItem><ListItemText primary="אין דירות במערכת" /></ListItem>
                    ) : (
                        allApartments.map((apt) => (
                            <React.Fragment key={apt._id}>
                                <ListItem>
                                    <ListItemText primary={apt.title} secondary={`בעלים: ${apt.ownerEmail || '---'}`} />
                                    <Button variant="outlined" onClick={() => { setEditApt(apt); setEditOpen(true); }}>ערוך</Button>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))
                    )}
                </List>
            </Paper>
            <AdminPendingList />
            <ApartmentEditDialog open={editOpen} onClose={() => { setEditOpen(false); setEditApt(null); }} apartment={editApt} onSaved={() => { setEditOpen(false); fetchAll(); fetchPending(); }} />
        </Box>
    );
}