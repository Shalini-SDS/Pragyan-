import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.triage': 'Triage',
    'nav.overview': 'Overview',
    'nav.doctors': 'Doctors',
    'nav.patients': 'Patients',
    'nav.nurses': 'Nurses',
    
    // Home Page
    'home.title': 'Intelligent Patient Triage System',
    'home.subtitle': 'Revolutionizing emergency care with AI-driven patient analysis, risk assessment, and smart department routing for faster, more efficient healthcare delivery.',
    'home.startTriage': 'Start Patient Triage',
    'home.hospitalOverview': 'Hospital Overview',
    'home.systemFeatures': 'System Features',
    'home.howItWorks': 'How It Works',
    
    // Triage
    'triage.title': 'Patient Triage',
    'triage.subtitle': 'AI-powered patient assessment and department routing',
    'triage.basicInfo': 'Basic Information',
    'triage.medicalInfo': 'Medical Information',
    'triage.vitals': 'Vital Signs',
    'triage.guardian': 'Guardian/Emergency Contact',
    'triage.uploadEHR': 'Upload EHR (Optional)',
    'triage.submit': 'Perform AI Triage Assessment',
    
    // Common
    'common.search': 'Search',
    'common.available': 'Available',
    'common.busy': 'Busy',
    'common.onLeave': 'On Leave',
    'common.high': 'High',
    'common.medium': 'Medium',
    'common.low': 'Low',
    'common.risk': 'Risk',
    'common.department': 'Department',
    'common.back': 'Back',
    
    // Footer
    'footer.copyright': '© 2026 MediTriage AI. All rights reserved.',
    'footer.tagline': 'Intelligent Healthcare Management System',
  },
  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.triage': 'ट्राइएज',
    'nav.overview': 'अवलोकन',
    'nav.doctors': 'डॉक्टर',
    'nav.patients': 'मरीज',
    'nav.nurses': 'नर्स',
    
    // Home Page
    'home.title': 'बुद्धिमान रोगी ट्राइएज प्रणाली',
    'home.subtitle': 'एआई-संचालित रोगी विश्लेषण, जोखिम मूल्यांकन और तेज, अधिक कुशल स्वास्थ्य सेवा वितरण के लिए स्मार्ट विभाग रूटिंग के साथ आपातकालीन देखभाल में क्रांति।',
    'home.startTriage': 'रोगी ट्राइएज शुरू करें',
    'home.hospitalOverview': 'अस्पताल अवलोकन',
    'home.systemFeatures': 'प्रणाली सुविधाएँ',
    'home.howItWorks': 'यह कैसे काम करता है',
    
    // Triage
    'triage.title': 'रोगी ट्राइएज',
    'triage.subtitle': 'एआई-संचालित रोगी मूल्यांकन और विभाग रूटिंग',
    'triage.basicInfo': 'बुनियादी जानकारी',
    'triage.medicalInfo': 'चिकित्सा जानकारी',
    'triage.vitals': 'महत्वपूर्ण संकेत',
    'triage.guardian': 'अभिभावक/आपातकालीन संपर्क',
    'triage.uploadEHR': 'ईएचआर अपलोड करें (वैकल्पिक)',
    'triage.submit': 'एआई ट्राइएज मूल्यांकन करें',
    
    // Common
    'common.search': 'खोजें',
    'common.available': 'उपलब्ध',
    'common.busy': 'व्यस्त',
    'common.onLeave': 'अवकाश पर',
    'common.high': 'उच्च',
    'common.medium': 'मध्यम',
    'common.low': 'निम्न',
    'common.risk': 'जोखिम',
    'common.department': 'विभाग',
    'common.back': 'वापस',
    
    // Footer
    'footer.copyright': '© 2026 मेडीट्राइएज एआई। सर्वाधिकार सुरक्षित।',
    'footer.tagline': 'बुद्धिमान स्वास्थ्य सेवा प्रबंधन प्रणाली',
  },
  ta: {
    // Navigation
    'nav.home': 'முகப்பு',
    'nav.triage': 'ட்ரையேஜ்',
    'nav.overview': 'மேலோட்டம்',
    'nav.doctors': 'மருத்துவர்கள்',
    'nav.patients': 'நோயாளிகள்',
    'nav.nurses': 'செவிலியர்கள்',
    
    // Home Page
    'home.title': 'அறிவார்ந்த நோயாளி ட்ரையேஜ் அமைப்பு',
    'home.subtitle': 'AI-இயக்கப்படும் நோயாளி பகுப்பாய்வு, ஆபத்து மதிப்பீடு மற்றும் வேகமான, திறமையான சுகாதார சேவை வழங்கலுக்கான ஸ்மார்ட் துறை வழித்தடத்துடன் அவசர சிகிச்சையில் புரட்சி.',
    'home.startTriage': 'நோயாளி ட்ரையேஜ் தொடங்கு',
    'home.hospitalOverview': 'மருத்துவமனை மேலோட்டம்',
    'home.systemFeatures': 'அமைப்பு அம்சங்கள்',
    'home.howItWorks': 'இது எவ்வாறு செயல்படுகிறது',
    
    // Triage
    'triage.title': 'நோயாளி ட்ரையேஜ்',
    'triage.subtitle': 'AI-இயக்கப்படும் நோயாளி மதிப்பீடு மற்றும் துறை வழித்தடம்',
    'triage.basicInfo': 'அடிப்படை தகவல்',
    'triage.medicalInfo': 'மருத்துவ தகவல்',
    'triage.vitals': 'முக்கிய அறிகுறிகள்',
    'triage.guardian': 'பாதுகாவலர்/அவசர தொடர்பு',
    'triage.uploadEHR': 'EHR பதிவேற்றவும் (விருப்பமானது)',
    'triage.submit': 'AI ட்ரையேஜ் மதிப்பீடு செய்',
    
    // Common
    'common.search': 'தேடு',
    'common.available': 'கிடைக்கிறது',
    'common.busy': 'பிஸி',
    'common.onLeave': 'விடுப்பில்',
    'common.high': 'உயர்',
    'common.medium': 'நடுத்தர',
    'common.low': 'குறைவான',
    'common.risk': 'ஆபத்து',
    'common.department': 'துறை',
    'common.back': 'பின்',
    
    // Footer
    'footer.copyright': '© 2026 மெடிட்ரையேஜ் AI. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
    'footer.tagline': 'அறிவார்ந்த சுகாதார மேலாண்மை அமைப்பு',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
