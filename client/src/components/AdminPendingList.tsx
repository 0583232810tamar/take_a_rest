import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import api from '../api';

export default function AdminPendingList() {
  const [pending, setPending] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [openCompose, setOpenCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPending = async () => {
    try {
      const res = await api.get('/apartments/admin/pending');
      setPending(res.data);
    } catch (err) {
      console.error('שגיאה בשליפת דירות ממתינות', err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openFor = (apt: any) => {
    setSelected(apt);
    setSubject(`אישור דירה: ${apt.title}`);
    setMessage(`הדירה "${apt.title}" בהצלחה אושרה וזוהתה בעמוד הגלריה.`);
    setOpenCompose(true);
  };

  const sendApprove = async () => {
    if (!selected) return;
    try {
      await api.put(`/apartments/${selected._id}/approve`, { subject, message });
      alert('מייל אישור נשלח והדירה אושרה.');
      setOpenCompose(false);
      setPending(pending.filter(p => p._id !== selected._id));
    } catch (err) {
      console.error(err);
      alert('שגיאה בשליחת המייל/אישור - בדוק קונסול');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>דירות ממתינות לאישור</Typography>
      <List>
        {pending.length === 0 ? (
          <ListItem><ListItemText primary="אין דירות ממתינות לאישור כרגע" /></ListItem>
        ) : (
          pending.map(apt => (
            <ListItem key={apt._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <ListItemText primary={apt.title} secondary={apt.location} />
              <Button variant="contained" size="small" onClick={() => openFor(apt)}>פתח מייל אישור</Button>
            </ListItem>
          ))
        )}
      </List>

      <Dialog open={openCompose} onClose={() => setOpenCompose(false)} fullWidth maxWidth="sm">
        <DialogTitle>שליחת מייל אישור ל־{selected?.ownerEmail}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField fullWidth label="נושא" value={subject} onChange={e => setSubject(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth multiline rows={6} label="תוכן (HTML)" value={message} onChange={e => setMessage(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompose(false)}>ביטול</Button>
          <Button variant="contained" onClick={sendApprove}>אשר ושלח</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
