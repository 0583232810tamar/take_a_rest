import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Box, Typography, Button, Stack, Chip, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { styled } from '@mui/material/styles';
import './CalendarPicker.css';

// סגנונות מותאמים ללוח השנה
const StyledCalendar = styled(Box)(({ theme }) => ({
  '& .react-calendar': {
    width: '100%',
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(2),
    fontFamily: theme.typography.fontFamily,
    backgroundColor: '#fafafa',
  },
  '& .react-calendar__tile': {
    padding: theme.spacing(1.5),
    fontSize: '0.9rem',
    fontWeight: '600',
    borderRadius: '8px',
    position: 'relative',
    border: '2px solid transparent',
  },
  '& .react-calendar__tile--active': {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
  },
  '& .react-calendar__tile--now': {
    border: '2px solid ' + theme.palette.primary.main,
  },
  // צביעה לפי סטטוסים
  '& .date-booked': {
    backgroundColor: '#d32f2f !important',
    color: '#fff !important',
    fontWeight: '700 !important',
  },
  '& .date-blocked': {
    backgroundColor: '#ff9800 !important',
    color: '#fff !important',
    fontWeight: '700 !important',
  },
  '& .date-pending': {
    backgroundColor: '#fbc02d !important',
    color: '#000 !important',
    fontWeight: '700 !important',
    border: '2px solid #f57f17 !important',
  },
}));

interface DateEntry {
  date: string; // YYYY-MM-DD
  status: 'booked' | 'blocked' | 'pending';
  bookingId?: string;
}

interface CalendarPickerProps {
  bookedDates?: DateEntry[];
  onChange?: (dates: DateEntry[]) => void;
  readOnly?: boolean; // אם true, רק תצוגה
  title?: string;
}

export default function CalendarPicker({ 
  bookedDates = [], 
  onChange, 
  readOnly = false,
  title = 'לוח זמנים'
}: CalendarPickerProps) {
  const [value, setValue] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<'booked' | 'blocked' | 'pending'>('blocked');
  const [localDates, setLocalDates] = useState<DateEntry[]>(bookedDates);

  useEffect(() => {
    setLocalDates(bookedDates);
  }, [bookedDates]);

  // בדיקה אם תאריך מסוים קיים בדטה
  const getDateStatus = (date: Date): 'booked' | 'blocked' | 'pending' | null => {
    const dateStr = date.toISOString().split('T')[0];
    const found = localDates.find(d => d.date === dateStr);
    return found ? found.status : null;
  };

  // לחיצה על תאריך בלוח שנה
  const handleDateClick = (date: Date) => {
    if (readOnly) return;

    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);

    const existing = localDates.find(d => d.date === dateStr);
    if (existing) {
      setNewStatus(existing.status);
    }
    setStatusDialog(true);
  };

  // שמירת סטטוס לתאריך
  const handleSaveStatus = () => {
    if (!selectedDate) return;

    const newDates = localDates.filter(d => d.date !== selectedDate);
    newDates.push({ date: selectedDate, status: newStatus });

    setLocalDates(newDates);
    onChange?.(newDates);
    setStatusDialog(false);
  };

  // הסרת תאריך
  const handleRemoveDate = (dateStr: string) => {
    const newDates = localDates.filter(d => d.date !== dateStr);
    setLocalDates(newDates);
    onChange?.(newDates);
  };

  // צביעת תאריכים בלוח השנה לפי הסטטוס
  const getTileClassName = (date: Date) => {
    const status = getDateStatus(date);
    const classes: string[] = [];
    
    if (status) {
      classes.push(`date-${status}`);
    }
    
    return classes.join(' ');
  };

  // סגנון ללא צבע (ה-className יעשה את העבודה)
  const getTileStyle = (date: Date) => {
    const status = getDateStatus(date);
    if (!status) return {};

    // בחזרה קלות בלבד - הclassName עושה את הצביעה הכבדה
    return {
      boxShadow: status === 'pending' ? '0 0 0 2px #f57f17 inset' : 'none',
    };
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        📅 {title}
      </Typography>

      {/* לוח שנה */}
      <StyledCalendar sx={{ mb: 2, borderRadius: 2 }}>
        <Calendar
          value={value}
          onClickDay={handleDateClick}
          tileClassName={({ date }) => getTileClassName(date)}
          tileStyle={({ date }) => getTileStyle(date)}
          locale="he-IL"
        />
      </StyledCalendar>

      {/* לגנדה */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip
          label="🔴 הוזמן"
          sx={{ backgroundColor: '#d32f2f', color: '#fff', fontWeight: 'bold' }}
        />
        <Chip
          label="🟠 סגור בעלים"
          sx={{ backgroundColor: '#ff9800', color: '#fff', fontWeight: 'bold' }}
        />
        <Chip
          label="🟡 עומד להסגר (?)"
          sx={{ backgroundColor: '#fbc02d', color: '#000', fontWeight: 'bold' }}
        />
      </Stack>

      {/* רשימת תאריכים מסומנים */}
      {localDates.length > 0 && (
        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            📋 תאריכים מסומנים ({localDates.length}):
          </Typography>
          <Stack spacing={1}>
            {localDates.map(entry => (
              <Box
                key={entry.date}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  backgroundColor: '#fff',
                  borderRadius: 1,
                  border: '1px solid #ddd'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {entry.date}
                  </Typography>
                  <Chip
                    label={{
                      booked: 'הוזמן',
                      blocked: 'סגור בעלים',
                      pending: 'עומד להסגר'
                    }[entry.status]}
                    size="small"
                    sx={{
                      backgroundColor: {
                        booked: '#d32f2f',
                        blocked: '#ff9800',
                        pending: '#fbc02d'
                      }[entry.status],
                      color: entry.status === 'pending' ? '#000' : '#fff',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                {!readOnly && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveDate(entry.date)}
                  >
                    🗑️ הסר
                  </Button>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* דיאלוג בחירת סטטוס */}
      {!readOnly && (
        <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
          <DialogTitle>בחר סטטוס לתאריך: {selectedDate}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <Button
                variant={newStatus === 'blocked' ? 'contained' : 'outlined'}
                onClick={() => setNewStatus('blocked')}
                fullWidth
              >
                🟠 סגור בעלים (לא זמין)
              </Button>
              <Button
                variant={newStatus === 'pending' ? 'contained' : 'outlined'}
                onClick={() => setNewStatus('pending')}
                fullWidth
              >
                🟡 עומד להסגר (?)
              </Button>
              <Button
                variant={newStatus === 'booked' ? 'contained' : 'outlined'}
                onClick={() => setNewStatus('booked')}
                fullWidth
              >
                🔴 הוזמן (בעקבות הזמנה)
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog(false)}>ביטול</Button>
            <Button variant="contained" onClick={handleSaveStatus}>
              שמור
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
