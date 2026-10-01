export interface PanchangaTocItem {
    id: number;
    titleKn: string;
    titleEn: string;
    page: number;
}

export interface FestivalItem {
    nameKn: string;
    nameEn: string;
    date: string;
    endDate?: string;
}

export interface AradhanaItem {
    date: string;
    dayKn: string;
    dayEn: string;
    eventKn: string;
    eventEn: string;
}

export interface PanchangaMetadata {
    titleKn: string;
    titleEn: string;
    publisher: string;
    shakaYear: number;
    kaliYear: number;
    pdfUrl: string;
    startDate: string;
    endDate: string;
    totalDays: number;
}

export const PANCHANGA_METADATA: PanchangaMetadata = {
    titleKn: 'ಶ್ರೀ ಪರಾಭವ ನಾಮ ಸಂವತ್ಸರ ಸೂರ್ಯಸಿದ್ಧಾಂತ ಪಂಚಾಂಗ (೨೦೨೬-೨೦೨೭)',
    titleEn: 'Sri Parabhava Nama Samvatsara Surya Siddhanta Panchanga (2026-2027)',
    publisher: 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳ ಮಠ, ಮೂಲ ಮಹಾಸಂಸ್ಥಾನ, ಮಂತ್ರಾಲಯ',
    shakaYear: 1948,
    kaliYear: 5127,
    pdfUrl: '/documents/panchanga_parabhava_2026_27.pdf',
    startDate: '2026-03-19',
    endDate: '2027-04-07',
    totalDays: 385,
};

export const PANCHANGA_TOC: PanchangaTocItem[] = [
    { id: 1, titleKn: 'ಪಂಚಾಂಗ ಪೀಠಿಕಾ', titleEn: 'Panchanga Peethika', page: 9 },
    { id: 2, titleKn: 'ಶ್ರೀ ಪರಾಭವ ಸಂ|| ರಾಜಾದಿನಾಯಕರು', titleEn: 'Rajadi Navanayakaru', page: 10 },
    { id: 3, titleKn: 'ರಾಜಾದಿನಾಯಕರ ಫಲಗಳು', titleEn: 'Navanayaka Phala', page: 11 },
    { id: 4, titleKn: 'ಸಂಕ್ರಾಂತಿ ಪುಣ್ಯಕಾಲ', titleEn: 'Sankranti Punya Kaala', page: 13 },
    { id: 5, titleKn: 'ಶ್ರೀ ಪರಾಭವ ಸಂವತ್ಸರ ಹಬ್ಬಗಳು', titleEn: 'Annual Festivals List', page: 14 },
    { id: 6, titleKn: 'ಮಳೆ ನಕ್ಷತ್ರ & ಏಕಾದಶಿ ದಿನಗಳು', titleEn: 'Rain Stars & Ekadashi Dates', page: 15 },
    { id: 7, titleKn: 'ಆನಂದಾದಿ ಯೋಗಗಳು & ಗೌರೀ ಪಂಚಾಂಗ', titleEn: 'Anandadi Yoga & Gauri Panchanga', page: 16 },
    { id: 8, titleKn: 'ಶ್ರೀ ಪರಾಭವ ಸಂ|| ರಾಶಿಭವಿಷ್ಯ', titleEn: 'Yearly Rashi Bhavishya', page: 17 },
    { id: 9, titleKn: 'ವಿವಾಹ & ಉಪನಯನ ಮುಹೂರ್ತಗಳು', titleEn: 'Vivaha & Upanayana Muhurthas', page: 23 },
    { id: 10, titleKn: 'ಚೈತ್ರಾದಿ ಮಾಸಿಕ ಪಂಚಾಂಗ (ದೈನಂದಿನ)', titleEn: 'Chaitradi Monthly Panchanga (Daily)', page: 24 },
    { id: 11, titleKn: 'ಷಣ್ಣವತಿ (96) ಶ್ರಾದ್ಧತಿಥಿಗಳು', titleEn: '96 Shraddha Tithis', page: 50 },
    { id: 12, titleKn: 'ದೈನಂದಿನ ಲಗ್ನಭೋಗ್ಯಕಾಲಗಳು', titleEn: 'Daily Lagna Bhogya Times', page: 51 },
    { id: 13, titleKn: 'ದೃಕ್ ನಕ್ಷತ್ರಾಂತ್ಯಕಾಲಗಳು', titleEn: 'Drik Nakshatra End Times', page: 52 },
    { id: 14, titleKn: 'ದೃಕ್ ಗ್ರಹಗಳ ನಕ್ಷತ್ರಪಾದಚಾರಗಳು', titleEn: 'Planetary Nakshatra Pada Movements', page: 54 },
    { id: 15, titleKn: 'ನವರಾತ್ರೋತ್ಸವ ಸಂಕಲ್ಪ & ಸದ್ವಿದ್ಯಾಪೀಠ', titleEn: 'Navaratri Sankalpa & Vidyapeetha', page: 57 },
];

