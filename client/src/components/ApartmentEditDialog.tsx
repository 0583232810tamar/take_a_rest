import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import AddApartment from './AddApartment';
import api from '../api';

export default function ApartmentEditDialog({ open, onClose, apartment, onSaved } : any) {
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(()=>{ setInitialData(apartment || null); }, [apartment]);

    // when used as edit, we will render the full AddApartment form in edit mode
    // AddApartment will expose a `submitWithFormData` callback via prop for saving
    const handleSubmit = async (formData: FormData) => {
        try {
            await api.put(`/apartments/${apartment._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onSaved && onSaved();
            onClose();
        } catch (err) {
            console.error('שגיאה בשמירת דירה בעריכה:', err.response?.data || err.message);
            throw err;
        }
    };

    if (!initialData || !apartment) return null;

    // Provide the editingApartment via the `user` prop to make AddApartment enter edit mode
    const fakeUserForEdit = { 
        editingApartment: apartment, 
        _id: typeof apartment.owner === 'object' ? apartment.owner._id : apartment.owner 
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>עריכת דירה - טופס מלא</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ py: 1 }}>
                    <AddApartment user={fakeUserForEdit} onSuccess={() => { onSaved && onSaved(); onClose(); }} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>ביטול</Button>
            </DialogActions>
        </Dialog>
    );
}
