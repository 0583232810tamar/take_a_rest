import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardMedia, CardContent, Typography, TextField, Button, Stack, Chip, Divider } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import KingBedIcon from '@mui/icons-material/KingBed';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import api from '../api';

interface Apartment {
    _id: string;
    title: string;
    description?: string;
    location?: string;
    beds?: number;
    rooms?: number;
    pricePerNight?: number;
    images?: string[];
}

export default function ApartmentList({ onSelectApartment }: any) {
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [city, setCity] = useState('');
    const [minBeds, setMinBeds] = useState<number | ''>('');

    useEffect(() => {
        fetchApartments();
    }, []);

    async function fetchApartments() {
        try {
            const params: any = {};
            if (city) params.location = city;
            if (minBeds !== '') params.minBeds = minBeds;
            const res = await api.get('/apartments', { params });
            setApartments(res.data || []);
        } catch (err) {
            console.error('fetch apartments error', err);
        }
    }

    return (
        <Box>
            <Box sx={{ mb: 3, p: 2, boxShadow: 1, borderRadius: 2, background: '#fff' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField label="חפש לפי עיר" value={city} onChange={(e) => setCity(e.target.value)} />
                    <TextField label="מינימום מיטות" type="number" value={minBeds} onChange={(e) => setMinBeds(e.target.value === '' ? '' : Number(e.target.value))} />
                    <Button variant="contained" onClick={fetchApartments}>חפש דירה</Button>
                </Stack>
            </Box>

            <Grid container spacing={2}>
                {apartments.length === 0 && (
                    <Grid item xs={12}>
                        <Typography align="center">לא נמצאו דירות התואמות את החיפוש שלך.</Typography>
                    </Grid>
                )}

                {apartments.map((apt) => (
                    <Grid item xs={12} md={6} lg={4} key={apt._id}>
                        <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 4 }}>
                            <Box sx={{ position: 'relative' }}>
                                <CardMedia
                                    component="img"
                                    height="220"
                                    image={(apt.images && apt.images[0]) || '/placeholder.jpg'}
                                    alt={apt.title}
                                    sx={{ objectFit: 'cover' }}
                                />

                                {/* City overlay pill top-left */}
                                <Box sx={{ position: 'absolute', left: 12, top: 12, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: '0.85rem' }}>
                                    {apt.location || '-'}
                                </Box>
                            </Box>

                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>{apt.title}</Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, color: 'text.secondary' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <KingBedIcon fontSize="small" />
                                        <Typography variant="body2">{apt.beds || 0}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <PeopleAltIcon fontSize="small" />
                                        <Typography variant="body2">{apt.rooms || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <LocationOnIcon fontSize="small" />
                                        <Typography variant="body2">{apt.location || '-'}</Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button variant="outlined" size="small" sx={{ borderRadius: 2 }} onClick={() => onSelectApartment(apt)}>פרטים</Button>
                                    <Button variant="contained" color="primary" sx={{ borderRadius: 6, px: 3, py: 1.2, fontWeight: 900 }}>
                                        ₪{apt.pricePerNight || '-'} / לילה
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