export const PANCHANGA_FESTIVALS: FestivalItem[] = [
    { nameKn: 'ಚಾಂದ್ರಮಾನ ಯುಗಾದಿ', nameEn: 'Chandramana Yugadi', date: '2026-03-19' },
    { nameKn: 'ಚೈತ್ರಗೌರೀ ವ್ರತ', nameEn: 'Chaitra Gauri Vrata', date: '2026-03-21' },
    { nameKn: 'ಶ್ರೀರಾಮನವಮೀ', nameEn: 'Sri Rama Navami', date: '2026-03-27' },
    { nameKn: 'ಚಿತ್ರಾಪೂರ್ಣಿಮಾ, ಹಂಪಿ ರಥೋತ್ಸವ', nameEn: 'Chitra Purnima, Hampi Ratha', date: '2026-04-02' },
    { nameKn: 'ಅಕ್ಷಯ ತದಿಗೆ', nameEn: 'Akshaya Tadige', date: '2026-04-20' },
    { nameKn: 'ಶ್ರೀ ನರಸಿಂಹ ಜಯಂತೀ', nameEn: 'Sri Narasimha Jayanti', date: '2026-04-30' },
    { nameKn: 'ದೀಪಸ್ತಂಭ ಗೌರೀ ವ್ರತ', nameEn: 'Deepastambha Gauri Vrata', date: '2026-08-12' },
    { nameKn: 'ನಾಗಚತುರ್ಥಿ', nameEn: 'Naga Chaturthi', date: '2026-08-16' },
    { nameKn: 'ನಾಗಪಂಚಮೀ', nameEn: 'Naga Panchami', date: '2026-08-17' },
    { nameKn: 'ಋಗ್ವೇದ ಉಪಾಕರ್ಮ', nameEn: 'Rigveda Upakarma', date: '2026-08-26' },
    { nameKn: 'ವರಮಹಾಲಕ್ಷ್ಮೀ ವ್ರತ - ಯಜುರ್ವೇದ ಉಪಾಕರ್ಮ', nameEn: 'Varamahalakshmi Vrata / Yajurveda Upakarma', date: '2026-08-28' },
    { nameKn: 'ಶ್ರೀ ರಾಘವೇಂದ್ರ ಗುರುಸಾರ್ವಭೌಮರ ಆರಾಧನೆ (ಪೂರ್ವ, ಮಧ್ಯ, ಉತ್ತರ)', nameEn: 'Sri Guru Raghavendra Swamy Aradhana (Poorva, Madhya, Uttara)', date: '2026-08-29', endDate: '2026-08-31' },
    { nameKn: 'ಶ್ರೀಕೃಷ್ಣ ಜನ್ಮಾಷ್ಟಮೀ', nameEn: 'Sri Krishna Janmashtami', date: '2026-09-04' },
    { nameKn: 'ಸ್ವರ್ಣಗೌರೀ ವ್ರತ - ಗಣೇಶ ಚತುರ್ಥಿ', nameEn: 'Swarna Gauri Vrata - Ganesha Chaturthi', date: '2026-09-14' },
    { nameKn: 'ಋಷಿ ಪಂಚಮೀ', nameEn: 'Rishi Panchami', date: '2026-09-15' },
    { nameKn: 'ಅನಂತ ಚತುರ್ದಶೀ', nameEn: 'Ananta Chaturdashi', date: '2026-09-25' },
    { nameKn: 'ಶರನ್ನವರಾತ್ರೀ ಆರಂಭ', nameEn: 'Sharannavaratri Begins', date: '2026-10-11' },
    { nameKn: 'ಸರಸ್ವತೀ ಆವಾಹನೆ', nameEn: 'Saraswati Avahane', date: '2026-10-16' },
    { nameKn: 'ಸರಸ್ವತೀ ಪೂಜೆ', nameEn: 'Saraswati Pooje', date: '2026-10-18' },
    { nameKn: 'ದುರ್ಗಾಷ್ಟಮೀ', nameEn: 'Durgashtami', date: '2026-10-19' },
    { nameKn: 'ಮಹಾನವಮೀ, ವಿಜಯದಶಮೀ', nameEn: 'Mahanavami, Vijayadashami', date: '2026-10-20' },
    { nameKn: 'ಶ್ರೀ ಮಧ್ವ ಜಯಂತೀ', nameEn: 'Sri Madhwa Jayanti', date: '2026-10-21' },
    { nameKn: 'ನೀರು ತುಂಬುವ ಹಬ್ಬ', nameEn: 'Neeru Thumbuva Habba', date: '2026-11-07' },
    { nameKn: 'ನರಕ ಚತುರ್ದಶೀ, ಧನಲಕ್ಷ್ಮೀ ಪೂಜಾ', nameEn: 'Naraka Chaturdashi, Dhana Lakshmi Pooja', date: '2026-11-08' },
    { nameKn: 'ದೀಪಾವಲೀ ಅಮಾವಾಸ್ಯೆ', nameEn: 'Deepavali Amavasya', date: '2026-11-09' },
    { nameKn: 'ಬಲಿಪಾಡ್ಯಮಿ', nameEn: 'Balipadyami', date: '2026-11-10' },
    { nameKn: 'ಉತ್ಥಾನ ದ್ವಾದಶೀ, ತುಳಸೀ ವಿವಾಹ', nameEn: 'Utthana Dwadashi, Tulasi Vivaha', date: '2026-11-21' },
    { nameKn: 'ಹನುಮದ್ವ್ರತ', nameEn: 'Hanumad Vrata', date: '2026-12-22' },
    { nameKn: 'ಮಕರ ಸಂಕ್ರಮಣ (ಉತ್ತರಾಯಣ ಪುಣ್ಯಕಾಲ)', nameEn: 'Makara Sankramana (Pongal / Uttarayana)', date: '2027-01-15' },
    { nameKn: 'ರಥಸಪ್ತಮೀ', nameEn: 'Ratha Saptami', date: '2027-02-13' },
    { nameKn: 'ಭೀಷ್ಮಾಷ್ಟಮೀ', nameEn: 'Bhishmashtami', date: '2027-02-14' },
    { nameKn: 'ಮಧ್ವನವಮೀ', nameEn: 'Madhwa Navami', date: '2027-02-15' },
    { nameKn: 'ಭಾರತ ಹುಣ್ಣಿಮೆ, ಬಳ್ಳಾರಿ ರಥ', nameEn: 'Bharata Hunnime, Ballari Ratha', date: '2027-02-20' },
    { nameKn: 'ಮಹಾಶಿವರಾತ್ರೀ', nameEn: 'Maha Shivaratri', date: '2027-03-06' },
    { nameKn: 'ಕಾಮದಹನ', nameEn: 'Kama Dahana', date: '2027-03-21' },
    { nameKn: 'ಹೋಳಿ ಹುಣ್ಣಿಮೆ', nameEn: 'Holi Hunnime', date: '2027-03-22' },
];

