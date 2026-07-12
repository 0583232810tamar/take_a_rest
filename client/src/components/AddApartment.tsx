import React, { useState } from 'react';
import { 
    Box, TextField, Button, Typography, Paper, MenuItem, Grid, 
    Alert, Stepper, Step, StepButton, StepLabel, FormControlLabel, 
    Checkbox, Divider, FormGroup 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api';
import CalendarPicker from './CalendarPicker';

interface AddApartmentProps {
    user: any;
    onSuccess: () => void;
}

export default function AddApartment({ user, onSuccess }: AddApartmentProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [status, setStatus] = useState({ text: '', isError: false });

    // --- State של שדות הטופס (מסונכרן מלא מול השרת) ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('rent');
    const [city, setCity] = useState(''); // שונה מ-location ל-city בהתאם לבקאנד
    const [neighborhood, setNeighborhood] = useState('');
    const [street, setStreet] = useState('');
    const [floor, setFloor] = useState('');
    const [phone, setPhone] = useState('');
    const [nearbyPlaces, setNearbyPlaces] = useState('');

    const [rooms, setRooms] = useState('');
    const [beds, setBeds] = useState('');
    const [extraBedding, setExtraBedding] = useState('');
    const [maxGuests, setMaxGuests] = useState('');
    const [ac, setAc] = useState('none');
    const [elevator, setElevator] = useState(false);
    const [accessible, setAccessible] = useState(false);
    const [hasBalcony, setHasBalcony] = useState(false);
    const [yardDetails, setYardDetails] = useState<string[]>([]);
    const [kitchenKosher, setKitchenKosher] = useState('mehadrin'); // ערך ברירת מחדל תקני לתשתית
    const [parking, setParking] = useState('');
    const [linensProvided, setLinensProvided] = useState(false);
    const [appliances, setAppliances] = useState<string[]>([]);

    // מאפיינים מיוחדים ותוספות לשבת
    const [isSpecialFriendly, setIsSpecialFriendly] = useState(false);
    const [hasHotPlate, setHasHotPlate] = useState(false);
    const [hasWaterUrn, setHasWaterUrn] = useState(false);
    const [mechanicalKey, setMechanicalKey] = useState(false);
    const [specialBeds, setSpecialBeds] = useState(false);
    const [diningEquipment, setDiningEquipment] = useState(false);
    const [specialKit, setSpecialKit] = useState(false);

    // תמונות
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // מחירים וסוואפ
    const [pricePerNight, setPricePerNight] = useState('');
    const [priceWeekend, setPriceWeekend] = useState('');
    const [minNights, setMinNights] = useState('1');
    const [desiredLocations, setDesiredLocations] = useState('');
    const [minRoomsRequired, setMinRoomsRequired] = useState('');

    const [petsAllowed, setPetsAllowed] = useState(false);
    const [smoking, setSmoking] = useState('forbidden');

    // לוח זמנים - תאריכים תפוסים
    const [bookedDates, setBookedDates] = useState<Array<{ date: string; status: 'booked' | 'blocked' | 'pending' }>>([]);

    // If `user.editingApartment` is present, we are in edit mode and should pre-fill fields
    const editingApartment = (user && (user as any).editingApartment) || null;

    React.useEffect(() => {
        if (editingApartment) {
            const a: any = editingApartment;
            setTitle(a.title || '');
            setDescription(a.description || '');
            setType(a.type || 'rent');
            setCity(a.location || '');
            setNeighborhood(a.neighborhood || '');
            setStreet(a.street || '');
            setFloor(a.floor || '');
            setPhone(a.phone || '');
            setNearbyPlaces(a.nearbyPlaces || '');
            setRooms(a.rooms ? String(a.rooms) : '');
            setBeds(a.beds ? String(a.beds) : '');
            setExtraBedding(a.extraBedding || '');
            setMaxGuests(a.maxGuests ? String(a.maxGuests) : '');
            setAc(a.ac || 'none');
            setElevator(!!a.elevator);
            setAccessible(!!a.accessible);
            setHasBalcony(!!a.hasBalcony);
            setYardDetails(a.yardDetails || []);
            setKitchenKosher(a.kitchenKosher || 'mehadrin');
            setParking(a.parking || '');
            setLinensProvided(!!a.linensProvided);
            setAppliances(a.appliances || []);
            setIsSpecialFriendly(!!(a.shabbatEquipment));
            setHasHotPlate(!!a.shabbatEquipment?.hasHotPlate);
            setHasWaterUrn(!!a.shabbatEquipment?.hasWaterUrn);
            setMechanicalKey(!!a.shabbatEquipment?.mechanicalKey);
            setSpecialBeds(!!a.shabbatEquipment?.kosherBeds);
            setDiningEquipment(!!a.shabbatEquipment?.diningEquipment);
            setSpecialKit(!!a.shabbatEquipment?.havdalahKit);
            setPricePerNight(a.pricePerNight ? String(a.pricePerNight) : '');
            setPriceWeekend(a.priceWeekend ? String(a.priceWeekend) : '');
            setMinNights(a.minNights ? String(a.minNights) : '1');
            setDesiredLocations((a.swapPreferences?.desiredLocations || []).join(','));
            setMinRoomsRequired(a.swapPreferences?.minRoomsRequired ? String(a.swapPreferences.minRoomsRequired) : '');
            setPetsAllowed(!!a.rules?.petsAllowed);
            setSmoking(a.rules?.smoking || 'forbidden');
            // preview existing image urls
            setPreviewUrls(a.images || (a.mainImage ? [a.mainImage] : []));
            // clear local File[] so user may upload replacements
            setImages([]);
            // לוח זמנים
            setBookedDates(a.bookedDates || []);
        }
    }, [editingApartment]);

    // --- פונקציות בדיקת שדות חובה ---
    const isStep0Incomplete = () => !title || !description || !city || !neighborhood || !street || !floor || !phone;
    const isStep1Incomplete = () => !rooms || !beds || !maxGuests || ac === 'none' || !kitchenKosher || !parking || !smoking;
    const isStep2Incomplete = () => isSpecialFriendly && false;
    const isStep3Incomplete = () => (type !== 'exchange' && (!pricePerNight || !minNights));

    const steps = [
        `פרטים ומיקום ${isStep0Incomplete() ? '⚠️' : ''}`,
        `תכולה ואבזור ${isStep1Incomplete() ? '⚠️' : ''}`,
        `מאפיינים נוספים ${isStep2Incomplete() ? '⚠️' : ''}`,
        `מחירים ותמונות ${isStep3Incomplete() ? '⚠️' : ''}`,
        `📅 לוח זמנים ורדיות`
    ];

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);
    
    const handleStepClick = (stepIndex: number) => () => {
        setActiveStep(stepIndex);
    };

    const handleCheckboxChange = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        setList((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages((prev) => [...prev, ...filesArray]);
            const urls = filesArray.map(file => URL.createObjectURL(file));
            setPreviewUrls((prev) => [...prev, ...urls]);
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const inputStyle = {
        width: '100%',
        '& .MuiInputBase-root': {
            fontSize: '1.05rem',
            fontWeight: '500',
            borderRadius: '12px',
            backgroundColor: '#fafafa',
        },
        '& .MuiInputLabel-root': {
            fontSize: '0.95rem',
            fontWeight: 'bold',
            color: '#555'
        }
    };

    // Support edit mode: if `user` is an object containing `editingApartment` we treat it as edit mode.
    const isEditMode = !!(user && (user as any).editingApartment);

    const handleSubmit = async (externalFormData?: FormData, skipValidation: boolean = false) => {
        setStatus({ text: '', isError: false });
        // אם לא במצב עריכה והמשתמש לא ביקש לדלג על ולידציה - נבדוק שדות חובה
        if (!isEditMode && !skipValidation) {
            if (isStep0Incomplete() || isStep1Incomplete() || isStep3Incomplete()) {
                const missing = getMissingFields();
                setStatus({ text: `לא ניתן לשלוח את הטופס. שדות חסרים: ${missing.join(', ')}`, isError: true });
                return;
            }
        }

        // בניית אובייקט הנתונים תוך התאמה קשיחה למבנה ה-Schema של מסד הנתונים
        const fullData = {
            title,
            description,
            type,
            location: city, // הבקאנד משתמש בשם השדה location עבור העיר/יישוב
            neighborhood,
            street,
            floor,
            nearbyPlaces,
            kitchenKosher,
            rooms: Number(rooms),
            beds: Number(beds),
            extraBedding,
            maxGuests: Number(maxGuests),
            ac,
            elevator,
            accessible,
            hasBalcony,
            yardDetails,
            parking,
            linensProvided,
            appliances,
            isSpecialFriendly,
            shabbatEquipment: { 
                hasHotPlate, 
                hasWaterUrn, 
                mechanicalKey, 
                kosherBeds: specialBeds, 
                diningEquipment, 
                havdalahKit: specialKit 
            },
            pricePerNight: type !== 'exchange' ? Number(pricePerNight) : 0,
            priceWeekend: type !== 'exchange' ? Number(priceWeekend) : 0,
            minNights: Number(minNights),
            swapPreferences: {
                desiredLocations: desiredLocations ? desiredLocations.split(',') : [],
                minRoomsRequired: Number(minRoomsRequired)
            },
            rules: { petsAllowed, smoking },
            phone,
            bookedDates,
            isApproved: false
        };

        try {
            // if an external FormData is provided (edit mode from dialog), use it directly
            const fd = externalFormData || new FormData();

            if (!externalFormData) {
                // המרה תקינה עבור מערכים ואובייקטים לסטרינגים של JSON כדי שלא יישברו ב-FormData
                Object.keys(fullData).forEach((key) => {
                    const value: any = (fullData as any)[key];
                    if (value === undefined || value === null) return;
                    if (typeof value === 'object') {
                        fd.append(key, JSON.stringify(value));
                    } else {
                        fd.append(key, String(value));
                    }
                });

                // העברת קבצי המדיה תחת המפתח המאושר במערך המולטר ('images')
                images.slice(0, 10).forEach((file) => {
                    fd.append('images', file);
                });
            }

            // POST vs PUT depending on edit mode
            if (isEditMode && (user.editingApartment && user.editingApartment._id)) {
                await api.put(`/apartments/${user.editingApartment._id}`, fd);
                setStatus({ text: 'שינויים נשמרו בהצלחה!', isError: false });
            } else {
                await api.post('/apartments', fd);
                setStatus({ text: 'הפרסום נשלח בהצלחה למערכת, והודעה נשלחה למנהל לאישור סופי! 🎉', isError: false });
            }

            setTimeout(() => {
                onSuccess();
                setActiveStep(0);
            }, 1000);

        } catch (error: any) {
            const serverMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'שגיאה לא ידועה בתקשורת';
            setStatus({ text: `שגיאה בשמירת הדירה בשרת: ${serverMsg}`, isError: true });
            console.error('שגיאת שרת מפורטת:', error.response?.data);
            throw error;
        }
    };

    // חזרה של אילו שדות חסרים בדיוק (בעבר היינו מציגים הודעת שגיאה גנרית)
    const getMissingFields = () => {
        const missing: string[] = [];
        if (!title) missing.push('כותרת');
        if (!description) missing.push('תיאור');
        if (!city) missing.push('עיר');
        if (!neighborhood) missing.push('שכונה');
        if (!street) missing.push('רחוב');
        if (!floor) missing.push('קומה');
        if (!phone) missing.push('טלפון');
        if (!rooms) missing.push('מספר חדרים');
        if (!beds) missing.push('מיטות');
        if (!maxGuests) missing.push('מקסימום אורחים');
        if (ac === 'none') missing.push('מערכת מיזוג');
        if (!kitchenKosher) missing.push('כשרות מטבח');
        if (!parking) missing.push('מידע חניה');
        if (!smoking) missing.push('מדיניות עישון');
        if ((type === 'rent' || type === 'both') && !pricePerNight && !isEditMode) missing.push('מחיר ללילה');
        return missing;
    };

    return (
        <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: '20px', direction: 'rtl', mt: 3, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <Typography variant="h5" fontWeight="900" align="center" gutterBottom color="primary" sx={{ mb: 4 }}>
                🏠 מפרט פרסום דירה יוקרתי ומלא
            </Typography>

            <Stepper 
                activeStep={activeStep} 
                alternativeLabel 
                nonLinear
                sx={{ 
                    mb: 5,
                    width: '100%',
                    '& .MuiStepConnector-root': { left: 'calc(50% + 20px)', right: 'calc(-50% + 20px)' },
                    '& .MuiStepConnector-line': { borderColor: '#e0e0e0', minHeight: '2px' }
                }}
            >
                {steps.map((label, index) => (
                    <Step key={label}>
                        <StepButton onClick={handleStepClick(index)}>
                            <StepLabel StepIconProps={{ style: { fontSize: '2rem' } }}>
                                <Typography fontWeight="bold" variant="body2" color={activeStep === index ? 'primary' : 'textSecondary'}>
                                    {label}
                                </Typography>
                            </StepLabel>
                        </StepButton>
                    </Step>
                ))}
            </Stepper>

            {status.text && <Alert severity={status.isError ? 'error' : 'success'} sx={{ mb: 4, borderRadius: '12px', fontWeight: 'bold' }}>{status.text}</Alert>}

            <Box sx={{ minHeight: '350px', mt: 2 }}>
                {activeStep === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField fullWidth label="כותרת שיווקית מושכת *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="דירה מפוארת ומרווחת במרכז העיר" sx={inputStyle} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth select label="סוג הפרסום המבוקש *" value={type} onChange={(e) => setType(e.target.value)} sx={inputStyle}>
                                <MenuItem value="rent">להשכרה בלבד (תקופות נופש ובין הזמנים)</MenuItem>
                                <MenuItem value="exchange">להחלפה בלבד (Home Swap מושלם)</MenuItem>
                                <MenuItem value="both">גם וגם (אפשרות השכרה או החלפה)</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="טלפון ליצירת קשר עם בעלי הדירה *" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" sx={inputStyle} />
                        </Grid>
                        
                        <Grid item xs={12} md={4}><TextField fullWidth label="עיר / יישוב *" value={city} onChange={(e) => setCity(e.target.value)} placeholder="ירושלים, בני ברק" sx={inputStyle} /></Grid>
                        <Grid item xs={12} md={4}><TextField fullWidth label="שכונה *" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="רובע יהודי" sx={inputStyle} /></Grid>
                        <Grid item xs={12} md={4}><TextField fullWidth label="רחוב ומספר בית *" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="חזון איש 15" sx={inputStyle} /></Grid>
                        
                        <Grid item xs={12} md={6}><TextField fullWidth label="קומה ומפרט מעלית *" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="קומה 2 (יש מעלית)" sx={inputStyle} /></Grid>
                        <Grid item xs={12} md={6}><TextField fullWidth label="אטרקציות ומוקדים קרובים לבית" value={nearbyPlaces} onChange={(e) => setNearbyPlaces(e.target.value)} placeholder="מרחק הליכה קצר מבית הכנסת המרכזי" sx={inputStyle} /></Grid>
                        
                        <Grid item xs={12}>
                            <TextField fullWidth multiline minRows={3} label="תיאור חופשי ומזמין של הנכס *" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ספרו על האווירה בבית..." sx={inputStyle} />
                        </Grid>
                    </Grid>
                )}

                {activeStep === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField fullWidth type="number" label="מספר חדרים בנכס *" value={rooms} onChange={(e) => setRooms(e.target.value)} placeholder="3" sx={inputStyle} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField fullWidth type="number" label="מיטות קבועות ומסודרות *" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="6" sx={inputStyle} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField fullWidth type="number" label="מקסימום נפשות לאירוח *" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} placeholder="8" sx={inputStyle} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField fullWidth select label="מערך מיזוג אוויר *" value={ac} onChange={(e) => setAc(e.target.value)} sx={inputStyle}>
                                <MenuItem value="all">מיזוג אוויר מלא בכל חללי הבית</MenuItem>
                                <MenuItem value="livingRoom">ממוזג בסלון בלבד</MenuItem>
                                <MenuItem value="rooms">ממוזג בחדרי השינה בלבד</MenuItem>
                                <MenuItem value="none">ללא מיזוג אוויר</MenuItem>
                            </TextField>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth select label="מדיניות עישון בנכס *" value={smoking} onChange={(e) => setSmoking(e.target.value)} sx={inputStyle}>
                                <MenuItem value="forbidden">חל איסור עישון מוחלט בכל חלקי הבית</MenuItem>
                                <MenuItem value="balconyOnly">מותר לעשן אך ורק במרפסת/בחצר</MenuItem>
                                <MenuItem value="allowed">מותר לעשן בנכס</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="סידורי חניה באזור *" value={parking} onChange={(e) => setParking(e.target.value)} sx={inputStyle} placeholder="חניה פרטית רשומה / בשפע ברחוב בחינם" />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField fullWidth select label="רמת כשרות המטבח והכלים *" style={{ width: 300 }} value={kitchenKosher} onChange={(e) => setKitchenKosher(e.target.value)} sx={inputStyle}>
                                <MenuItem value="mehadrin">מהדרין - הפרדה מלאה, כיורים מופרדים ומערכות כלים נפרדות לחלוטין</MenuItem>
                                <MenuItem value="kosher">כשר - מטבח מופרד וכיורים מופרדים</MenuItem>
                                <MenuItem value="both">המטבח פעיל כבשרי בלבד או כחלבי בלבד</MenuItem>
                                <MenuItem value="phone_details">פרטים מדויקים והנהגות יינתנו בשמחה בטלפון</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField fullWidth label="פתרונות לינה ותוספות (עריסות, מזרנים)" value={extraBedding} onChange={(e) => setExtraBedding(e.target.value)} placeholder="עריסת תינוק מתקפלת ומזרנים נוספים" sx={inputStyle} />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }}><Typography fontWeight="bold" color="textSecondary" variant="body2">מאפייני מבנה ונוחות</Typography></Divider>
                            <FormGroup row={{ xs: false, sm: true }} sx={{ gap: 2, justifyContent: 'center', '& .MuiFormControlLabel-label': { fontWeight: 'bold', fontSize: '0.95rem' } }}>
                                <FormControlLabel control={<Checkbox checked={elevator} onChange={(e) => setElevator(e.target.checked)} color="primary" />} label="יש מעלית בבניין" />
                                <FormControlLabel control={<Checkbox checked={accessible} onChange={(e) => setAccessible(e.target.checked)} color="primary" />} label="נגיש לעגלות / ללא מדרגות" />
                                <FormControlLabel control={<Checkbox checked={linensProvided} onChange={(e) => setLinensProvided(e.target.checked)} color="primary" />} label="האירוח כולל מצעים ומגבות" />
                                <FormControlLabel control={<Checkbox checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} color="primary" />} label="מאפשרים כניסת בעלי חיים" />
                                <FormControlLabel control={<Checkbox checked={hasBalcony} onChange={(e) => setHasBalcony(e.target.checked)} color="secondary" />} label="✨ יש חצר פרטית או מרפסת שמש" />
                            </FormGroup>
                        </Grid>

                        {hasBalcony && (
                            <Grid item xs={12}>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fffde7', borderRadius: '12px' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="warning.dark">🌳 מה מחכה לכם בחצר / במרפסת?</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                        {['בריכה מרעננת / גקוזי', 'טרמפולינה גדולה לילדים', 'ערסל מפנק להירגעות', 'פינת מנגל / גריל מאובזרת', 'פינת ישיבה וריהוט גן', 'סוכה קיימת / מקום מרווח לסוכה'].map((item) => (
                                            <FormControlLabel key={item} control={<Checkbox checked={yardDetails.includes(item)} onChange={() => handleCheckboxChange(item, yardDetails, setYardDetails)} size="small" />} label={<Typography variant="body2">{item}</Typography>} />
                                        ))}
                                    </Box>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                )}

                {activeStep === 2 && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="secondary" gutterBottom fontWeight="bold">✨ מאפיינים מיוחדים לסופי שבוע</Typography>
                        <FormControlLabel control={<Checkbox checked={isSpecialFriendly} onChange={(e) => setIsSpecialFriendly(e.target.checked)} color="secondary" />} label={<Typography fontWeight="bold">הצג והגדר אפשרויות אבזור מיוחדות לשבתות</Typography>} sx={{ mb: 3 }} />
                        
                        {isSpecialFriendly && (
                            <Paper variant="outlined" sx={{ p: 3, bgcolor: '#fbfbfb', borderRadius: '14px' }}>
                                <Grid container spacing={2} sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.95rem', fontWeight: '500' } }}>
                                    <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={hasHotPlate} onChange={(e) => setHasHotPlate(e.target.checked)} />} label="פלטת חימום איכותית" /></Grid>
                                    <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={hasWaterUrn} onChange={(e) => setHasWaterUrn(e.target.checked)} />} label="מיחם מים חמים גדול" /></Grid>
                                    <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={mechanicalKey} onChange={(e) => setMechanicalKey(e.target.checked)} />} label="מפתח מכני תקין / גיבוי לקודן" /></Grid>
                                    <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={specialBeds} onChange={(e) => setSpecialBeds(e.target.checked)} />} label="מיטות נפרדות" /></Grid>
                                    <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={diningEquipment} onChange={(e) => setDiningEquipment(e.target.checked)} />} label="ציוד מלא ומכובד לסעודות" /></Grid>
                                    <Grid item xs={12} md={6}><FormControlLabel control={<Checkbox checked={specialKit} onChange={(e) => setSpecialKit(e.target.checked)} />} label="ערכת הבדלה ייעודית מוכנה" /></Grid>
                                </Grid>
                            </Paper>
                        )}
                    </Box>
                )}

                {activeStep === 3 && (
                    <Grid container spacing={3}>
                        {(type === 'rent' || type === 'both') && (
                            <>
                                <Grid item xs={12} md={6}><TextField fullWidth type="number" label="מחיר ללילה באמצע שבוע (ש''ח) *" value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} placeholder="450" sx={inputStyle} /></Grid>
                                <Grid item xs={12} md={6}><TextField fullWidth type="number" label="מחיר מיוחד לסופי שבוע (ש''ח)" value={priceWeekend} onChange={(e) => setPriceWeekend(e.target.value)} placeholder="600" sx={inputStyle} /></Grid>
                            </>
                        )}
                        <Grid item xs={12} md={6}><TextField fullWidth type="number" label="מינימום לילות להזמנה בנכס *" value={minNights} onChange={(e) => setMinNights(e.target.value)} placeholder="2" sx={inputStyle} /></Grid>
                        
                        {(type === 'exchange' || type === 'both') && (
                            <>
                                <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography fontWeight="bold" color="textSecondary" variant="body2">העדפות להחלפת דירות נופש (Swap)</Typography></Divider></Grid>
                                <Grid item xs={12} md={6}><TextField fullWidth label="באילו ערים / אזורים תרצו להתארח?" value={desiredLocations} onChange={(e) => setDesiredLocations(e.target.value)} sx={inputStyle} placeholder="צפת, טבריה, ירושלים" /></Grid>
                                <Grid item xs={12} md={6}><TextField fullWidth type="number" label="כמות חדרים מינימלית שאתם צריכים" value={minRoomsRequired} onChange={(e) => setMinRoomsRequired(e.target.value)} placeholder="3" sx={inputStyle} /></Grid>
                            </>
                        )}

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }}><Typography fontWeight="bold" color="textSecondary" variant="body2">תמונות של הבית</Typography></Divider>
                            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: '14px', border: '2px dashed #1976d2', bgcolor: '#f4faff', mt: 1 }}>
                                <input accept="image/*" style={{ display: 'none' }} id="raised-button-file" multiple type="file" onChange={handleFileChange} />
                                <label htmlFor="raised-button-file">
                                    <Button variant="contained" component="span" startIcon={<CloudUploadIcon />} size="medium" sx={{ borderRadius: '10px', fontWeight: 'bold' }}>
                                        בחירת תמונות להעלאה
                                    </Button>
                                </label>
                                
                                {previewUrls.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 2 }}>
                                        {previewUrls.map((url, index) => (
                                            <Box key={index} sx={{ position: 'relative', width: 80, height: 80, borderRadius: '8px', overflow: 'hidden' }}>
                                                <img src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <Button 
                                                    onClick={() => removeImage(index)} 
                                                    size="small" 
                                                    color="error" 
                                                    variant="contained"
                                                    sx={{ position: 'absolute', top: 2, right: 2, minWidth: '20px', height: '20px', p: 0, borderRadius: '50%' }}
                                                >
                                                    <DeleteIcon style={{ fontSize: '0.8rem' }} />
                                                </Button>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {activeStep === 4 && (
                    <Box>
                        <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                            📅 סמון את התאריכים התפוסים וידיע אתם עבור בררט. בטוליון: 🔴 = בעלים, 🟠 = סגור, 🟡 = עומד להסגר
                        </Typography>
                        <CalendarPicker
                            bookedDates={bookedDates}
                            onChange={setBookedDates}
                            readOnly={false}
                            title="לוח זמנים - בחר תאריכים"
                        />
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid #f0f0f0' }}>
                <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined" sx={{ borderRadius: '10px', fontWeight: 'bold' }}>אחורה</Button>
                <Box>
                    <Button onClick={() => handleSubmit(undefined, true)} variant="outlined" color="secondary" sx={{ mr: 2, borderRadius: '10px' }}>שמור טיוטה</Button>
                    {activeStep === steps.length - 1 ? (
                        <Button onClick={() => handleSubmit()} variant="contained" color="success" sx={{ borderRadius: '10px', fontWeight: '900', px: 3 }}>פרסם מודעה 🚀</Button>
                    ) : (
                        <Button onClick={handleNext} variant="contained" color="primary" sx={{ borderRadius: '10px', fontWeight: 'bold' }}>השלב הבא</Button>
                    )}
                </Box>
            </Box>
        </Paper>
    );
}