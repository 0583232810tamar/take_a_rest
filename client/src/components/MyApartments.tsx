import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Button, Divider, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel, Select, MenuItem } from '@mui/material';
import api from '../api';
import ApartmentEditDialog from './ApartmentEditDialog';

interface MyApartmentsProps {
    onBack: () => void;
    onEdit: (apt: any) => void;
}

export default function MyApartments({ onBack, onEdit }: MyApartmentsProps) {
    const [myApartments, setMyApartments] = useState<any[]>([]);
    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState<any | null>(null);
    const [message, setMessage] = useState('');

    const fetchMyApartments = async () => {
        try {
            const res = await api.get('/apartments/my-apartments');
            setMyApartments(res.data);
        } catch (err) {
            console.error("שגיאה בטעינת הדירות שלי", err);
        }
    };

    useEffect(() => {
        fetchMyApartments();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('בטוחה שאת רוצה למחוק את הדירה הזו? פעולה זו לא ניתנת לביטול.')) return;
        try {
            await api.delete(`/apartments/${id}`);
            setMessage('הדירה נמחקה בהצלחה');
            fetchMyApartments();
        } catch (err:any) {
            console.error('שגיאה במחיקה', err);
            setMessage('שגיאה במחיקת הדירה');
        }
    };

    const handleOpenEdit = (apt:any) => {
        setEditData({ ...apt });
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editData) return;
        try {
            const payload = { ...editData };
            // Remove nested owner object to avoid sending huge payload
            delete payload.owner;
            await api.put(`/apartments/${editData._id}`, payload);
            setEditOpen(false);
            setMessage('הדירה עודכנה וממתינה לאישור');
            fetchMyApartments();
        } catch (err:any) {
            console.error('שגיאה בעדכון', err);
            setMessage('שגיאה בעדכון הדירה');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button onClick={onBack} sx={{ mb: 2 }}>← חזור לדף הבית</Button>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>הדירות שלי</Typography>
            
            {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}
            <Paper>
                <List>
                    {myApartments.length === 0 ? (
                        <ListItem><ListItemText primary="עדיין לא העלית דירות למערכת" /></ListItem>
                    ) : (
                        myApartments.map((apt) => (
                            <React.Fragment key={apt._id}>
                                <ListItem>
                                    <ListItemText 
                                        primary={apt.title} 
                                        secondary={`סטטוס: ${apt.isApproved ? 'מאושר' : 'ממתין לאישור'} | מיקום: ${apt.location}`} 
                                    />
                                    <Button variant="contained" color="primary" onClick={() => handleOpenEdit(apt)} sx={{ mr: 1 }}>עריכה</Button>
                                    <Button variant="outlined" color="error" onClick={() => handleDelete(apt._id)}>מחיקה</Button>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))
                    )}
                </List>
            </Paper>

            <ApartmentEditDialog open={editOpen} onClose={() => setEditOpen(false)} apartment={editData} onSaved={fetchMyApartments} />
        </Box>
    );
}