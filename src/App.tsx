import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { 
  Search, Globe, Phone, MapPin, AlertCircle, 
  Heart, ShoppingCart, ArrowLeft, Home,
  LogIn, User, LogOut, Lock, Fingerprint,
  Eye, EyeOff, ShieldCheck, UserCheck, CreditCard,
  CheckCircle2, UserPlus, Smartphone, Mail, Key
} from 'lucide-react';
import { PushNotifications } from '@capacitor/push-notifications';

interface InventoryItem {
  id: string;
  name: string;
  barcode: string;
  brand: string | null;
  model: string | null;
  quantity: number;
  selling_price_usd: number;
  category: string | null;
  image_url: string | null;
  created_at: string;
  isService?: boolean;
  expected_duration_minutes?: number;
  is_category_affected?: boolean;
  silver_discount_percent?: number;
  gold_discount_percent?: number;
  platinum_discount_percent?: number;
}

const CATEGORIES = {
  ar: [
    { val: 'ALL', label: 'الكل' },
    { val: 'SERVICES', label: 'الخدمات' },
    { val: 'SPARE_PARTS', label: 'قطع الغيار' },
    { val: 'OILS', label: 'الزيوت والسوائل' },
    { val: 'TIRES', label: 'الاطارات' },
    { val: 'ACCESSORIES', label: 'اكسسوارات السيارات' },
    { val: 'BATTERIES', label: 'البطاريات' },
    { val: 'OTHER', label: 'تصنيفات اخرى' }
  ],
  en: [
    { val: 'ALL', label: 'All' },
    { val: 'SERVICES', label: 'Services' },
    { val: 'SPARE_PARTS', label: 'Spare Parts' },
    { val: 'OILS', label: 'Oils & Fluids' },
    { val: 'TIRES', label: 'Tires' },
    { val: 'ACCESSORIES', label: 'Car Accessories' },
    { val: 'BATTERIES', label: 'Batteries' },
    { val: 'OTHER', label: 'Other Categories' }
  ]
};

const TRANSLATIONS = {
  ar: {
    title: 'دليل قطع غيار QUICK AUTO',
    subtitle: 'ابحث عن قطع الغيار والملحقات المتوفرة في مركزنا الفني مباشرة وبشفافية',
    searchPlaceholder: 'ابحث باسم القطعة، ماركتها، أو كود OEM...',
    exchangeRateText: 'سعر الصرف اليومي المعتمد:',
    currencySYP: 'ل.س',
    inStock: 'متوفر في المركز',
    outOfStock: 'غير متوفر مؤقتاً',
    lowStock: 'كمية محدودة',
    brand: 'الماركة:',
    model: 'الموديل المتوافق:',
    code: 'كود القطعة (OEM):',
    phone: 'اتصال ومبيعات',
    address: 'سوريا – درعا – المنطقة الصناعية – جنوب الحديقة',
    noResults: 'لم يتم العثور على قطع تطابق بحثك. يرجى مراجعة الاسم أو الكود.',
    loading: 'جاري تحميل دليل قطع الغيار...',
    allRightsReserved: 'جميع الحقوق محفوظة. مركز كويك أوتو الفني',
    qtyAvailable: 'الكمية المتوفرة:',
    pieces: 'قطع',
    orderWhatsApp: 'طلب عبر واتساب',
    totalParts: 'إجمالي القطع المتاحة',
    totalCategories: 'الأقسام المتاحة',
    lastUpdated: 'تحديث فوري ومباشر',
    copy: 'نسخ الكود',
    copied: 'تم النسخ!'
  },
  en: {
    title: 'QUICK AUTO Spare Parts Catalog',
    subtitle: 'Search available parts, oils, and accessories in our center transparently',
    searchPlaceholder: 'Search by part name, brand, or OEM code...',
    exchangeRateText: 'Approved Exchange Rate:',
    currencySYP: 'SYP',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    lowStock: 'Low Stock',
    brand: 'Brand:',
    model: 'Model:',
    code: 'Part Code (OEM):',
    phone: 'Sales & Contact',
    address: 'Syria – Daraa – Industrial Area – South of the Park',
    noResults: 'No parts matched your search. Please check the name or code.',
    loading: 'Loading spare parts catalog...',
    allRightsReserved: 'All Rights Reserved. QUICK AUTO Technical Center',
    qtyAvailable: 'Available Qty:',
    pieces: 'pcs',
    orderWhatsApp: 'Order via WhatsApp',
    totalParts: 'Total Items Available',
    totalCategories: 'Categories',
    lastUpdated: 'Live Database Sync',
    copy: 'Copy Code',
    copied: 'Copied!'
  }
};

