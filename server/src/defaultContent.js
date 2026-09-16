// Initial invitation content. Everything here is editable from the dashboard;
// this object is only used to seed the database the first time the server starts.
export const defaultContent = {
  meta: {
    title: 'عمار الحللي & سنا العوا',
    description: 'يسعدنا دعوتكم لحضور حفل زفاف المهندس عمار الحللي و المهندسة سنا العوا',
    language: 'ar',
    direction: 'rtl',
  },
  theme: {
    primary: '#511419', // deep burgundy used for cards, text and buttons
    accent: '#590310', // "Save the date" text
    background: '#fff7eb', // cream page background
    light: '#ece4d8', // text on burgundy cards
    paperTexture: true,
    castleBackground: true,
    flowers: true,
  },
  cover: {
    enabled: true,
    greeting: 'نتشرف بدعوتكم',
    openLabel: 'فتح',
    showGuestName: true,
    guestPrefix: 'إلى',
    // After the guest taps "فتح", the page glides down by itself until the
    // guest touches/scrolls or the end is reached.
    autoScroll: true,
    autoScrollSpeed: 45, // pixels per second
    autoScrollDelay: 1.2, // seconds to wait after the cover opens
  },
  header: {
    saveTheDate: 'Save The Date',
    dateShort: '26.09.26',
    photo: '/theme/photo.webp',
  },
  groom: {
    shortName: 'عمار الحللي',
    fullName: 'المهندس عمار الحللي',
    subtitle: '',
    parentTitle: 'الحاج',
    parentName: 'محمد فريز الحللي',
    parentName2: '',
  },
  bride: {
    shortName: 'سنا العوا',
    fullName: 'المهندسة سنا العوا',
    subtitle: '',
    parentTitle: 'الحاج',
    parentName: 'محمد عرفان العوا',
    parentName2: '',
  },
  announcement: 'بكل الحب والسرور نعلن\nعن زفاف أبنائنا',
  event: {
    title: 'معلومات الاستقبال',
    subtitle: 'سيقام الاستقبال في:',
    date: '2026-09-26',
    startTime: '19:00',
    endTime: '21:00',
    timezone: 'Europe/Berlin',
    timeLabel: 'الاستقبال',
    countdownLabel: 'العد التنازلي',
    calendarLabel: 'أضف إلى التقويم',
    calendarTitle: 'زفاف المهندس عمار الحللي و المهندسة سنا العوا',
    calendarDetails: 'يسعدنا دعوتكم لحضور حفل زفاف المهندس عمار الحللي و المهندسة سنا العوا',
    showCalendar: true,
    showCountdown: true,
  },
  venue: {
    title: 'مكان الاستقبال',
    name: 'الصالة البهية - قاعة النسرين',
    address: '',
    mapQuery: 'الصالة البهية - قاعة النسرين',
    mapEmbedUrl: '',
    directionsLabel: 'الاتجاهات',
    showMap: true,
  },
  gallery: {
    enabled: true,
    images: ['/theme/photo.webp'],
  },
  guestbook: {
    enabled: true,
    title: 'سجل التهاني',
    namePlaceholder: 'أدخل اسمك*',
    messagePlaceholder: 'اكتب تهنئتك*',
    submitLabel: 'إرسال التهنئة',
    emptyText: 'لا توجد تهاني بعد. كن الأول!',
    successText: 'شكراً لك! تم إرسال تهنئتك.',
    requireApproval: false,
    suggestions: [
      'ألف مبروك، وبالرفاه والبنين',
      'بارك الله لكما وبارك عليكما وجمع بينكما في خير',
      'كل التهاني والأمنيات بحياة زوجية سعيدة',
      'مبارك الزفاف، وعقبال الفرحة الدائمة',
    ],
  },
  footer: {
    text: 'حضوركم سيكون أعظم هدية نتلقاها في يومنا المميز!',
    credit: '',
  },
  music: {
    enabled: true,
    url: '',
    title: '',
    autoplay: true,
    loop: true,
    volume: 0.7,
  },
}
