import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { 
  Search, Globe, Phone, MapPin, AlertCircle, 
  Grid, Heart, ShoppingCart
} from 'lucide-react';

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
    { val: 'SPARE_PARTS', label: 'قطع غيار' },
    { val: 'OILS', label: 'زيوت وسوائل' },
    { val: 'ACCESSORIES', label: 'إكسسوارات' },
    { val: 'TIRES', label: 'إطارات وبطاريات' },
    { val: 'SERVICES', label: 'قاعدة الخدمات' },
    { val: 'OTHER', label: 'تصنيفات أخرى' }
  ],
  en: [
    { val: 'ALL', label: 'All' },
    { val: 'SPARE_PARTS', label: 'Spare Parts' },
    { val: 'OILS', label: 'Oils & Fluids' },
    { val: 'ACCESSORIES', label: 'Accessories' },
    { val: 'TIRES', label: 'Tires & Batteries' },
    { val: 'SERVICES', label: 'Services' },
    { val: 'OTHER', label: 'Other' }
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
  return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80';
};

const getCategoryBgImage = (val: string) => {
  switch (val) {
    case 'ALL':
      return 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&w=400&q=80';
    case 'OILS':
      return 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80';
    case 'TIRES':
      return 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=400&q=80';
    case 'ACCESSORIES':
      return 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=400&q=80';
    case 'SPARE_PARTS':
      return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80';
    default:
      return 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&w=400&q=80';
  }
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(140.20);
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
    const isOpen = !!activeList || filterOpen || !!zoomedImage;
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
  }, [activeList, filterOpen, zoomedImage]);

  // Pull-to-refresh custom swipe logic
  useEffect(() => {
    let startY = 0;
    let isPulling = false;

    const onTouchStart = (e: TouchEvent) => {
      const isAtTop = window.scrollY === 0 && document.documentElement.scrollTop === 0 && document.body.scrollTop === 0;
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
      if (resisted > 95) {
        window.location.reload();
      } else {
        setPullOffset(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeList, filterOpen, zoomedImage, selectedItem]);

  useEffect(() => {
    supabase
      .from('exchange_rates')
      .select('rate')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: rateData }) => {
        if (rateData && rateData.rate) {
          setExchangeRate(rateData.rate / 100);
        }
      });

    const fetchItems = (table: string) =>
      supabase
        .from(table)
        .select('id, name, barcode, brand, model, quantity, selling_price_usd, category, image_url, created_at')
        .then(({ data, error }) => ({ data, error }));

    const fetchServices = () =>
      supabase
        .from('services')
        .select('id, name, price_usd, category, expected_duration_minutes, is_category_affected, silver_discount_percent, gold_discount_percent, platinum_discount_percent, parent_id, is_group, created_at')
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
        image_url: null,
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

    const isTires = () => {
      if (match(cat, ['إطارات وبطاريات', 'إطارات', 'بطاريات', 'بطارية', 'إطار', 'tire', 'tires', 'battery', 'batteries'])) return true;
      if (!cat) {
        return match(name, ['إطار', 'اطار', 'بطارية', 'بطاريه', 'دولاب', 'عجل', 'تير', 'tire', 'wheel', 'battery']);
      }
      return false;
    };

    if (catVal === 'SPARE_PARTS') return isSpareParts();
    if (catVal === 'OILS') return isOils();
    if (catVal === 'ACCESSORIES') return isAccessories();
    if (catVal === 'TIRES') return isTires();
    
    if (catVal === 'OTHER') {
      return !isSpareParts() && !isOils() && !isAccessories() && !isTires();
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
          <div className={`ptr-icon-arrow ${pullOffset > 90 ? 'rotate' : ''}`}>
            ↓
          </div>
        </div>
      )}

      {/* Overlay backdrop for filter */}
      {filterOpen && <div className="filter-backdrop" onClick={() => setFilterOpen(false)} />}
      
      {/* Top Header Navigation */}
      <header className="navbar" ref={filterRef}>
        <div className="brand-and-filter">
          <div className="navbar-brand">
            <span className="brand-auto">AUTO</span>
            <span className="brand-space"> </span>
            <span className="brand-quick">QUICK</span>
          </div>
          {/* Filter btn visible on desktop inside brand row */}
          <button className="filter-toggle-btn-header filter-btn-desktop" onClick={() => setFilterOpen(!filterOpen)}>
            <Grid size={16} />
            <span>{lang === 'ar' ? 'الفلتر' : 'Filter'}</span>
          </button>
        </div>
        
        {/* Search box + mobile filter button */}
        <div className="header-search-row">
          <div className="header-search-box">
            <Search className="header-search-icon" size={16} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="header-search-input"
            />
          </div>
          {/* Filter btn visible on mobile beside search */}
          <button className="filter-toggle-btn-header filter-btn-mobile" onClick={() => setFilterOpen(!filterOpen)}>
            <Grid size={16} />
          </button>
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

          {/* Cart Button */}
          <button 
            className={`icon-nav-btn ${activeList === 'cart' ? 'active' : ''}`} 
            onClick={() => setActiveList(activeList === 'cart' ? null : 'cart')}
            title={lang === 'ar' ? 'السلة' : 'Cart'}
          >
            <ShoppingCart size={18} />
            {Object.keys(cart).length > 0 && <span className="nav-btn-badge">{Object.keys(cart).length}</span>}
          </button>

          {/* Wishlist Button */}
          <button 
            className={`icon-nav-btn ${activeList === 'wishlist' ? 'active' : ''}`} 
            onClick={() => setActiveList(activeList === 'wishlist' ? null : 'wishlist')}
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

        {/* Dropdown containing category cards */}
        {filterOpen && (
          <div className="header-filter-dropdown">
            <div className="header-filter-dropdown-content">
              {CATEGORIES[lang].map((cat) => {
                // Filter items for this category
                const catItems = items.filter(item => matchesCategory(item, cat.val));

                const bgImg = getCategoryBgImage(cat.val);

                return (
                  <div
                    key={cat.val}
                    className={`category-dropdown-card ${selectedCategory === cat.val ? 'active-cat' : ''}`}
                    style={{ backgroundImage: `url(${bgImg})` }}
                    onClick={() => {
                      setSelectedCategory(cat.val);
                      setFilterOpen(false);
                      document.querySelector('.catalog-wrapper')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <div className="category-card-overlay"></div>
                    <div className="category-card-content">
                      <h4>{cat.label}</h4>
                      <span className="cat-count-badge">{catItems.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Search & Filters Section */}
      <main className="catalog-wrapper">
        {selectedCategory !== 'ALL' && (
          <div className="catalog-toolbar">
            <div className="active-filter-badge">
              <span>{CATEGORIES[lang].find(c => c.val === selectedCategory)?.label}</span>
              <button onClick={() => setSelectedCategory('ALL')} className="clear-filter-btn">×</button>
            </div>
          </div>
        )}

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
                  onClick={() => setSelectedItem(item)}
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
                    {item.isService ? (
                      <span className="image-qty-badge service-badge-tag">
                        {lang === 'ar' ? 'خدمة فنية' : 'Service'}
                      </span>
                    ) : (
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
      </main>

      {/* Sticky Bottom Contact Panel */}
      <footer className="footer">
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
          <span className="footer-separator">|</span>
          <p className="copyright">© {new Date().getFullYear()} QUICK AUTO. {t.allRightsReserved}</p>
        </div>
      </footer>

      {/* Side Drawer for Cart / Wishlist - always on the right */}
      {activeList && (
        <div className="drawer-overlay" onClick={() => setActiveList(null)}>
          <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>
                {activeList === 'cart' 
                  ? (lang === 'ar' ? 'سلة المشتريات' : 'Shopping Cart')
                  : (lang === 'ar' ? 'المفضلة' : 'My Wishlist')}
              </h3>
              <button className="drawer-close-btn" onClick={() => setActiveList(null)}>×</button>
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
              <div className="drawer-footer">
                <div className="drawer-total">
                  <span>{lang === 'ar' ? 'المجموع:' : 'Total:'}</span>
                  <span className="total-price">
                    ${cartItems.reduce((acc, item) => acc + item.selling_price_usd * (cart[item.id] || 1), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <a 
                  href={`https://wa.me/963992162351?text=${encodeURIComponent(
                    lang === 'ar'
                      ? `مرحباً كويك أوتو، أود طلب المواد التالية:\n${cartItems.map((item, idx) => `${idx + 1}. ${item.name} (كمية: ${cart[item.id]||1}) OEM: ${item.barcode}`).join('\n')}`
                      : `Hello QUICK AUTO, I'd like to order:\n${cartItems.map((item, idx) => `${idx + 1}. ${item.name} (Qty: ${cart[item.id]||1}) OEM: ${item.barcode}`).join('\n')}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="drawer-checkout-btn"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span>{lang === 'ar' ? 'طلب المواد عبر واتساب' : 'Order Items via WhatsApp'}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Zoom Overlay */}
      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="zoom" className="image-zoom-img" />
          <button className="image-zoom-close" onClick={() => setZoomedImage(null)}>×</button>
        </div>
      )}

      {/* Details Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedItem(null)}>×</button>
            
            <div className="modal-grid">
              <div className="modal-image-wrapper">
                <img 
                  src={(selectedItem as any).image_url || getCategoryImageUrl(selectedItem.category, selectedItem.name)} 
                  alt={selectedItem.name} 
                  className="modal-image modal-image-zoomable"
                  onClick={(e) => { e.stopPropagation(); setZoomedImage((selectedItem as any).image_url || getCategoryImageUrl(selectedItem.category, selectedItem.name)); }}
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
                <span className="modal-image-hint">{lang === 'ar' ? '👆 اضغط لتكبير الصورة' : '👆 Tap to zoom'}</span>
              </div>
              
              <div className="modal-info">
                <h2 className="modal-title">{selectedItem.name}</h2>
                
                {selectedItem.isService ? (
                  /* SERVICES DETAIL VIEW */
                  <div className="service-details-container">
                    <div className="service-meta-row">
                      <div className="meta-badge duration">
                        <span>{lang === 'ar' ? '⏱️ المدة المتوقعة:' : '⏱️ Expected Duration:'}</span>
                        <strong>{selectedItem.expected_duration_minutes || 30} {lang === 'ar' ? 'دقيقة' : 'mins'}</strong>
                      </div>
                      <div className={`meta-badge category-affect ${selectedItem.is_category_affected ? 'affected' : 'fixed'}`}>
                        <span>{selectedItem.is_category_affected 
                          ? (lang === 'ar' ? '⚙️ السعر يتغير حسب فئة السيارة' : '⚙️ Price varies by car class')
                          : (lang === 'ar' ? '⚙️ سعر ثابت لجميع الفئات' : '⚙️ Fixed price for all classes')}</span>
                      </div>
                    </div>

                    {/* Table 1: Price Differences based on Vehicle Category */}
                    <div className="service-section">
                      <h4 className="section-title">{lang === 'ar' ? '💰 تكلفة الخدمة حسب فئة السيارة:' : '💰 Service Cost by Vehicle Class:'}</h4>
                      <div className="price-matrix-grid">
                        {[
                          { key: 'economy', labelAr: 'اقتصادية (Economy)', labelEn: 'Economy', factor: 1.0 },
                          { key: 'mid-range', labelAr: 'متوسطة (Mid-range)', labelEn: 'Mid-range', factor: selectedItem.is_category_affected ? 1.5 : 1.0 },
                          { key: 'luxury', labelAr: 'فاخرة (Luxury)', labelEn: 'Luxury', factor: selectedItem.is_category_affected ? 2.0 : 1.0 },
                          { key: 'sport', labelAr: 'رياضية (Sport)', labelEn: 'Sport', factor: selectedItem.is_category_affected ? 2.5 : 1.0 }
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

                    {/* Table 2: Membership Discounts */}
                    <div className="service-section">
                      <h4 className="section-title">{lang === 'ar' ? '💎 نسبة الخصومات لأصحاب العضوية المعتمدة:' : '💎 Membership Tier Discounts:'}</h4>
                      <div className="discount-matrix-grid">
                        {[
                          { tier: 'silver', labelAr: 'العضوية الفضية (Silver)', labelEn: 'Silver Member', pct: selectedItem.silver_discount_percent ?? 10, color: '#aaa' },
                          { tier: 'gold', labelAr: 'العضوية الذهبية (Gold)', labelEn: 'Gold Member', pct: selectedItem.gold_discount_percent ?? 15, color: 'var(--brand-yellow)' },
                          { tier: 'platinum', labelAr: 'العضوية البلاتينية (Platinum)', labelEn: 'Platinum Member', pct: selectedItem.platinum_discount_percent ?? 20, color: '#e74c3c' }
                        ].map(m => {
                          const basePrice = selectedItem.selling_price_usd;
                          const discountAmountUsd = basePrice * (m.pct / 100);
                          const discountAmountSyp = Math.ceil(discountAmountUsd * exchangeRate / 5) * 5;
                          return (
                            <div key={m.tier} className="matrix-row discount-row">
                              <div className="matrix-member-label">
                                <span className="member-dot" style={{ backgroundColor: m.color }} />
                                <span>{lang === 'ar' ? m.labelAr : m.labelEn}</span>
                              </div>
                              <div className="matrix-member-discount">
                                <span className="m-pct">%{m.pct} -</span>
                                <span className="m-saved-desc">{lang === 'ar' ? 'توفر' : 'Saves'}</span>
                                <span className="m-saved-val">${discountAmountUsd.toFixed(2)} ({discountAmountSyp.toLocaleString()} {t.currencySYP})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STANDARD PRODUCTS DETAIL VIEW */
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
                      <div className="detail-value oem-copy-wrapper">
                        <span>{selectedItem.barcode}</span>
                        <button 
                          className="modal-copy-btn" 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedItem.barcode);
                            alert(lang === 'ar' ? 'تم نسخ الكود!' : 'Code copied!');
                          }}
                        >
                          {lang === 'ar' ? 'نسخ' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="modal-detail-item">
                      <span className="detail-label">{lang === 'ar' ? 'القسم:' : 'Category:'}</span>
                      <span className="detail-value">{selectedItem.category || '—'}</span>
                    </div>
                  </div>
                )}

                {/* Interactive Quantity Control Stepper */}
                <div className="modal-qty-control-row">
                  <span className="qty-label">{selectedItem.isService ? (lang === 'ar' ? 'العدد المطلوب للخدمة:' : 'Requested Quantity:') : (lang === 'ar' ? 'الكمية المطلوبة:' : 'Requested Quantity:')}</span>
                  <div className="qty-stepper" style={{ direction: 'ltr' }}>
                    <button 
                      className="qty-btn" 
                      onClick={() => handleChangeQty(selectedItem.id, -1)}
                      disabled={!(cart[selectedItem.id] > 0)}
                    >
                      ▼
                    </button>
                    <span className="qty-val">{cart[selectedItem.id] || 0}</span>
                    <button 
                      className="qty-btn" 
                      onClick={() => {
                        if (!(cart[selectedItem.id] > 0)) {
                          handleToggleCart(selectedItem.id);
                        } else {
                          handleChangeQty(selectedItem.id, 1);
                        }
                      }}
                    >
                      ▲
                    </button>
                  </div>
                </div>
                
                <div className="modal-prices">
                  <div className="modal-price-usd">
                    <span className="price-num">${selectedItem.selling_price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="modal-price-syp">
                    <span className="price-num">{(Math.ceil(selectedItem.selling_price_usd * exchangeRate / 5) * 5).toLocaleString()}</span>
                    <span className="price-unit"> {t.currencySYP}</span>
                  </div>
                </div>
                
                {/* Desktop: full text buttons | Mobile: icon-only row */}
                <div className="modal-actions-row">
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
                    className="modal-wa-btn"
                    title={t.orderWhatsApp}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span className="modal-btn-text">{t.orderWhatsApp}</span>
                  </a>

                  <a
                    href="tel:+963992162351"
                    className="modal-call-btn"
                    title={lang === 'ar' ? 'اتصال مباشر' : 'Call Direct'}
                  >
                    <Phone size={18} />
                    <span className="modal-btn-text">{lang === 'ar' ? 'اتصال' : 'Call'}</span>
                  </a>
                  
                  <button 
                    className={`modal-cart-btn ${(cart[selectedItem.id]||0)>0 ? 'in-cart' : ''}`}
                    onClick={() => handleToggleCart(selectedItem.id)}
                    title={(cart[selectedItem.id]||0)>0 ? (lang === 'ar' ? 'مضاف للسلة' : 'In Cart') : (lang === 'ar' ? 'إضافة للسلة' : 'Add to Cart')}
                  >
                    <ShoppingCart size={18} />
                    <span className="modal-btn-text">
                      {(cart[selectedItem.id]||0)>0 ? (lang === 'ar' ? `في السلة (${cart[selectedItem.id]})` : `Cart (${cart[selectedItem.id]})`) : (lang === 'ar' ? 'السلة' : 'Cart')}
                    </span>
                  </button>

                  <button 
                    className={`modal-wishlist-btn ${wishlist.includes(selectedItem.id) ? 'active' : ''}`}
                    onClick={() => handleToggleWishlist(selectedItem.id)}
                    title={wishlist.includes(selectedItem.id) ? (lang === 'ar' ? 'في المفضلة' : 'In Wishlist') : (lang === 'ar' ? 'إضافة للمفضلة' : 'Add to Wishlist')}
                  >
                    <Heart size={18} fill={wishlist.includes(selectedItem.id) ? "currentColor" : "none"} />
                    <span className="modal-btn-text">
                      {wishlist.includes(selectedItem.id) ? (lang === 'ar' ? 'مفضلة' : 'Saved') : (lang === 'ar' ? 'المفضلة' : 'Wishlist')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