const getCategoryImageUrl = (category: string | null, name: string) => {
  const cat = (category || '').toUpperCase();
  const lowerName = (name || '').toLowerCase();
  
  if (cat.includes('OIL') || cat.includes('زيت') || lowerName.includes('زيت') || lowerName.includes('oil') || lowerName.includes('fluid') || lowerName.includes('سائل')) {
    return 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80';
  }
  if (cat.includes('TIRE') || cat.includes('بطارية') || cat.includes('إطار') || lowerName.includes('إطار') || lowerName.includes('tire') || lowerName.includes('wheel') || lowerName.includes('battery') || lowerName.includes('بطارية')) {
    return 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80';
  }
  if (cat.includes('ACCESSORY') || cat.includes('إكسسوار') || lowerName.includes('اكسسوار') || lowerName.includes('accessory') || lowerName.includes('steering') || lowerName.includes('مقود')) {
    return 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('غسيل') || lowerName.includes('wash') || lowerName.includes('تنظيف') || lowerName.includes('تلميع') || lowerName.includes('بوليش')) {
    return 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('فحص') || lowerName.includes('فني') || lowerName.includes('scan') || lowerName.includes('diagnose') || lowerName.includes('كمبيوتر')) {
    return 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=400&q=80';
  }
  if (lowerName.includes('صيانة') || lowerName.includes('ميكانيك') || lowerName.includes('mechanic') || lowerName.includes('repair') || lowerName.includes('تصليح') || lowerName.includes('ضبط') || lowerName.includes('عيار')) {
    return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80';
};

const getCategoryDetails = (val: string, _lang?: 'ar' | 'en') => {
  type D = { img: string; descAr: string; descEn: string };
  const m: Record<string, D> = {
    ALL: { img: '/cat-all.jpg', descAr: 'عرض جميع قطع الغيار والخدمات المتاحة لدينا في المركز', descEn: 'View all available spare parts and technical services in our center' },
    SPARE_PARTS: { img: '/cat-spare-parts.jpg', descAr: 'فلاتر، بواجي، مساعدات، طرمبات، دوزان وميكانيك عام', descEn: 'Filters, spark plugs, shocks, pumps, and general mechanical parts' },
    OILS: { img: '/cat-oils.jpg', descAr: 'زيوت محركات أصلية، سوائل فرامل، مانع تجمد وهيدروليك', descEn: 'Original engine oils, brake fluids, coolants, and hydraulics' },
    TIRES: { img: '/cat-tires.jpg', descAr: 'إطارات سيارات يابانية وكورية وعالمية بمختلف المقاسات', descEn: 'Japanese, Korean, and global car tires of all sizes' },
    BATTERIES: { img: '/cat-batteries.jpg', descAr: 'بطاريات جافة ومغلقة مع كفالة حقيقية للتشغيل والأداء', descEn: 'Maintenance-free sealed batteries with solid warranty' },
    SERVICES: { img: '/cat-services.jpg', descAr: 'دوزان الكتروني - ترصيص الكتروني - تبديل اطارات - تبديل زيوت وسوائل - صيانة المكيف ...الخ', descEn: 'Electronic wheel alignment - balancing - tire replacement - oil change - AC maintenance ...etc' },
    ACCESSORIES: { img: '/cat-accessories.png', descAr: 'مساحات الزجاج - معطرات ...الخ', descEn: 'Windshield wipers - air fresheners ...etc' },
    OTHER: { img: '/cat-other.png', descAr: 'إكسسوارات إضافية، إنارة ولدات، ومستلزمات العناية المتنوعة', descEn: 'Additional car accessories, LED lighting, and maintenance gear' },
  };
  return m[val] || m['OTHER'];
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [search, setSearch] = useState('');

  // PWA Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Developer FCM Token State
  const logoClickCountRef = useRef(0);
  const [showDevModal, setShowDevModal] = useState(false);
  const [fcmToken, setFcmToken] = useState('');

  // Push Notifications initialization
  const initPushNotifications = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      await PushNotifications.register();

      PushNotifications.addListener('registration', (token) => {
        console.log('FCM Token successfully registered:', token.value);
        localStorage.setItem('fcm_token', token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('FCM Registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Foreground push notification received:', notification);
        alert(`${notification.title}\n\n${notification.body}`);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action performed:', action);
      });

    } catch (e) {
      console.error('Error initializing push notifications:', e);
    }
  };

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Detect if running inside Capacitor native app wrapper
    const isNative = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:' || 
                     window.location.protocol === 'capacitor:' ||
                     window.location.protocol === 'iosapp:';

    if (isNative) {
      setIsNativeApp(true);
      setShowInstallBanner(false);
      initPushNotifications();
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = localStorage.getItem('pwa_install_dismissed') === 'true';
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS and not running standalone, show the custom iOS install guide
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setShowInstallBanner(false);
    } else if (ios) {
      const isDismissed = localStorage.getItem('pwa_install_dismissed') === 'true';
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismissInstall = () => {
    localStorage.setItem('pwa_install_dismissed', 'true');
    setShowInstallBanner(false);
  };

  // User Authentication & Lock Screen states
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('catalog_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authModal, setAuthModal] = useState<'login' | 'signup' | 'profile' | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('catalog_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return !!parsed.pin;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [authForm, setAuthForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    pin: ''
  });
  
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [checkoutPin, setCheckoutPin] = useState('');
  const [isVerifyingBiometrics, setIsVerifyingBiometrics] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const resetAuthForm = () => {
    setAuthForm({
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      pin: ''
    });
    setAuthError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    const { name, phone, email, password, confirmPassword, pin } = authForm;
    
    if (!name.trim()) {
      setAuthError(lang === 'ar' ? 'الاسم الكامل مطلوب' : 'Full Name is required');
      return;
    }
    if (!phone.trim()) {
      setAuthError(lang === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required');
      return;
    }
    if (!password) {
      setAuthError(lang === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required');
      return;
    }
    if (password.length < 6) {
      setAuthError(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 خانات على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (!pin || pin.length < 4 || pin.length > 6 || isNaN(Number(pin))) {
      setAuthError(lang === 'ar' ? 'الرمز السري (PIN) يجب أن يكون بين 4 إلى 6 أرقام' : 'PIN code must be 4 to 6 digits');
      return;
    }

    setAuthLoading(true);
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (checkError) throw checkError;

      const userAddressData = {
        password,
        pin,
        biometricsEnabled: true
      };

      if (existingUser) {
        let parsedAddr: any = {};
        try {
          parsedAddr = JSON.parse(existingUser.address || '{}');
        } catch {}
        
        if (parsedAddr.password) {
          setAuthError(lang === 'ar' ? 'رقم الهاتف هذا مسجل بالفعل. يرجى تسجيل الدخول.' : 'This phone number is already registered. Please log in.');
          setAuthLoading(false);
          return;
        }

        const { error: updateError } = await supabase
          .from('customers')
          .update({
            name: name,
            email: email || null,
            address: JSON.stringify(userAddressData)
          })
          .eq('id', existingUser.id);

        if (updateError) throw updateError;
        
        const loggedUser = {
          id: existingUser.id,
          name: name,
          phone: phone,
          email: email || null,
          pin: pin,
          biometricsEnabled: true
        };
        localStorage.setItem('catalog_user', JSON.stringify(loggedUser));
        setCurrentUser(loggedUser);
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('customers')
          .insert([{
            name: name,
            phone: phone,
            email: email || null,
            address: JSON.stringify(userAddressData),
            membership_tier: 'normal',
            loyalty_points: 0
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        const loggedUser = {
          id: newUser.id,
          name: name,
          phone: phone,
          email: email || null,
          pin: pin,
          biometricsEnabled: true
        };
        localStorage.setItem('catalog_user', JSON.stringify(loggedUser));
        setCurrentUser(loggedUser);
      }

      setAuthModal(null);
      resetAuthForm();
      alert(lang === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
    } catch (err: any) {
      console.error('Registration error:', err);
      setAuthError(err.message || 'Error occurred during registration');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    const { phone, password } = authForm;
    
    if (!phone.trim()) {
      setAuthError(lang === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required');
      return;
    }
    if (!password) {
      setAuthError(lang === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required');
      return;
    }

    setAuthLoading(true);
    try {
      const { data: user, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!user) {
        setAuthError(lang === 'ar' ? 'رقم الهاتف غير مسجل' : 'Phone number is not registered');
        setAuthLoading(false);
        return;
      }

      let parsedAddr: any = null;
      try {
        parsedAddr = JSON.parse(user.address || '{}');
      } catch {}

      if (!parsedAddr || !parsedAddr.password) {
        setAuthError(lang === 'ar' ? 'هذا الحساب لم يتم تفعيل الشراء أونلاين له. يرجى إنشاء حساب جديد.' : 'This account has not activated online shopping. Please sign up.');
        setAuthLoading(false);
        return;
      }

      if (parsedAddr.password !== password) {
        setAuthError(lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password');
        setAuthLoading(false);
        return;
      }

      const loggedUser = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        pin: parsedAddr.pin,
        biometricsEnabled: parsedAddr.biometricsEnabled !== false
      };

      localStorage.setItem('catalog_user', JSON.stringify(loggedUser));
      setCurrentUser(loggedUser);
      setAuthModal(null);
      resetAuthForm();
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Error occurred during login');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('catalog_user');
    setCurrentUser(null);
    setAuthModal(null);
    setIsLocked(false);
  };

  const handleToggleBiometrics = async () => {
    if (!currentUser) return;
    try {
      const newBiometricsState = !currentUser.biometricsEnabled;
      const updatedUser = { ...currentUser, biometricsEnabled: newBiometricsState };
      
      const { data: dbUser } = await supabase.from('customers').select('*').eq('id', currentUser.id).single();
      if (dbUser) {
        let addrObj = {};
        try { addrObj = JSON.parse(dbUser.address || '{}'); } catch {}
        const newAddr = { ...addrObj, biometricsEnabled: newBiometricsState };
        await supabase.from('customers').update({ address: JSON.stringify(newAddr) }).eq('id', currentUser.id);
      }
      
      localStorage.setItem('catalog_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    } catch (err) {
      console.error('Error toggling biometrics:', err);
    }
  };

  const handleUnlockPin = (num: string) => {
    if (pinInput.length >= 6) return;
    const nextInput = pinInput + num;
    setPinInput(nextInput);
    setAuthError('');

    if (currentUser && currentUser.pin && nextInput.length === currentUser.pin.length) {
      if (nextInput === currentUser.pin) {
        setIsLocked(false);
        setPinInput('');
      } else {
        setAuthError(lang === 'ar' ? 'الرمز السري غير صحيح' : 'Incorrect PIN');
        setPinInput('');
      }
    }
  };

  const handleUnlockFingerprint = () => {
    setIsVerifyingBiometrics(true);
    setAuthError('');
    setTimeout(() => {
      setIsVerifyingBiometrics(false);
      setIsLocked(false);
      setPinInput('');
    }, 1500);
  };

  const handleCheckoutPinChange = (num: string) => {
    const pinLen = currentUser?.pin?.length || 4;
    if (checkoutPin.length >= pinLen) return;
    const nextInput = checkoutPin + num;
    setCheckoutPin(nextInput);
    
    if (currentUser && nextInput.length === pinLen) {
      if (nextInput === currentUser.pin) {
        setCheckoutSuccess(true);
        setCart({});
        localStorage.removeItem('quickauto_cart');
      } else {
        alert(lang === 'ar' ? 'الرمز السري غير صحيح' : 'Incorrect PIN');
        setCheckoutPin('');
      }
    }
  };

  const handleCheckoutFingerprint = () => {
    setIsVerifyingBiometrics(true);
    setTimeout(() => {
      setIsVerifyingBiometrics(false);
      setCheckoutSuccess(true);
      setCart({});
      localStorage.removeItem('quickauto_cart');
    }, 1500);
  };

  const handleStartCheckout = () => {
    if (!currentUser) {
      setAuthModal('login');
      alert(lang === 'ar' ? 'الرجاء تسجيل الدخول أولاً لإتمام الشراء والدفع أونلاين' : 'Please log in first to complete purchase & pay online');
      return;
    }
    setCheckoutModal(true);
    setCheckoutPin('');
    setCheckoutSuccess(false);
    
    if (currentUser.biometricsEnabled) {
      handleCheckoutFingerprint();
    }
  };
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'categories' | 'items'>('categories');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLElement>(null);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quickauto_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cart: Record<itemId, qty>
  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('quickauto_cart');
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      // migrate old string[] format
      if (Array.isArray(parsed)) {
        return Object.fromEntries(parsed.map((id: string) => [id, 1]));
      }
      return parsed as Record<string, number>;
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('quickauto_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('quickauto_cart', JSON.stringify(cart));
  }, [cart]);

  const handleToggleWishlist = (id: string) => {
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Add to cart (toggle: first press adds 1, second removes)
  const handleToggleCart = (id: string) => {
    setCart(prev => {
      if ((prev[id] || 0) > 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  };

  // Change qty in cart (+/-)
  const handleChangeQty = (id: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const [activeList, setActiveList] = useState<'wishlist' | 'cart' | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [pullOffset, setPullOffset] = useState(0);

  // Native back navigation helpers
  const navigateToCategories = () => {
    const state = window.history.state;
    if (state) {
      if (state.type === 'category') {
        window.history.go(-1);
        return;
      }
      if (state.type === 'item-details') {
        window.history.go(-2);
        return;
      }
      if (state.type === 'cart' || state.type === 'wishlist') {
        if (selectedCategory && selectedCategory !== 'ALL') {
          window.history.go(-2);
        } else {
          window.history.go(-1);
        }
        return;
      }
      if (state.type === 'zoomed-image') {
        window.history.go(-3);
        return;
      }
    }
    
    setViewMode('categories');
    setSelectedCategory('ALL');
    setSearch('');
    if (window.history.state?.type !== 'categories') {
      window.history.replaceState({ type: 'categories' }, '');
    }
  };

  const handleLogoClick = () => {
    navigateToCategories();
    logoClickCountRef.current += 1;
    if (logoClickCountRef.current >= 5) {
      const token = localStorage.getItem('fcm_token') || 'No token registered yet';
      setFcmToken(token);
      setShowDevModal(true);
      logoClickCountRef.current = 0;
    }
    // Reset tap count after 3 seconds of inactivity
    if (logoClickCountRef.current === 1) {
      setTimeout(() => {
        logoClickCountRef.current = 0;
      }, 3000);
    }
  };

  const navigateToCategory = (catVal: string) => {
    setSelectedCategory(catVal);
    setViewMode('items');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.history.state?.type && window.history.state.type !== 'categories') {
      window.history.replaceState({ type: 'category', category: catVal }, '');
    } else {
      window.history.pushState({ type: 'category', category: catVal }, '');
    }
  };

  const openDrawer = (listType: 'wishlist' | 'cart') => {
    setActiveList(listType);
    if (window.history.state?.type === 'cart' || window.history.state?.type === 'wishlist') {
      window.history.replaceState({ type: listType }, '');
    } else {
      window.history.pushState({ type: listType }, '');
    }
  };

  const closeDrawer = () => {
    if (window.history.state?.type === 'cart' || window.history.state?.type === 'wishlist') {
      window.history.back();
    } else {
      setActiveList(null);
    }
  };

  const openItemDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    if (window.history.state?.type === 'item-details') {
      window.history.replaceState({ type: 'item-details', itemId: item.id }, '');
    } else {
      window.history.pushState({ type: 'item-details', itemId: item.id }, '');
    }
  };

  const closeItemDetails = () => {
    if (window.history.state?.type === 'item-details') {
      window.history.back();
    } else {
      setSelectedItem(null);
    }
  };

  const openZoomedImage = (imgUrl: string) => {
    setZoomedImage(imgUrl);
    window.history.pushState({ type: 'zoomed-image', imgUrl }, '');
  };

  const closeZoomedImage = () => {
    if (window.history.state?.type === 'zoomed-image') {
      window.history.back();
    } else {
      setZoomedImage(null);
    }
  };

  useEffect(() => {
    // Set initial state on mount with exit guard
    if (!window.history.state) {
      window.history.replaceState({ type: 'exit-guard' }, '');
      window.history.pushState({ type: 'categories' }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (!state) return;

      if (state.type === 'exit-guard') {
        setShowExitConfirm(true);
        window.history.pushState({ type: 'categories' }, '');
        setViewMode('categories');
        setSelectedItem(null);
        setActiveList(null);
        setZoomedImage(null);
      } else if (state.type === 'categories') {
        setViewMode('categories');
        setSelectedCategory('ALL');
        setSearch('');
        setSelectedItem(null);
        setActiveList(null);
        setZoomedImage(null);
      } else if (state.type === 'category') {
        setViewMode('items');
        setSelectedCategory(state.category || 'ALL');
        setSelectedItem(null);
        setActiveList(null);
        setZoomedImage(null);
      } else if (state.type === 'cart' || state.type === 'wishlist') {
        setActiveList(state.type);
        setZoomedImage(null);
        setSelectedItem(null);
      } else if (state.type === 'item-details') {
        setActiveList(null);
        setZoomedImage(null);
        setViewMode('items');
        const item = items.find(i => i.id === state.itemId);
        if (item) {
          setSelectedItem(item);
        } else {
          setSelectedItem(null);
        }
      } else if (state.type === 'zoomed-image') {
        setZoomedImage(state.imgUrl);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [items]);

  const handleExitApp = async () => {
    try {
      const { App } = await import('@capacitor/app');
      await App.exitApp();
    } catch (err) {
      window.close();
    }
  };

  // Handle native Android hardware/gesture back button
  useEffect(() => {
    let backListener: any = null;

    const setupBackListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backListener = await App.addListener('backButton', () => {
          if (zoomedImage) {
            closeZoomedImage();
          } else if (selectedItem) {
            closeItemDetails();
          } else if (activeList) {
            closeDrawer();
          } else if (viewMode === 'items') {
            navigateToCategories();
          } else if (viewMode === 'categories') {
            setShowExitConfirm(true);
          }
        });
      } catch (err) {
        console.log('Capacitor App plugin not initialized in web browser');
      }
    };

    if (isNativeApp) {
      setupBackListener();
    }

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, [isNativeApp, zoomedImage, selectedItem, activeList, viewMode]);

  const cartItems = useMemo(() => {
    return items.filter(item => (cart[item.id] || 0) > 0);
  }, [items, cart]);

  const wishlistItems = useMemo(() => {
    return items.filter(item => wishlist.includes(item.id));
  }, [items, wishlist]);

  const t = TRANSLATIONS[lang];

  // Close filter on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  // Lock body scroll when overlays open
  useEffect(() => {
    const isOpen = !!activeList || filterOpen || !!zoomedImage || !!selectedItem;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('overlay-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('overlay-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('overlay-open');
    };
  }, [activeList, filterOpen, zoomedImage, selectedItem]);

  // Pull-to-refresh custom swipe logic
  useEffect(() => {
    let startY = 0;
    let isPulling = false;

    const onTouchStart = (e: TouchEvent) => {
      const isAtTop = window.scrollY <= 0 && document.documentElement.scrollTop <= 0 && document.body.scrollTop <= 0;
      const noOverlay = !activeList && !filterOpen && !zoomedImage && !selectedItem;
      if (isAtTop && noOverlay) {
        startY = e.touches[0].clientY;
        isPulling = true;
      } else {
        isPulling = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;

      if (diffY > 0) {
        // Prevent native bounce or pull-to-refresh
        if (e.cancelable) e.preventDefault();
        const resisted = Math.pow(diffY, 0.82);
        setPullOffset(resisted);
      } else {
        isPulling = false;
        setPullOffset(0);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isPulling) return;
      isPulling = false;
      const endY = e.changedTouches[0].clientY;
      const diffY = endY - startY;
      const resisted = Math.pow(Math.max(0, diffY), 0.82);
      if (resisted > 60) {
        window.location.reload();
      } else {
        setPullOffset(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeList, filterOpen, zoomedImage, selectedItem]);

  // Custom swipe-to-back gesture handler for mobile overlays
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (!selectedItem && !activeList && !zoomedImage) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!selectedItem && !activeList && !zoomedImage) return;
      
      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      
      const diffX = touchCurrentX - touchStartX;
      const diffY = touchCurrentY - touchStartY;

      // Check for horizontal swipe with low threshold
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (zoomedImage) {
          closeZoomedImage();
        } else if (activeList) {
          closeDrawer();
        } else if (selectedItem) {
          closeItemDetails();
        }
        // Reset coordinate to avoid double trigger
        touchStartX = touchCurrentX;
        touchStartY = touchCurrentY;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [selectedItem, activeList, zoomedImage]);

  useEffect(() => {
    // 1. Fetch latest exchange rate on mount by comparing both tables and using the newer one
    const loadExchangeRate = async () => {
      try {
        const { data: catData } = await supabase
          .from('catalog_exchange_rates')
          .select('rate, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: mainData } = await supabase
          .from('exchange_rates')
          .select('rate, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let finalRate = 0;
        const catTime = catData?.created_at ? new Date(catData.created_at).getTime() : 0;
        const mainTime = mainData?.created_at ? new Date(mainData.created_at).getTime() : 0;

        if (catTime > 0 || mainTime > 0) {
          if (catTime >= mainTime && catData?.rate) {
            finalRate = catData.rate / 100;
          } else if (mainData?.rate) {
            finalRate = mainData.rate / 100;
          }
        }
        setExchangeRate(finalRate);
      } catch (e) {
        console.error("Error loading exchange rate on mount:", e);
      }
    };
    loadExchangeRate();

    // 2. Subscribe to realtime updates on catalog_exchange_rates and exchange_rates tables
    const channel = supabase.channel('catalog-exchange-rates-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'catalog_exchange_rates' }, (payload) => {
        if (payload.new && payload.new.rate) {
          setExchangeRate(payload.new.rate / 100);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exchange_rates' }, (payload) => {
        if (payload.new && payload.new.rate) {
          setExchangeRate(payload.new.rate / 100);
        }
      })
      .subscribe();

    const fetchItems = (table: string) =>
      supabase
        .from(table)
        .select('id, name, barcode, brand, model, quantity, selling_price_usd, category, image_url, created_at')
        .then(({ data, error }) => ({ data, error }));

    const fetchServices = () =>
      supabase
        .from('services')
        .select('id, name, price_usd, category, expected_duration_minutes, is_category_affected, silver_discount_percent, gold_discount_percent, platinum_discount_percent, parent_id, is_group, image_url, created_at')
        .eq('is_group', false)
        .then(({ data, error }) => ({ data, error }));

    Promise.all([
      fetchItems('public_inventory_view').then(res => {
        if (res.error) return fetchItems('inventory_items');
        return res;
      }),
      fetchServices()
    ]).then(([prodRes, svcRes]) => {
      const prods = (prodRes.data || []) as InventoryItem[];
      const svcs = (svcRes.data || []).map(s => ({
        id: s.id,
        name: s.name,
        barcode: `SVC-${s.id.slice(0, 8).toUpperCase()}`,
        brand: null,
        model: null,
        quantity: 9999, // Unlimited stock for services
        selling_price_usd: s.price_usd || 0,
        category: 'SERVICES',
        image_url: s.image_url || null,
        created_at: s.created_at || new Date().toISOString(),
        isService: true,
        expected_duration_minutes: s.expected_duration_minutes,
        is_category_affected: s.is_category_affected !== false,
        silver_discount_percent: s.silver_discount_percent,
        gold_discount_percent: s.gold_discount_percent,
        platinum_discount_percent: s.platinum_discount_percent
      })) as InventoryItem[];

      setItems([...prods, ...svcs]);
      setLoading(false);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Category match: checks DB category column, falls back to name keywords
  const matchesCategory = (item: InventoryItem, catVal: string): boolean => {
    if (catVal === 'SERVICES') return !!item.isService;
    if (item.isService) return catVal === 'ALL';

    if (catVal === 'ALL') return true;
    const cat = (item.category || '').trim();
    const name = (item.name || '').trim();

    const match = (val: string, kws: string[]): boolean => {
      const lower = val.toLowerCase();
      return kws.some(kw => lower.includes(kw.toLowerCase()));
    };

    const isSpareParts = () => {
      if (match(cat, ['قطع غيار', 'spare_parts', 'spare parts', 'spare-parts', 'parts', 'part'])) return true;
      if (!cat) {
        return match(name, ['قطع', 'فلتر', 'filter', 'بواجي', 'تيل', 'فحمات', 'دوزان', 'سير', 'قشاط', 'مساعد', 'مساعدات', 'صدمات', 'مساعدين', 'كولي', 'كوليه', 'طرمبة', 'مضخة']);
      }
      return false;
    };

    const isOils = () => {
      if (match(cat, ['زيوت وسوائل', 'زيوت', 'سائل', 'زيت', 'oil', 'fluids', 'fluid', 'lubricant'])) return true;
      if (!cat) {
        return match(name, ['زيت', 'سائل', 'oil', 'fluid', 'شحم', 'grease', 'مانع تجمد']);
      }
      return false;
    };

    const isAccessories = () => {
      if (match(cat, ['اكسسوارات', 'إكسسوارات', 'اكسسوار', 'إكسسوار', 'accessory', 'accessories'])) return true;
      if (!cat) {
        return match(name, ['اكسسوار', 'إكسسوار', 'مساحات', 'مساحة', 'شاحن', 'حامل', 'عطر', 'معطر', 'فرش', 'غطاء', 'لد', 'اضاءة', 'إنارة', 'ميدالية']);
      }
      return false;
    };



    const isTiresOnly = () => {
      if (match(cat, ['إطارات', 'إطار', 'tire', 'tires'])) return true;
      if (!cat) return match(name, ['إطار', 'اطار', 'دولاب', 'عجل', 'تير', 'tire', 'wheel']) && !match(name, ['battery','بطارية','بطاريه']);
      return false;
    };
    const isBatteries = () => {
      if (match(cat, ['بطاريات', 'بطارية', 'battery', 'batteries'])) return true;
      if (!cat) return match(name, ['بطارية', 'بطاريه', 'battery']);
      return false;
    };

    if (catVal === 'SPARE_PARTS') return isSpareParts();
    if (catVal === 'OILS') return isOils();
    if (catVal === 'TIRES') return isTiresOnly();
    if (catVal === 'BATTERIES') return isBatteries();
    if (catVal === 'ACCESSORIES') return isAccessories();

    if (catVal === 'OTHER') {
      return !isSpareParts() && !isOils() && !isTiresOnly() && !isBatteries() && !isAccessories();
    }

    return false;
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.barcode.toLowerCase().includes(search.toLowerCase());
      const matchCategory = matchesCategory(item, selectedCategory);
      return matchSearch && matchCategory;
    });
  }, [items, search, selectedCategory]);

  const actionsJSX = selectedItem ? (
    <div className="modal-left-actions">
      {/* Row 1: Cart button (Full-width, shrinks to fit stepper if selected) */}
      <div className="modal-cart-row">
        {!selectedItem.isService ? (
          <>
            <button 
              className={`modal-cart-btn-full ${(cart[selectedItem.id]||0)>0 ? 'in-cart' : ''}`}
              onClick={() => handleToggleCart(selectedItem.id)}
              title={(cart[selectedItem.id]||0)>0 ? (lang === 'ar' ? 'مضاف للسلة' : 'In Cart') : (lang === 'ar' ? 'إضافة للسلة' : 'Add to Cart')}
            >
              <ShoppingCart size={20} />
            </button>
            
            {(cart[selectedItem.id]||0) > 0 && (
              <div className="qty-stepper compact-stepper" style={{ direction: 'ltr' }}>
                <button 
                  className="qty-btn" 
                  onClick={() => handleChangeQty(selectedItem.id, -1)}
                >
                  ▼
                </button>
                <span className="qty-val">{cart[selectedItem.id]}</span>
                <button 
                  className="qty-btn" 
                  onClick={() => handleChangeQty(selectedItem.id, 1)}
                >
                  ▲
                </button>
              </div>
            )}
          </>
        ) : (
          <button 
            className={`modal-cart-btn-full ${(cart[selectedItem.id]||0)>0 ? 'in-cart' : ''}`}
            onClick={() => handleToggleCart(selectedItem.id)}
            title={(cart[selectedItem.id]||0)>0 ? (lang === 'ar' ? 'مضاف للسلة' : 'In Cart') : (lang === 'ar' ? 'إضافة للسلة' : 'Add to Cart')}
            style={{ width: '100%' }}
          >
            <ShoppingCart size={20} />
          </button>
        )}
      </div>

      {/* Row 2: WhatsApp, Call, Wishlist as icon-only buttons below Cart */}
      <div className="modal-secondary-actions-row">
        <a
          href={`https://wa.me/963992162351?text=${encodeURIComponent(
            selectedItem.isService
              ? (lang === 'ar'
                  ? `مرحباً كويك أوتو، أود الاستفسار عن/طلب خدمة: ${selectedItem.name} بكود: ${selectedItem.barcode}`
                  : `Hello QUICK AUTO, I'd like to ask about/book service: ${selectedItem.name} with code: ${selectedItem.barcode}`)
              : (lang === 'ar'
                  ? `مرحباً كويك أوتو، أود الاستفسار عن/طلب قطعة: ${selectedItem.name} (${selectedItem.brand || ''} ${selectedItem.model || ''}) بكود OEM: ${selectedItem.barcode}`
                  : `Hello QUICK AUTO, I'd like to ask about/order part: ${selectedItem.name} (${selectedItem.brand || ''} ${selectedItem.model || ''}) with OEM code: ${selectedItem.barcode}`)
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="modal-icon-only-btn wa-icon-btn"
          title={t.orderWhatsApp}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>

        <a
          href="tel:+963992162351"
          className="modal-icon-only-btn call-icon-btn"
          title={lang === 'ar' ? 'اتصال مباشر' : 'Call Direct'}
        >
          <Phone size={22} />
        </a>

        <button 
          className={`modal-icon-only-btn wishlist-icon-btn ${wishlist.includes(selectedItem.id) ? 'active' : ''}`}
          onClick={() => handleToggleWishlist(selectedItem.id)}
          title={wishlist.includes(selectedItem.id) ? (lang === 'ar' ? 'في المفضلة' : 'In Wishlist') : (lang === 'ar' ? 'إضافة للمفضلة' : 'Add to Wishlist')}
        >
          <Heart size={22} fill={wishlist.includes(selectedItem.id) ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="app-container" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Pull to refresh visual indicator */}
      {pullOffset > 10 && (
        <div 
          className="pull-to-refresh-indicator" 
          style={{ 
            transform: `translateY(${Math.min(pullOffset - 40, 50)}px) translateX(-50%)`,
            opacity: Math.min(pullOffset / 75, 1)
          }}
        >
          <div className={`ptr-icon-arrow ${pullOffset > 55 ? 'rotate' : ''}`}>
            ↓
          </div>
        </div>
      )}

      <header className="navbar">
        <div className="brand-and-search">
          <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={handleLogoClick}>
            <span className="brand-quick">QUICK</span>
            <span className="brand-space"> </span>
            <span className="brand-auto">AUTO</span>
          </div>
          
          <div className="header-search-box">
            <Search className="header-search-icon" size={16} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                if (val.trim() && viewMode === 'categories') {
                  navigateToCategory('ALL');
                }
              }}
              className="header-search-input"
            />
          </div>
        </div>

        <div className="header-center-title">
          {viewMode === 'categories' && (
            <h2>{lang === 'ar' ? 'تصفح أقسام الكاتالوج' : 'Browse Catalog Categories'}</h2>
          )}
        </div>
        

        <div className="navbar-actions">
          {/* Exchange Rate Badge - hidden on mobile, shown in row 3 */}
          <div className="rate-badge rate-badge-desktop">
            <span className="rate-indicator"></span>
            <span className="rate-label">{t.exchangeRateText}</span>
            <span className="rate-value">
              {exchangeRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t.currencySYP} / $
            </span>
          </div>

          {/* User Auth Profile / Login Button */}
          {currentUser ? (
            <button 
              className="icon-nav-btn user-profile-btn"
              onClick={() => setAuthModal('profile')}
              title={lang === 'ar' ? 'الملف الشخصي' : 'Profile'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '12px', background: 'rgba(255,200,61,0.15)', border: '1px solid rgba(255,200,61,0.3)', color: '#fff', cursor: 'pointer', height: '40px' }}
            >
              <User size={18} style={{ color: 'var(--brand-yellow)' }} />
              <span className="user-name-label" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button 
              className="icon-nav-btn login-nav-btn"
              onClick={() => { resetAuthForm(); setAuthModal('login'); }}
              title={lang === 'ar' ? 'تسجيل الدخول / تسجيل جديد' : 'Log in / Sign up'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '12px', background: 'var(--brand-yellow)', color: '#0d1426', fontWeight: 'bold', cursor: 'pointer', border: 'none', height: '40px' }}
            >
              <LogIn size={16} />
              <span className="login-btn-label" style={{ fontSize: '0.8rem' }}>
                {lang === 'ar' ? 'تسجيل الدخول' : 'Log In'}
              </span>
            </button>
          )}

          {/* Cart Button */}
          <button 
            className={`icon-nav-btn ${activeList === 'cart' ? 'active' : ''}`} 
            onClick={() => activeList === 'cart' ? closeDrawer() : openDrawer('cart')}
            title={lang === 'ar' ? 'السلة' : 'Cart'}
          >
            <ShoppingCart size={18} />
            {Object.keys(cart).length > 0 && <span className="nav-btn-badge">{Object.keys(cart).length}</span>}
          </button>

          {/* Wishlist Button */}
          <button 
            className={`icon-nav-btn ${activeList === 'wishlist' ? 'active' : ''}`} 
            onClick={() => activeList === 'wishlist' ? closeDrawer() : openDrawer('wishlist')}
            title={lang === 'ar' ? 'المفضلة' : 'Wishlist'}
          >
            <Heart size={18} />
            {wishlist.length > 0 && <span className="nav-btn-badge">{wishlist.length}</span>}
          </button>

          {/* Language Toggle */}
          <button className="icon-nav-btn lang-btn" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} title={lang === 'ar' ? 'English' : 'العربية'}>
            <Globe size={18} />
          </button>
        </div>

        {/* Mobile-only rate badge row */}
        <div className="rate-badge rate-badge-mobile">
          <span className="rate-indicator"></span>
          <span className="rate-label">{lang === 'ar' ? 'سعر الصرف المعتمد' : 'Exchange Rate'}</span>
          <span className="rate-value">
            {exchangeRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t.currencySYP} / $
          </span>
        </div>

      </header>

      {/* Main Section */}
      <main className={`catalog-wrapper ${viewMode === 'categories' ? 'catalog-categories-mode' : ''}`}>
        {viewMode === 'categories' ? (
          <div className="categories-landing-container">
            <div className="categories-grid">
              {CATEGORIES[lang].map((cat) => {
                const catCount = items.filter(item => matchesCategory(item, cat.val)).length;
                const details = getCategoryDetails(cat.val, lang);
                return (
                  <div key={cat.val} className="category-card-wrapper">
                    <div 
                      className={`category-large-card${['OILS','TIRES','BATTERIES','SERVICES','OTHER'].includes(cat.val) ? ' card-light-bg' : ''}`}
                      onClick={() => navigateToCategory(cat.val)}>
                      
                      <div className="category-card-bg" style={{ backgroundImage: `url(${details.img})` }} />
                      <div className="category-large-card-overlay" />
                      
                      <div className="category-large-card-content">
                        <h3>
                          {cat.label} 
                          <span className="cat-card-count" style={{ display: 'inline-block', marginInlineStart: '8px' }}>
                            ({catCount})
                          </span>
                        </h3>
                        <p className="cat-card-desc">{lang === 'ar' ? details.descAr : details.descEn}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="items-view-header">
              <button onClick={navigateToCategories} className="back-to-cats-btn">
                {lang === 'ar' ? '← الرجوع للأقسام' : '← Back to Categories'}
              </button>
              <div className="items-view-breadcrumb">
                <span className="breadcrumb-active">{CATEGORIES[lang].find(c => c.val === selectedCategory)?.label || (lang === 'ar' ? 'الكل' : 'All')}</span>
                {search && <span className="breadcrumb-search"> · "{search}"</span>}
              </div>
            </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="state-container">
            <div className="spinner"></div>
            <p className="state-text">{t.loading}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="state-container error-state">
            <AlertCircle size={48} className="error-icon" />
            <p className="state-text">{t.noResults}</p>
          </div>
        ) : (
          <div className="catalog-grid">
            {filteredItems.map((item) => {
              const inStock = item.quantity > 0;
              const isLowStock = item.quantity > 0 && item.quantity <= 3;
              const priceSyp = Math.ceil(item.selling_price_usd * exchangeRate / 5) * 5;

              // Generate WhatsApp Link
              const waText = encodeURIComponent(
                item.isService
                  ? (lang === 'ar'
                      ? `مرحباً كويك أوتو، أود حجز خدمة: ${item.name} بكود: ${item.barcode}`
                      : `Hello QUICK AUTO, I'd like to book service: ${item.name} with code: ${item.barcode}`)
                  : (lang === 'ar'
                      ? `مرحباً كويك أوتو، أود الاستفسار عن/طلب قطعة: ${item.name} (${item.brand || ''} ${item.model || ''}) بكود OEM: ${item.barcode}`
                      : `Hello QUICK AUTO, I'd like to ask about/order part: ${item.name} (${item.brand || ''} ${item.model || ''}) with OEM code: ${item.barcode}`)
              );
              const waUrl = `https://wa.me/963992162351?text=${waText}`;

              return (
                <div 
                  key={item.id} 
                  className="part-card"
                  onClick={() => openItemDetails(item)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Item Image at the top with quantity badge & wishlist heart button */}
                  <div className="part-card-image-wrapper">
                    <img 
                      src={(item as any).image_url || getCategoryImageUrl(item.category, item.name)} 
                      alt={item.name} 
                      className="part-card-image"
                      loading="lazy"
                    />
                    {!item.isService && (
                      <span className={`image-qty-badge ${!inStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                        {item.quantity}
                      </span>
                    )}
                    <button 
                      className={`image-wishlist-btn ${wishlist.includes(item.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleToggleWishlist(item.id); }}
                      title={wishlist.includes(item.id) ? (lang === 'ar' ? 'إزالة من المفضلة' : 'Remove from wishlist') : (lang === 'ar' ? 'إضافة إلى المفضلة' : 'Add to wishlist')}
                    >
                      <Heart size={16} fill={wishlist.includes(item.id) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {/* S1: Name and Model (replacing Barcode) */}
                  <div className="card-row-1">
                    <h3 className="part-name-new" title={item.name}>{item.name}</h3>
                    <span className="model-badge-new" title={item.isService ? (lang === 'ar' ? 'خدمة فنية' : 'Service') : (item.model || '')}>
                      {item.isService ? (lang === 'ar' ? 'خدمة' : 'Service') : (item.model || '—')}
                    </span>
                  </div>

                  {/* S3: Prices USD & SYP side-by-side */}
                  <div className="card-row-3">
                    <div className="price-usd-new">
                      <span>$</span>
                      <span>{item.selling_price_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="price-syp-new">
                      <span>{priceSyp.toLocaleString()}</span>
                      <span className="syp-unit-new"> {t.currencySYP}</span>
                    </div>
                  </div>

                  {/* S4: Cart qty badge + WhatsApp + Call */}
                  <div className="card-row-4">
                    <button 
                      className={`card-cart-btn ${(cart[item.id]||0)>0 ? 'in-cart' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleToggleCart(item.id); }}
                      title={(cart[item.id]||0)>0 ? (lang === 'ar' ? 'إزالة من السلة' : 'Remove from cart') : (lang === 'ar' ? 'إضافة إلى السلة' : 'Add to cart')}
                    >
                      <ShoppingCart size={17} />
                      {(cart[item.id]||0)>0 && <span className="card-cart-qty">{cart[item.id]}</span>}
                    </button>

                    <a 
                      href={waUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="wa-order-btn-new wa-icon-only"
                      onClick={(e) => e.stopPropagation()}
                      title={t.orderWhatsApp}
                    >
                      {/* WhatsApp official logo */}
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                    
                    <a 
                      href="tel:+963992162351" 
                      className="call-btn-new"
                      title={lang === 'ar' ? 'اتصال مباشر' : 'Call Direct'}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone size={17} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </main>

      {/* Sticky Bottom Contact Panel */}
      <footer className={`footer ${viewMode === 'categories' ? 'footer-categories-mode' : ''}`}>
        <div className="footer-content-row">
          <div className="info-item">
            <MapPin size={14} className="footer-icon" />
            <a 
              href="https://maps.google.com/?q=32.6256,36.1054" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link"
            >
              {t.address}
            </a>
          </div>
          <span className="footer-separator">|</span>
          <div className="info-item">
            <Phone size={14} className="footer-icon" />
            <a href="tel:+963992162351" className="footer-link" dir="ltr">+963 992 162 351</a>
          </div>
          {isNativeApp && (
            <>
              <span className="footer-separator">|</span>
              <div className="info-item">
                <button 
                  onClick={() => {
                    const token = localStorage.getItem('fcm_token') || 'No token registered yet';
                    setFcmToken(token);
                    setShowDevModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-yellow)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '800',
                    textDecoration: 'underline'
                  }}
                >
                  🔔 {lang === 'ar' ? 'رمز الإشعارات (FCM)' : 'FCM Token'}
                </button>
              </div>
            </>
          )}
          <span className="footer-separator">|</span>
          <p className="copyright">© {new Date().getFullYear()} QUICK AUTO. {t.allRightsReserved}</p>
        </div>
      </footer>

      {/* Side Drawer for Cart / Wishlist - always on the right */}
      {activeList && (
        <div className="drawer-overlay" onClick={closeDrawer}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>
                {activeList === 'cart' 
                  ? (lang === 'ar' ? 'سلة المشتريات' : 'Shopping Cart')
                  : (lang === 'ar' ? 'المفضلة' : 'My Wishlist')}
              </h3>
              <button className="drawer-close-btn" onClick={closeDrawer}>×</button>
            </div>
            
            <div className="drawer-body">
              {activeList === 'cart' ? (
                cartItems.length === 0 ? (
                  <div className="drawer-empty">
                    <ShoppingCart size={48} className="empty-icon" />
                    <p>{lang === 'ar' ? 'السلة فارغة حالياً' : 'Your cart is empty'}</p>
                  </div>
                ) : (
                  <div className="drawer-items-list">
                    {cartItems.map(item => {
                      const qty = cart[item.id] || 1;
                      const priceSyp = Math.ceil(item.selling_price_usd * exchangeRate / 5) * 5;
                      return (
                        <div key={item.id} className="drawer-item">
                          <img 
                            src={(item as any).image_url || getCategoryImageUrl(item.category, item.name)} 
                            alt={item.name} 
                            className="drawer-item-img"
                          />
                          <div className="drawer-item-info">
                            <h4>{item.name}</h4>
                            <p>{item.model || '—'}</p>
                            <span className="drawer-item-price">
                              ${item.selling_price_usd} × {qty} = ${(item.selling_price_usd * qty).toLocaleString('en-US',{minimumFractionDigits:2})}
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--brand-yellow)', marginTop: '2px' }}>
                                ≈ {((priceSyp * qty)).toLocaleString()} {t.currencySYP}
                              </span>
                            </span>
                          </div>
                          <div className="drawer-item-actions">
                            <div className="qty-stepper" style={{ direction: 'ltr' }}>
                              <button className="qty-btn" onClick={() => handleChangeQty(item.id, -1)}>▼</button>
                              <span className="qty-val">{qty}</span>
                              <button className="qty-btn" onClick={() => handleChangeQty(item.id, 1)}>▲</button>
                            </div>
                            <button 
                              className="drawer-remove-btn" 
                              onClick={() => handleToggleCart(item.id)}
                              title={lang === 'ar' ? 'إزالة' : 'Remove'}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                wishlistItems.length === 0 ? (
                  <div className="drawer-empty">
                    <Heart size={48} className="empty-icon" />
                    <p>{lang === 'ar' ? 'المفضلة فارغة حالياً' : 'Your wishlist is empty'}</p>
                  </div>
                ) : (
                  <div className="drawer-items-list">
                    {wishlistItems.map(item => {
                      const priceSyp = Math.ceil(item.selling_price_usd * exchangeRate / 5) * 5;
                      return (
                        <div key={item.id} className="drawer-item">
                          <img 
                            src={(item as any).image_url || getCategoryImageUrl(item.category, item.name)} 
                            alt={item.name} 
                            className="drawer-item-img"
                          />
                          <div className="drawer-item-info">
                            <h4>{item.name}</h4>
                            <p>{item.model || '—'}</p>
                            <span className="drawer-item-price">${item.selling_price_usd} / {priceSyp.toLocaleString()} {t.currencySYP}</span>
                          </div>
                          <div className="drawer-item-actions">
                            <button 
                              className="drawer-item-cart-btn"
                              onClick={() => {
                                handleToggleCart(item.id);
                                handleToggleWishlist(item.id); // move to cart
                              }}
                              title={lang === 'ar' ? 'نقل إلى السلة' : 'Move to Cart'}
                            >
                              <ShoppingCart size={14} />
                            </button>
                            <button 
                              className="drawer-remove-btn" 
                              onClick={() => handleToggleWishlist(item.id)}
                              title={lang === 'ar' ? 'إزالة' : 'Remove'}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {activeList === 'cart' && cartItems.length > 0 && (
              <div className="drawer-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="drawer-total">
                  <span>{lang === 'ar' ? 'المجموع:' : 'Total:'}</span>
                  <span className="total-price">
                    ${cartItems.reduce((acc, item) => acc + item.selling_price_usd * (cart[item.id] || 1), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {/* WhatsApp Order Option */}
                <a 
                  href={`https://wa.me/963992162351?text=${encodeURIComponent(
                    lang === 'ar'
                      ? `مرحباً كويك أوتو، أود طلب المواد التالية:\n${cartItems.map((item, idx) => `${idx + 1}. ${item.name} (كمية: ${cart[item.id]||1}) OEM: ${item.barcode}`).join('\n')}`
                      : `Hello QUICK AUTO, I'd like to order:\n${cartItems.map((item, idx) => `${idx + 1}. ${item.name} (Qty: ${cart[item.id]||1}) OEM: ${item.barcode}`).join('\n')}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="drawer-checkout-btn"
                  style={{ background: '#25D366', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span>{lang === 'ar' ? 'طلب المواد عبر واتساب' : 'Order Items via WhatsApp'}</span>
                </a>

                {/* Online Pay Option */}
                <button
                  onClick={handleStartCheckout}
                  className="drawer-checkout-btn online-pay-btn"
                  style={{ background: 'var(--brand-yellow)', color: '#0d1426', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', outline: 'none' }}
                >
                  <CreditCard size={16} />
                  <span>{lang === 'ar' ? 'شراء ودفع أونلاين' : 'Buy & Pay Online'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Zoom Overlay */}
      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={closeZoomedImage}>
          <img src={zoomedImage} alt="zoom" className="image-zoom-img" />
          <button className="image-zoom-close" onClick={closeZoomedImage}>×</button>
        </div>
      )}

      {/* Details Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={closeItemDetails}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <button className="modal-close-btn" onClick={closeItemDetails} title={lang === 'ar' ? 'رجوع' : 'Back'}>
                <ArrowLeft size={20} />
              </button>
              <span className="modal-header-title">{selectedItem.name}</span>
            </div>
            
            <div className="modal-grid">
              {/* Left Column: Image (and Actions if Service) */}
              <div className="modal-left-column">
                <div className="modal-image-wrapper" style={!selectedItem.isService ? { flex: 1, height: '100%' } : {}}>
                  <img 
                    src={(selectedItem as any).image_url || getCategoryImageUrl(selectedItem.category, selectedItem.name)} 
                    alt={selectedItem.name} 
                    className="modal-image modal-image-zoomable"
                    onClick={(e) => { e.stopPropagation(); openZoomedImage((selectedItem as any).image_url || getCategoryImageUrl(selectedItem.category, selectedItem.name)); }}
                  />
                  {selectedItem.isService ? (
                    <span className="modal-qty-badge service-badge-top">
                      {lang === 'ar' ? 'حجز فوري متاح' : 'Instant Booking Available'}
                    </span>
                  ) : (
                    <span className="modal-qty-badge">
                      {lang === 'ar' ? `المتوفر: ${selectedItem.quantity} قطعة` : `Available: ${selectedItem.quantity} pcs`}
                    </span>
                  )}
                  {!selectedItem.isService && (
                    <span className="modal-image-hint">{lang === 'ar' ? '👆 اضغط لتكبير الصورة' : '👆 Tap to zoom'}</span>
                  )}
                </div>

                {selectedItem.isService && actionsJSX}
              </div>

              {/* Right Column: Info & Details, Pricing, Actions (if Part) */}
              <div className="modal-right-column">
                {/* Right Top half: General Info */}
                <div className="modal-right-top">
                  <h2 className="modal-title">{selectedItem.name}</h2>
                  
                  {selectedItem.isService ? (
                    <div className="modal-details-list">
                      <div className="modal-detail-item">
                        <span className="detail-label">{lang === 'ar' ? 'كود الخدمة:' : 'Service Code:'}</span>
                        <span className="detail-value">{selectedItem.barcode}</span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="detail-label">{lang === 'ar' ? 'القسم:' : 'Category:'}</span>
                        <span className="detail-value">{selectedItem.category || '—'}</span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="detail-label">{lang === 'ar' ? 'تسعير الخدمة:' : 'Pricing Mode:'}</span>
                        <span className="detail-value">
                          {selectedItem.is_category_affected 
                            ? (lang === 'ar' ? 'يتغير حسب فئة السيارة' : 'Varies by car class')
                            : (lang === 'ar' ? 'سعر ثابت لجميع الفئات' : 'Fixed price')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="modal-details-list">
                      <div className="modal-detail-item">
                        <span className="detail-label">{lang === 'ar' ? 'الماركة:' : 'Brand:'}</span>
                        <span className="detail-value">{selectedItem.brand || '—'}</span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="detail-label">{lang === 'ar' ? 'الموديل المتوافق:' : 'Compatible Model:'}</span>
                        <span className="detail-value">{selectedItem.model || '—'}</span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="detail-label">{lang === 'ar' ? 'كود القطعة (OEM):' : 'Part Code (OEM):'}</span>
                        <span className="detail-value">{selectedItem.barcode}</span>
                      </div>
                      <div className="modal-detail-item">
                        <span className="detail-label">{lang === 'ar' ? 'القسم:' : 'Category:'}</span>
                        <span className="detail-value">{selectedItem.category || '—'}</span>
                      </div>
                    </div>
                  )}

                  {/* Standard / Fixed Price displays here ONLY for services with fixed price */}
                  {(selectedItem.isService && !selectedItem.is_category_affected) && (
                    <div className="modal-single-price-block">
                      <div className="modal-price-label">{lang === 'ar' ? 'السعر الثابت:' : 'Fixed Price:'}</div>
                      <div className="modal-prices" style={{ margin: 0, border: 'none', paddingTop: 0 }}>
                        <div className="modal-price-usd">
                          <span className="price-num">${selectedItem.selling_price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="modal-price-syp">
                          <span className="price-num">{(Math.ceil(selectedItem.selling_price_usd * exchangeRate / 5) * 5).toLocaleString()}</span>
                          <span className="price-unit"> {t.currencySYP}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Bottom half: Pricing Matrix / Discount Matrix */}
                <div className="modal-right-bottom">
                  {selectedItem.isService && (
                    <div className="service-details-container" style={{ margin: 0 }}>
                      
                      {/* Show category pricing matrix ONLY if it varies by car category */}
                      {selectedItem.is_category_affected && (
                        <div className="service-section">
                          <h4 className="section-title">{lang === 'ar' ? '💰 تكلفة الخدمة حسب فئة السيارة:' : '💰 Service Cost by Vehicle Class:'}</h4>
                          <div className="price-matrix-grid">
                            {[
                              { key: 'economy', labelAr: 'اقتصادية (Economy)', labelEn: 'Economy', factor: 1.0 },
                              { key: 'mid-range', labelAr: 'متوسطة (Mid-range)', labelEn: 'Mid-range', factor: 1.5 },
                              { key: 'luxury', labelAr: 'فاخرة (Luxury)', labelEn: 'Luxury', factor: 2.0 },
                              { key: 'sport', labelAr: 'رياضية (Sport)', labelEn: 'Sport', factor: 2.5 }
                            ].map(tier => {
                              const basePrice = selectedItem.selling_price_usd;
                              const tierUsd = basePrice * tier.factor;
                              const tierSyp = Math.ceil(tierUsd * exchangeRate / 5) * 5;
                              return (
                                <div key={tier.key} className="matrix-row">
                                  <span className="matrix-class-label">{lang === 'ar' ? tier.labelAr : tier.labelEn}</span>
                                  <div className="matrix-class-price">
                                    <span className="m-usd">${tierUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    <span className="m-divider">|</span>
                                    <span className="m-syp">{tierSyp.toLocaleString()} {t.currencySYP}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Always show Membership discounts table for services */}
                      <div className="service-section">
                        <h4 className="section-title">{lang === 'ar' ? '💎 نسبة الخصومات لأصحاب العضوية المعتمدة:' : '💎 Membership Tier Discounts:'}</h4>
                        <div className="discount-matrix-grid">
                          {[
                            { tier: 'silver', labelAr: 'العضوية الفضية', labelEn: 'Silver Member', pct: selectedItem.silver_discount_percent ?? 10, color: '#aaa' },
                            { tier: 'gold', labelAr: 'العضوية الذهبية', labelEn: 'Gold Member', pct: selectedItem.gold_discount_percent ?? 15, color: 'var(--brand-yellow)' },
                            { tier: 'platinum', labelAr: 'العضوية البلاتينية', labelEn: 'Platinum Member', pct: selectedItem.platinum_discount_percent ?? 20, color: '#e74c3c' }
                          ].map(m => {
                            return (
                              <div key={m.tier} className="matrix-row discount-row">
                                <div className="matrix-member-label">
                                  <span className="member-dot" style={{ backgroundColor: m.color }} />
                                  <span>{lang === 'ar' ? m.labelAr : m.labelEn}</span>
                                </div>
                                <div className="matrix-member-discount">
                                  <span className="m-pct">%{m.pct}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* For products, show standard price block here in the bottom half */}
                  {!selectedItem.isService && (
                    <div className="modal-product-price-block" style={{ marginTop: 0 }}>
                      <div className="price-row-item">
                        <div className="modal-price-label">{lang === 'ar' ? 'سعر القطعة:' : 'Price per Unit:'}</div>
                        <div className="modal-prices" style={{ margin: 0, border: 'none', paddingTop: 0 }}>
                          <div className="modal-price-usd">
                            <span className="price-num">${selectedItem.selling_price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="modal-price-syp">
                            <span className="price-num">{(Math.ceil(selectedItem.selling_price_usd * exchangeRate / 5) * 5).toLocaleString()}</span>
                            <span className="price-unit"> {t.currencySYP}</span>
                          </div>
                        </div>
                      </div>

                      {((cart[selectedItem.id] || 0) > 0) && (
                        <div className="price-row-item total-price-row" style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed var(--border-color)' }}>
                          <div className="modal-price-label">
                            {lang === 'ar' ? `السعر الإجمالي (${cart[selectedItem.id]} قطع):` : `Total Price (${cart[selectedItem.id]} units):`}
                          </div>
                          <div className="modal-prices" style={{ margin: 0, border: 'none', paddingTop: 0 }}>
                            <div className="modal-price-usd">
                              <span className="price-num" style={{ color: '#fff' }}>
                                ${(selectedItem.selling_price_usd * cart[selectedItem.id]).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="modal-price-syp">
                              <span className="price-num" style={{ color: 'var(--brand-yellow)' }}>
                                {(Math.ceil((selectedItem.selling_price_usd * cart[selectedItem.id]) * exchangeRate / 5) * 5).toLocaleString()}
                              </span>
                              <span className="price-unit" style={{ color: 'var(--brand-yellow)' }}> {t.currencySYP}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* For products, show the actions row at the bottom of the right column on desktop */}
                {!selectedItem.isService && (
                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', background: 'rgba(4, 6, 13, 0.2)' }}>
                    {actionsJSX}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="pwa-install-banner animate-slide-up">
          <div className="pwa-install-content">
            <button className="pwa-close-btn" onClick={handleDismissInstall} aria-label="Close">
              ✕
            </button>
            <div className="pwa-app-info">
              <img src="/favicon.png" alt="Quick Auto" className="pwa-app-logo" />
              <div className="pwa-app-details">
                <h4 className="pwa-app-title">
                  {lang === 'ar' ? 'تطبيق كويك أوتو' : 'Quick Auto App'}
                </h4>
                <p className="pwa-app-desc">
                  {lang === 'ar' 
                    ? 'ثبت التطبيق على شاشتك لتجربة أسرع وسهلة بدون إنترنت!' 
                    : 'Install the app on your home screen for a faster offline experience!'}
                </p>
              </div>
            </div>
            <div className="pwa-action-block">
              {isIOS ? (
                <div className="pwa-ios-instructions">
                  {lang === 'ar' ? (
                    <span>
                      اضغط على زر المشاركة <span className="share-icon-placeholder">⎋</span> ثم اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong>
                    </span>
                  ) : (
                    <span>
                      Tap share <span className="share-icon-placeholder">⎋</span> then select <strong>"Add to Home Screen"</strong>
                    </span>
                  )}
                </div>
              ) : (
                <button className="pwa-install-btn" onClick={handleInstallClick}>
                  {lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Dev options Modal */}
      {showDevModal && (
        <div className="modal-overlay" style={{ zIndex: 20000 }} onClick={() => setShowDevModal(false)}>
          <div className="modal-content animate-zoom-in" style={{ maxWidth: '400px', background: '#0d1426', border: '1px solid rgba(255, 200, 61, 0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <span className="modal-header-title" style={{ fontSize: '1rem', fontWeight: 800 }}>Developer Options</span>
              <button className="modal-close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setShowDevModal(false)}>✕</button>
            </div>
            <div style={{ padding: '0.5rem', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--brand-yellow)', marginBottom: '0.5rem', fontSize: '1rem' }}>FCM Device Token</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                Use this token in Firebase Console to send a test push notification to this device.
              </p>
              <textarea 
                readOnly 
                value={fcmToken} 
                style={{ 
                  width: '100%', 
                  height: '110px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  color: '#fff', 
                  padding: '0.6rem', 
                  fontFamily: 'monospace', 
                  fontSize: '0.7rem',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  wordBreak: 'break-all'
                }} 
              />
              <button 
                className="modal-cart-btn-full" 
                style={{ marginTop: '1.2rem', background: 'var(--brand-yellow)', color: '#0d1426', border: 'none', borderRadius: '8px', padding: '0.75rem', width: '100%', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => {
                  navigator.clipboard.writeText(fcmToken);
                  alert('Token copied to clipboard!');
                }}
              >
                Copy Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modals (Login & Sign Up) */}
      {authModal && authModal !== 'profile' && (
        <div className="modal-overlay" style={{ zIndex: 20000 }} onClick={() => setAuthModal(null)}>
          <div className="modal-content animate-zoom-in" style={{ maxWidth: '450px', background: '#090e1a', border: '1px solid rgba(255, 200, 61, 0.25)', padding: '2rem', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--brand-yellow)', fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {authModal === 'login' ? <LogIn size={22} /> : <UserPlus size={22} />}
                {authModal === 'login' 
                  ? (lang === 'ar' ? 'تسجيل الدخول للحساب' : 'Account Login') 
                  : (lang === 'ar' ? 'إنشاء حساب جديد أونلاين' : 'Create New Account')}
              </h3>
              <button onClick={() => setAuthModal(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', outline: 'none' }}>&times;</button>
            </div>

            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={authModal === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {authModal === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>{lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: lang === 'ar' ? 'auto' : '12px', right: lang === 'ar' ? '12px' : 'auto', color: '#666' }} />
                    <input 
                      type="text" 
                      required
                      placeholder={lang === 'ar' ? 'أدخل اسمك الثلاثي' : 'Enter your full name'}
                      value={authForm.name}
                      onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 12px', paddingLeft: lang === 'ar' ? '12px' : '36px', paddingRight: lang === 'ar' ? '36px' : '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>{lang === 'ar' ? 'رقم الهاتف (إجباري) *' : 'Phone Number (Mandatory) *'}</label>
                <div style={{ position: 'relative' }}>
                  <Smartphone size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: lang === 'ar' ? 'auto' : '12px', right: lang === 'ar' ? '12px' : 'auto', color: '#666' }} />
                  <input 
                    type="tel" 
                    required
                    placeholder={lang === 'ar' ? 'مثال: 0992162351' : 'e.g. 0992162351'}
                    value={authForm.phone}
                    onChange={e => setAuthForm({ ...authForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 12px', paddingLeft: lang === 'ar' ? '12px' : '36px', paddingRight: lang === 'ar' ? '36px' : '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none', textAlign: 'left', direction: 'ltr' }}
                  />
                </div>
              </div>

              {authModal === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>{lang === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email Address (Optional)'}</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: lang === 'ar' ? 'auto' : '12px', right: lang === 'ar' ? '12px' : 'auto', color: '#666' }} />
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      value={authForm.email}
                      onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 12px', paddingLeft: lang === 'ar' ? '12px' : '36px', paddingRight: lang === 'ar' ? '36px' : '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none', textAlign: 'left', direction: 'ltr' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>{lang === 'ar' ? 'كلمة المرور (إجباري) *' : 'Password (Mandatory) *'}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: lang === 'ar' ? 'auto' : '12px', right: lang === 'ar' ? '12px' : 'auto', color: '#666' }} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 12px', paddingLeft: lang === 'ar' ? '36px' : '36px', paddingRight: lang === 'ar' ? '36px' : '36px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none', textAlign: 'left', direction: 'ltr' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: lang === 'ar' ? 'auto' : '12px', left: lang === 'ar' ? '12px' : 'auto', background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authModal === 'signup' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>{lang === 'ar' ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: lang === 'ar' ? 'auto' : '12px', right: lang === 'ar' ? '12px' : 'auto', color: '#666' }} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        placeholder="••••••••"
                        value={authForm.confirmPassword}
                        onChange={e => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem 12px', paddingLeft: lang === 'ar' ? '36px' : '36px', paddingRight: lang === 'ar' ? '36px' : '36px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none', textAlign: 'left', direction: 'ltr' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold' }}>{lang === 'ar' ? 'الرمز السري PIN (للبصمة والقفل السريع) *' : 'Security PIN (For Lock & Biometrics) *'}</label>
                    <div style={{ position: 'relative' }}>
                      <Key size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: lang === 'ar' ? 'auto' : '12px', right: lang === 'ar' ? '12px' : 'auto', color: '#666' }} />
                      <input 
                        type={showPin ? "text" : "password"} 
                        required
                        maxLength={6}
                        placeholder={lang === 'ar' ? 'أدخل من 4 إلى 6 أرقام' : 'Enter 4 to 6 digits'}
                        value={authForm.pin}
                        onChange={e => setAuthForm({ ...authForm, pin: e.target.value.replace(/\D/g, '') })}
                        style={{ width: '100%', padding: '0.75rem 12px', paddingLeft: lang === 'ar' ? '36px' : '36px', paddingRight: lang === 'ar' ? '36px' : '36px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: lang === 'ar' ? 'auto' : '12px', left: lang === 'ar' ? '12px' : 'auto', background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                disabled={authLoading}
                style={{ width: '100%', background: 'var(--brand-yellow)', color: '#0d1426', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '0.5rem', opacity: authLoading ? 0.7 : 1 }}
              >
                {authLoading ? <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid #0d1426', borderTopColor: 'transparent' }} /> : null}
                {authModal === 'login' 
                  ? (lang === 'ar' ? 'دخول' : 'Log In') 
                  : (lang === 'ar' ? 'إنشاء حساب جديد' : 'Sign Up')}
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: '#aaa' }}>
                {authModal === 'login' ? (
                  <>
                    {lang === 'ar' ? 'ليس لديك حساب؟ ' : 'Don\'t have an account? '}
                    <button 
                      type="button" 
                      onClick={() => { resetAuthForm(); setAuthModal('signup'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-yellow)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: '0' }}
                    >
                      {lang === 'ar' ? 'سجل الآن' : 'Sign up now'}
                    </button>
                  </>
                ) : (
                  <>
                    {lang === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                    <button 
                      type="button" 
                      onClick={() => { resetAuthForm(); setAuthModal('login'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-yellow)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: '0' }}
                    >
                      {lang === 'ar' ? 'سجل دخول' : 'Log in'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile / Logout / Biometrics settings modal */}
      {authModal === 'profile' && currentUser && (
        <div className="modal-overlay" style={{ zIndex: 20000 }} onClick={() => setAuthModal(null)}>
          <div className="modal-content animate-zoom-in" style={{ maxWidth: '400px', background: '#090e1a', border: '1px solid rgba(255, 200, 61, 0.25)', padding: '2rem', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--brand-yellow)', fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={22} />
                {lang === 'ar' ? 'حساب المشتري' : 'Buyer Profile'}
              </h3>
              <button onClick={() => setAuthModal(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', outline: 'none' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,200,61,0.1)', border: '2px solid var(--brand-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-yellow)' }}>
                <UserCheck size={36} />
              </div>
              <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{currentUser.name}</h4>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>{currentUser.phone}</span>
              {currentUser.email && <span style={{ color: '#666', fontSize: '0.8rem' }}>{currentUser.email}</span>}
            </div>

            {/* Profile Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
              {/* Biometrics Toggle Option */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Fingerprint size={20} style={{ color: 'var(--brand-yellow)' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{lang === 'ar' ? 'الدخول بنظام البصمة' : 'Biometric Access'}</div>
                    <div style={{ color: '#666', fontSize: '0.75rem' }}>{lang === 'ar' ? 'تفعيل بصمة الأصبع لتأمين الحساب' : 'Use fingerprint sensor to unlock'}</div>
                  </div>
                </div>
                
                {/* Switch Toggle */}
                <button 
                  onClick={handleToggleBiometrics}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: currentUser.biometricsEnabled ? 'var(--brand-yellow)' : '#222',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.3s'
                  }}
                >
                  <span 
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: currentUser.biometricsEnabled ? '#0d1426' : '#888',
                      position: 'absolute',
                      top: '3px',
                      left: currentUser.biometricsEnabled ? '25px' : '3px',
                      transition: 'left 0.3s'
                    }}
                  />
                </button>
              </div>

              {/* PIN Code Information Option */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Key size={20} style={{ color: 'var(--brand-yellow)' }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{lang === 'ar' ? 'الرمز السري للمحفظة' : 'Security PIN'}</div>
                    <div style={{ color: '#666', fontSize: '0.75rem' }}>{lang === 'ar' ? 'مفعل ومؤمن في هذا الجهاز' : 'Configured and secured'}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--brand-yellow)', fontWeight: 'bold', letterSpacing: '1px' }}>
                  {currentUser.pin.replace(/./g, '•')}
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <LogOut size={16} />
              {lang === 'ar' ? 'تسجيل الخروج من الحساب' : 'Logout from Account'}
            </button>
          </div>
        </div>
      )}

      {/* Lock Screen (PIN Code & Fingerprint unlock dialog) */}
      {isLocked && currentUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, #090e1a 0%, #03050a 100%)',
          zIndex: 50000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          padding: '2rem',
          direction: lang === 'ar' ? 'rtl' : 'ltr'
        }}>
          {/* Logo and Lock icon */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.8rem', fontWeight: 'bold' }}>
              <span className="brand-quick" style={{ color: '#fff' }}>QUICK</span>
              <span className="brand-auto" style={{ color: 'var(--brand-yellow)' }}>AUTO</span>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,200,61,0.05)',
              border: '1px solid rgba(255,200,61,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-yellow)',
              marginTop: '10px'
            }}>
              <Lock size={24} />
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '6px' }}>
            {lang === 'ar' ? 'مرحباً بعودتك، ' : 'Welcome back, '}
            <span style={{ color: 'var(--brand-yellow)' }}>{currentUser.name.split(' ')[0]}</span>
          </h3>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {lang === 'ar' ? 'الرجاء إدخال الرمز السري أو البصمة لإلغاء القفل' : 'Please enter security PIN or use biometrics to unlock'}
          </p>

          {/* Dots Indicator for PIN */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '2.5rem', direction: 'ltr' }}>
            {Array.from({ length: currentUser.pin.length }).map((_, i) => (
              <div 
                key={i} 
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: i < pinInput.length ? 'var(--brand-yellow)' : 'transparent',
                  border: '2px solid rgba(255,200,61,0.4)',
                  boxShadow: i < pinInput.length ? '0 0 10px var(--brand-yellow)' : 'none',
                  transition: 'all 0.15s'
                }}
              />
            ))}
          </div>

          {authError && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>{authError}</p>
          )}

          {/* Premium Custom Keypad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 75px)',
            gap: '15px 20px',
            justifyContent: 'center',
            marginBottom: '2.5rem',
            direction: 'ltr'
          }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button 
                key={num}
                onClick={() => handleUnlockPin(num)}
                style={{
                  width: '75px',
                  height: '75px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#fff',
                  fontSize: '1.6rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
                onMouseDown={e => e.currentTarget.style.background = 'rgba(255,200,61,0.15)'}
                onMouseUp={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                {num}
              </button>
            ))}
            
            {/* Delete button */}
            <button 
              onClick={() => setPinInput(pinInput.slice(0, -1))}
              style={{
                width: '75px',
                height: '75px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                fontSize: '1rem',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {lang === 'ar' ? 'حذف' : 'Delete'}
            </button>

            {/* Zero button */}
            <button 
              onClick={() => handleUnlockPin('0')}
              style={{
                width: '75px',
                height: '75px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#fff',
                fontSize: '1.6rem',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseDown={e => e.currentTarget.style.background = 'rgba(255,200,61,0.15)'}
              onMouseUp={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              0
            </button>

            {/* Biometric trigger button */}
            {currentUser.biometricsEnabled ? (
              <button 
                onClick={handleUnlockFingerprint}
                style={{
                  width: '75px',
                  height: '75px',
                  borderRadius: '50%',
                  background: 'rgba(255,200,61,0.08)',
                  border: '1px solid rgba(255,200,61,0.2)',
                  color: 'var(--brand-yellow)',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Fingerprint size={32} />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      )}

      {/* Checkout Authorization & Payment Success Modal */}
      {checkoutModal && currentUser && (
        <div className="modal-overlay" style={{ zIndex: 30000 }} onClick={() => !checkoutSuccess && setCheckoutModal(false)}>
          <div className="modal-content animate-zoom-in" style={{ maxWidth: '420px', background: '#090e1a', border: '1px solid rgba(255, 200, 61, 0.25)', padding: '2rem', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
            
            {!checkoutSuccess ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--brand-yellow)', fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={22} />
                    {lang === 'ar' ? 'تأكيد عملية الدفع والشراء' : 'Confirm & Authorize Payment'}
                  </h3>
                  <button onClick={() => setCheckoutModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', outline: 'none' }}>&times;</button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#888' }}>
                    <span>{lang === 'ar' ? 'المشتري:' : 'Buyer:'}</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{currentUser.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#888' }}>
                    <span>{lang === 'ar' ? 'طريقة الدفع أونلاين:' : 'Online Payment Mode:'}</span>
                    <span style={{ color: 'var(--brand-yellow)', fontWeight: 'bold' }}>{lang === 'ar' ? 'رصيد المحفظة المعتمدة' : 'Approved Wallet'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    <span style={{ color: '#fff' }}>{lang === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:'}</span>
                    <span style={{ color: 'var(--brand-yellow)' }}>
                      ${cartItems.reduce((acc, item) => acc + item.selling_price_usd * (cart[item.id] || 1), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <p style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                  {lang === 'ar' ? 'الرجاء كتابة رمز الـ PIN أو وضع بصمتك لتأكيد الشراء' : 'Please enter security PIN or use biometrics to authorize transaction'}
                </p>

                {/* PIN Code dots indicator for checkout */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '1.5rem', direction: 'ltr' }}>
                  {Array.from({ length: currentUser.pin.length }).map((_, i) => (
                    <div 
                      key={i} 
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: i < checkoutPin.length ? 'var(--brand-yellow)' : 'transparent',
                        border: '2px solid rgba(255,200,61,0.4)',
                        boxShadow: i < checkoutPin.length ? '0 0 10px var(--brand-yellow)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    />
                  ))}
                </div>

                {/* Custom Small Keypad */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 60px)',
                  gap: '10px 15px',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  direction: 'ltr'
                }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button 
                      key={num}
                      onClick={() => handleCheckoutPinChange(num)}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: '#fff',
                        fontSize: '1.3rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCheckoutPin(checkoutPin.slice(0, -1))}
                    style={{ width: '60px', height: '60px', background: 'transparent', border: 'none', color: '#666', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {lang === 'ar' ? 'حذف' : 'Del'}
                  </button>
                  <button 
                    onClick={() => handleCheckoutPinChange('0')}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}
                  >
                    0
                  </button>
                  {currentUser.biometricsEnabled ? (
                    <button 
                      onClick={handleCheckoutFingerprint}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,200,61,0.1)', border: '1px solid rgba(255,200,61,0.2)', color: 'var(--brand-yellow)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Fingerprint size={24} />
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              </>
            ) : (
              /* Payment Success Screen */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                <CheckCircle2 size={64} style={{ color: '#25D366', marginBottom: '1.2rem' }} />
                <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
                  {lang === 'ar' ? 'تم الدفع والطلب بنجاح!' : 'Payment & Order Successful!'}
                </h3>
                <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {lang === 'ar' 
                    ? 'لقد تم تأكيد دفعتك وتمرير طلبك للمستودع الإلكتروني لخدمتك بأسرع وقت.' 
                    : 'Your payment has been successfully authorized and sent to the smart fulfillment warehouse.'}
                </p>

                <div style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#666' }}>{lang === 'ar' ? 'رقم العملية:' : 'Transaction ID:'}</span>
                    <span style={{ color: '#fff', fontFamily: 'monospace' }}>TXN-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#666' }}>{lang === 'ar' ? 'تاريخ العملية:' : 'Transaction Date:'}</span>
                    <span style={{ color: '#fff' }}>{new Date().toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>{lang === 'ar' ? 'الحالة:' : 'Status:'}</span>
                    <span style={{ color: '#25D366', fontWeight: 'bold' }}>{lang === 'ar' ? 'مقبول / مدفوع' : 'SUCCESS / PAID'}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setCheckoutModal(false)}
                  style={{ width: '100%', background: 'var(--brand-yellow)', color: '#0d1426', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {lang === 'ar' ? 'حسناً، إغلاق' : 'Okay, Close'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulated Fingerprint scanning modal */}
      {isVerifyingBiometrics && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 5, 10, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 60000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          direction: lang === 'ar' ? 'rtl' : 'ltr'
        }}>
          <div style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,200,61,0.05)',
            border: '2px solid rgba(255,200,61,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-yellow)',
            marginBottom: '1.5rem'
          }}>
            {/* Pulsing rings */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              borderRadius: '50%',
              border: '2px solid var(--brand-yellow)',
              opacity: 0.3,
              animation: 'biometricPulse 1.5s infinite'
            }} />
            <Fingerprint size={64} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
            {lang === 'ar' ? 'جاري التحقق من البصمة...' : 'Scanning Fingerprint...'}
          </h3>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>
            {lang === 'ar' ? 'ضع إصبعك على مستشعر البصمة في جهازك' : 'Place your finger on the device biometric scanner'}
          </p>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="modal-overlay" style={{ zIndex: 30000 }} onClick={() => setShowExitConfirm(false)}>
          <div className="modal-content animate-zoom-in" style={{ maxWidth: '360px', background: '#0d1426', border: '1px solid rgba(255, 200, 61, 0.2)', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--brand-yellow)', marginBottom: '1rem', fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold' }}>
              {lang === 'ar' ? 'تأكيد الخروج' : 'Confirm Exit'}
            </h3>
            <p style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '1.5' }}>
              {lang === 'ar' 
                ? 'هل أنت متأكد من رغبتك في الخروج من التطبيق؟' 
                : 'Are you sure you want to exit the application?'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="modal-cart-btn-full" 
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={() => setShowExitConfirm(false)}
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                className="modal-cart-btn-full" 
                style={{ flex: 1, background: 'var(--brand-yellow)', color: '#0d1426', border: 'none', borderRadius: '8px', padding: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={handleExitApp}
              >
                {lang === 'ar' ? 'خروج' : 'Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Home Button (Only when not in categories) */}
      {viewMode !== 'categories' && (
        <button 
          className="floating-home-btn" 
          onClick={navigateToCategories}
          aria-label="Home"
        >
          <Home size={28} />
        </button>
      )}
    </div>
  );
}
