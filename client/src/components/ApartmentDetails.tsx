import React, { useState, useEffect } from 'react';
import { Container, Box, Button, Typography, Paper, Grid, IconButton, Tabs, Tab, Divider, Stack, Fade } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import EventNote from '@mui/icons-material/EventNote';
import MessageOutlined from '@mui/icons-material/MessageOutlined';
import ArrowBackIosNew from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import KingBed from '@mui/icons-material/KingBed';
import PeopleAlt from '@mui/icons-material/PeopleAlt';
import LocationOn from '@mui/icons-material/LocationOn';
import AcUnit from '@mui/icons-material/AcUnit';
import LocalParking from '@mui/icons-material/LocalParking';
import ElevatorIcon from '@mui/icons-material/Elevator';
import Kitchen from '@mui/icons-material/Kitchen';
import SmokeFree from '@mui/icons-material/SmokeFree';
import Schedule from '@mui/icons-material/Schedule';
import Phone from '@mui/icons-material/Phone';
import AttachMoney from '@mui/icons-material/AttachMoney';

interface ApartmentDetailsProps {
	apartment: any;
	user: any;
	onBack: () => void;
}

function TabPanel({ children, value, index }: { children?: React.ReactNode; value: number; index: number }) {
	return (
		<div role="tabpanel" hidden={value !== index}>
			<Fade in={value === index} unmountOnExit>
				<Box sx={{ pt: 2, height: '100%', overflow: 'auto' }}>{children}</Box>
			</Fade>
		</div>
	);
}

