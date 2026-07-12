import React, { useEffect, useState } from 'react';
import api from '../api';
import { Box, Grid, Card, CardMedia, CardContent, Typography, TextField, Button, Stack, Chip, Divider } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import KingBedIcon from '@mui/icons-material/KingBed';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

interface Apartment {
    _id: string;
    title: string;
    description?: string;
    location?: string;
    beds?: number;
    rooms?: number;
    pricePerNight?: number;
    images?: string[];
    mainImage?: string;
}

export default function ApartmentList({ onSelectApartment }: any) {
    const getImageUrl = (url?: string) => {
        try {
            if (!url) return '/placeholder-image.svg';
            const normalized = url.replace(/\\/g, '/');
            if (/^https?:\/\//i.test(normalized)) return normalized;
            const base = (api.defaults && api.defaults.baseURL) ? api.defaults.baseURL.replace(/\/api$/, '') : '';
            if (normalized.startsWith('/uploads')) {
                const full = `${base}${normalized}`;
                console.debug('getImageUrl -> uploads (leading slash):', full);
                return full;
            }
            if (normalized.startsWith('uploads/')) {
                const full = `${base}/${normalized}`;
                console.debug('getImageUrl -> uploads (no leading slash):', full);
                return full;
            }
            if (normalized.includes('/uploads/')) {
                const full = `${base}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
                console.debug('getImageUrl -> contains /uploads/:', full);
                return full;
            }
            const defaultFull = `${base}/${normalized}`.replace(/([^:]\/)\/+/g, '$1');
            console.debug('getImageUrl -> returning base relative:', defaultFull);
            return defaultFull;
        } catch (e) {
            console.error('getImageUrl error', e, url);
            return '/placeholder-image.svg';
        }
    };

    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [city, setCity] = useState('');
    const [minBeds, setMinBeds] = useState<number | ''>('');
    const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({});

    const getCardImages = (apt: Apartment) => {
        if (Array.isArray(apt.images) && apt.images.length > 0) {
            return apt.images.map(getImageUrl);
        }
        return [getImageUrl(apt.mainImage || undefined)];
    };

    const getCardDisplayIndex = (apt: Apartment) => selectedImageIndex[apt._id] ?? 0;

    const getCardImage = (apt: Apartment) => {
        const images = getCardImages(apt);
        const index = getCardDisplayIndex(apt);
        return images[index] || images[0] || '/placeholder-image.svg';
    };

    const imageCount = (apt: Apartment) => getCardImages(apt).length;

    const selectCardImage = (aptId: string, index: number) => {
        setSelectedImageIndex((prev) => ({ ...prev, [aptId]: index }));
    };


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
                    <Grid item xs={12} md={6} lg={4} key={apt._id} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 4, height: '100%', width: '100%', maxWidth: 360, minWidth: 360, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, boxShadow: 0.2s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 8 } }}>
                            <Box sx={{ position: 'relative', width: '100%', height: 240, overflow: 'hidden', bgcolor: 'grey.200' }}>
                                <Box
                                    component="img"
                                    src={getCardImage(apt)}
                                    alt={apt.title}
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        e.currentTarget.src = '/placeholder-image.svg';
                                    }}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                        display: 'block'
                                    }}
                                />

                                <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)' }} />

                                <Box sx={{ position: 'absolute', left: 12, top: 12, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 1.5, py: 0.6, borderRadius: 999, fontWeight: 700, fontSize: '0.8rem', backdropFilter: 'blur(6px)' }}>
                                    {apt.location || '-'}
                                </Box>

                                <Box sx={{ position: 'absolute', right: 12, bottom: 12, color: 'white', textAlign: 'right' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                                        {apt.title}
                                    </Typography>
                                </Box>

                                {imageCount(apt) > 1 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 12,
                                            left: 12,
                                            right: 12,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        {getCardImages(apt).map((_, dotIndex) => {
                                            const currentIndex = getCardDisplayIndex(apt);
                                            const isActive = currentIndex === dotIndex;
                                            return (
                                                <Box
                                                    key={dotIndex}
                                                    component="button"
                                                    type="button"
                                                    onClick={() => selectCardImage(apt._id, dotIndex)}
                                                    sx={{
                                                        width: 12,
                                                        height: 12,
                                                        minWidth: 12,
                                                        borderRadius: '50%',
                                                        border: 'none',
                                                        padding: 0,
                                                        backgroundColor: isActive ? 'primary.main' : 'rgba(255,255,255,0.75)',
                                                        boxShadow: isActive ? '0 0 0 4px rgba(25, 118, 210, 0.18)' : 'none',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.15s ease, background-color 0.15s ease',
                                                        '&:hover': {
                                                            transform: 'scale(1.15)'
                                                        }
                                                    }}
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
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