export const RAYARU_ARADHANA_SAPTAHA: AradhanaItem[] = [
    { date: '2026-08-27', dayKn: 'ಗುರುವಾರ', dayEn: 'Thursday', eventKn: 'ಧ್ವಜಾರೋಹಣ, ಪ್ರಾರ್ಥನೋತ್ಸವ, ಪ್ರಭಾ ಉತ್ಸವ, ಧಾನ್ಯೋತ್ಸವಾದಿಗಳು', eventEn: 'Dhwajarohana, Prarthanotsava, Prabha Utsava, Dhanyotsava' },
    { date: '2026-08-28', dayKn: 'ಶುಕ್ರವಾರ', dayEn: 'Friday', eventKn: 'ಶಾಕೋತ್ಸವ, ರಜತಮಂಟಪೋತ್ಸವಾದಿಗಳು', eventEn: 'Shakotsava, Rajata Mantapotsava' },
    { date: '2026-08-29', dayKn: 'ಶನಿವಾರ', dayEn: 'Saturday', eventKn: 'ಪೂರ್ವಾರಾಧನೆ, ಸಿಂಹವಾಹನಾದಿಗಳು', eventEn: 'Poorvaradhana, Simhavahanotsava' },
    { date: '2026-08-30', dayKn: 'ರವಿವಾರ', dayEn: 'Sunday', eventKn: 'ಮಧ್ಯಾರಾಧನೆ, ರಾತ್ರಿ ಗಜ, ರಜತ, ಸ್ವರ್ಣರಥೋತ್ಸವ', eventEn: 'Madhyaradhana, Gaja, Rajata, Swarna Rathotsava' },
    { date: '2026-08-31', dayKn: 'ಸೋಮವಾರ', dayEn: 'Monday', eventKn: 'ಉತ್ತರಾರಾಧನೆ, ಪ್ರಾತಃ ಮಹಾರಥೋತ್ಸವ', eventEn: 'Uttararadhana, Pratah Maha Rathotsava' },
    { date: '2026-09-01', dayKn: 'ಮಂಗಳವಾರ', dayEn: 'Tuesday', eventKn: 'ಅಶ್ವವಾಹನಾದಿಗಳು', eventEn: 'Ashwavahanotsava' },
    { date: '2026-09-02', dayKn: 'ಬುಧವಾರ', dayEn: 'Wednesday', eventKn: 'ಸರ್ವಸಮರ್ಪಣೋತ್ಸವ || ಮಂಗಳಂ ||', eventEn: 'Sarva Samarpana Utsava (Mangalam)' },
];