export default function ApartmentDetails({ apartment, user, onBack }: ApartmentDetailsProps) {
	if (!apartment) return null;

	const images: string[] = (apartment.images && apartment.images.length > 0) ? apartment.images : (apartment.imageUrl ? [apartment.imageUrl] : []);
	const [idx, setIdx] = useState(0);
	const [tab, setTab] = useState(0);

	const sectionSx = { p: 3, borderRadius: 2, boxShadow: 1, mb: 3, bgcolor: 'background.paper' };
	const cardSx = { p: 2.5, borderRadius: 2, boxShadow: 1, mb: 3, bgcolor: 'background.paper' };

	// ensure numeric fields display nicely
	// keep original numeric values intact; create formatted price string for display
	const displayPrice = typeof apartment.pricePerNight === 'number' ? apartment.pricePerNight.toLocaleString() : apartment.pricePerNight || '-';

	const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
		<Box sx={{ width: '100%', py: 1 }}>
			<Stack direction="row" alignItems="center" justifyContent="space-between">
				<Typography variant="caption" color="text.secondary" sx={{ pr: 2, minWidth: 120, textAlign: 'right' }}>{label}</Typography>
				<Typography variant="body2" sx={{ fontWeight: 700, pl: 2 }}>{value}</Typography>
			</Stack>
		</Box>
	);

	const next = () => setIdx(i => (i + 1) % Math.max(1, images.length));
	const prev = () => setIdx(i => (i - 1 + Math.max(1, images.length)) % Math.max(1, images.length));

	// keyboard shortcuts for carousel
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft') prev();
			if (e.key === 'ArrowRight') next();
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [images.length]);

	return (
		<Container maxWidth="lg" sx={{ mt: 4, direction: 'rtl' }}>
			<Button variant="outlined" onClick={onBack} sx={{ mb: 2 }}>חזרה</Button>

			<Grid container spacing={3}>
				<Grid item xs={12} md={8}>
					<Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden', minHeight: { xs: 'auto', md: 'calc(100vh - 160px)' } }}>
						{/* Large carousel */}
						<Box sx={{ position: 'relative', width: '100%', bgcolor: 'grey.100' }}>
							<Box component="img" src={images[idx] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200'} alt={`תמונה ${idx + 1}`} sx={{ width: '100%', height: { xs: 300, md: 480 }, objectFit: 'cover', display: 'block' }} />

							<IconButton onClick={prev} size="small" sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
								<ArrowBackIosNew fontSize="small" />
							</IconButton>
							<IconButton onClick={next} size="small" sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.4)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
								<ArrowForwardIos fontSize="small" />
							</IconButton>

							{/* thumbnails */}
							{images.length > 1 && (
								<Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 8, left: 8, right: 8, justifyContent: 'center' }}>
									{images.map((img, i) => (
										<Box
											key={i}
											onClick={() => setIdx(i)}
											onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIdx(i); }}
											tabIndex={0}
											component="img"
											src={img}
											aria-label={`thumbnail-${i + 1}`}
											sx={{ width: { xs: 48, md: 72 }, height: { xs: 36, md: 48 }, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', border: i === idx ? '2px solid' : '1px solid rgba(255,255,255,0.6)', borderColor: i === idx ? 'primary.main' : 'rgba(255,255,255,0.6)' }}
										/>
									))}
								</Stack>
							)}
						</Box>

						{/* title + persistent description */}
						<Box sx={{ py: 2 }}>
							<Typography variant="h5" fontWeight={700}>{apartment.title}</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{apartment.description}</Typography>
						</Box>

						<Divider />

						{/* Tabs (styled) */}
						<Box sx={{ p: 2, minHeight: { xs: 420, md: 520 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
							<Tabs
								value={tab}
								onChange={(_, v) => setTab(v)}
								variant="fullWidth"
								aria-label="פרטי דירה"
								sx={{ mb: 1, '& .MuiTabs-flexContainer': { justifyContent: 'space-between' } }}
								TabIndicatorProps={{ style: { height: 3, borderRadius: 3 } }}
							>
								<Tab icon={<InfoOutlined />} iconPosition="start" label="כללי" sx={{ textTransform: 'none', py: 1, '&.Mui-selected': { color: 'primary.main' } }} />
								<Tab icon={<HomeOutlined />} iconPosition="start" label="מתקנים" sx={{ textTransform: 'none', py: 1, '&.Mui-selected': { color: 'primary.main' } }} />
								<Tab icon={<EventNote />} iconPosition="start" label="חוקים" sx={{ textTransform: 'none', py: 1, '&.Mui-selected': { color: 'primary.main' } }} />
								<Tab icon={<MessageOutlined />} iconPosition="start" label="בעל הדירה" sx={{ textTransform: 'none', py: 1, '&.Mui-selected': { color: 'primary.main' } }} />
							</Tabs>

							<TabPanel value={tab} index={0}>
								<Box>
									<Paper sx={sectionSx} elevation={0}>
										<Typography variant="h6" sx={{ mb: 1 }}>תיאור</Typography>
										<Typography variant="body2" color="text.secondary">{apartment.description}</Typography>
									</Paper>

									<Paper sx={sectionSx} elevation={0}>
										<Grid container spacing={2}>
											<Grid item xs={12} sm={6}>
												<Stack spacing={2}>
													<InfoItem label="חדרים" value={apartment.rooms ?? '-'} />
													<InfoItem label="מיטות" value={apartment.beds ?? apartment.bedsCount ?? '-'} />
													<InfoItem label="קיבולת" value={apartment.maxGuests ?? '-'} />
													<InfoItem label="קומה" value={apartment.floor ?? '-'} />
													<InfoItem label="סוג פרסום" value={apartment.type ?? '-'} />
												</Stack>
											</Grid>
											<Grid item xs={12} sm={6}>
												<Stack spacing={2}>
													<InfoItem label="מיקום" value={(apartment.location || apartment.city || '-') + (apartment.neighborhood ? ' — ' + apartment.neighborhood : '')} />
													<InfoItem label="רחוב" value={apartment.street ?? '-'} />
													<InfoItem label="נקודות עניין" value={apartment.nearbyPlaces ?? 'לא צוינו'} />
													<InfoItem label="תמונות" value={(apartment.images && apartment.images.length) || (apartment.mainImage ? 1 : 0)} />
													<InfoItem label="תאריכים שמורות" value={(apartment.bookedDates && apartment.bookedDates.join(', ')) || 'אין'} />
												</Stack>
											</Grid>
										</Grid>
									</Paper>
								</Box>
							</TabPanel>

							<TabPanel value={tab} index={1}>
								<Box>
									<Paper sx={sectionSx} elevation={0}>
										<Typography variant="h6" sx={{ mb: 1 }}>מתקנים</Typography>
										<Stack spacing={2}>
											<InfoItem label="מיזוג" value={apartment.ac ?? '-'} />
											<InfoItem label="כשרות מטבח" value={apartment.kitchenKosher ?? '-'} />
											<InfoItem label="חניה" value={apartment.parking ?? 'לא צוינה'} />
											<InfoItem label="מעלית" value={apartment.elevator ? 'כן' : 'לא'} />
											<InfoItem label="מרפסת/חצר" value={(apartment.hasBalcony ? 'יש' : 'אין') + (apartment.yardDetails && apartment.yardDetails.length ? ' — ' + apartment.yardDetails.join(', ') : '')} />
											<InfoItem label="מצעים מסופקים" value={apartment.linensProvided ? 'כן' : 'לא'} />
											{apartment.appliances && <InfoItem label="מכשירים" value={apartment.appliances.join(' · ')} />}
										</Stack>
									</Paper>
								</Box>
							</TabPanel>

							<TabPanel value={tab} index={2}>
								<Box>
									<Paper sx={sectionSx} elevation={0}>
										<Typography variant="h6" sx={{ mb: 1 }}>חוקים</Typography>
										<Stack spacing={2}>
											<InfoItem label="עישון" value={apartment.rules?.smoking ?? 'לא צויין'} />
											<InfoItem label="כניסה" value={apartment.rules?.checkIn ?? '-'} />
											<InfoItem label="עזיבה" value={apartment.rules?.checkOut ?? '-'} />
											<InfoItem label="ביטולים" value={apartment.rules?.cancellationPolicy ?? 'לא צוינה'} />
											<InfoItem label="חיות מחמד" value={apartment.rules?.petsAllowed ? 'מותר' : 'לא מותר'} />
										</Stack>
									</Paper>
								</Box>
							</TabPanel>

							<TabPanel value={tab} index={3}>
								<Box>
									<Paper sx={sectionSx} elevation={0}>
										<Typography variant="h6" sx={{ mb: 1 }}>בעל הדירה</Typography>
										<Stack spacing={2}>
											<InfoItem label="שם" value={apartment.owner?.profile?.fullName || 'לא צויין'} />
											<InfoItem label="אימייל" value={apartment.ownerEmail || apartment.owner?.email || 'לא צויין'} />
											<InfoItem label="טלפון" value={apartment.phone || apartment.owner?.profile?.phone || 'לא צויין'} />
										</Stack>
									</Paper>

									<Paper sx={sectionSx} elevation={0}>
										<Typography variant="h6" sx={{ mb: 1 }}>תמחור והעדפות החלפה</Typography>
										<Stack spacing={2}>
											<InfoItem label="מחיר ללילה" value={apartment.pricePerNight ?? 'לא הוגדר'} />
											<InfoItem label={'מחיר לסופ"ש'} value={apartment.priceWeekend ?? 'לא הוגדר'} />
											<InfoItem label="מינימום לילות" value={apartment.minNights ?? '-'} />
											<InfoItem label="העדפות החלפה" value={(apartment.swapPreferences?.desiredLocations && apartment.swapPreferences.desiredLocations.join(', ')) || 'לא הוגדרו'} />
											<InfoItem label="מינימום חדרים להחלפה" value={apartment.swapPreferences?.minRoomsRequired ?? '-'} />
											<InfoItem label="מינימום מיטות להחלפה" value={apartment.swapPreferences?.minBedsRequired ?? '-'} />
										</Stack>
									</Paper>
								</Box>
							</TabPanel>
						</Box>
					</Paper>
				</Grid>

				<Grid item xs={12} md={4}>
					<Box sx={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
						<Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, minWidth: 220 }}>
							<Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>₪{displayPrice}</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>מחיר ללילה</Typography>
							<Button variant="contained" color="primary" fullWidth sx={{ py: 1.5, fontWeight: 700, mb: 1 }}>הזמנה</Button>
							<Button variant="outlined" fullWidth onClick={() => {}} sx={{ py: 1 }}>שלח הודעה לבעל הדירה</Button>
						</Paper>
					</Box>
				</Grid>
			</Grid>
		</Container>
	);
}

