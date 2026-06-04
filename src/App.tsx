import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { 
  Search, Globe, Phone, MapPin, AlertCircle, 
  Grid, MessageSquare, Heart, ShoppingCart
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
}

const CATEGORIES = {
  ar: [
    { val: 'ALL', label: 'الكل' },
    { val: 'SPARE_PARTS', label: 'قطع غيار' },
    { val: 'OILS', label: 'زيوت وسوائل' },
    { val: 'ACCESSORIES', label: 'إكسسوارات' },
    { val: 'TIRES', label: 'إطارات وبطاريات' },
    { val: 'OTHER', label: 'تصنيفات أخرى' }
  ],
  en: [
    { val: 'ALL', label: 'All' },
    { val: 'SPARE_PARTS', label: 'Spare Parts' },
    { val: 'OILS', label: 'Oils & Fluids' },
    { val: 'ACCESSORIES', label: 'Accessories' },
    { val: 'TIRES', label: 'Tires & Batteries' },
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

  const [cart, setCart] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quickauto_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('quickauto_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('quickauto_cart', JSON.stringify(cart));
  }, [cart]);

  const handleToggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleCart = (id: string) => {
    setCart(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const [activeList, setActiveList] = useState<'wishlist' | 'cart' | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const cartItems = useMemo(() => {
    return items.filter(item => cart.includes(item.id));
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
    const isOpen = !!activeList || filterOpen;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeList, filterOpen]);

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

    fetchItems('public_inventory_view').then(({ data, error }) => {
      if (error) {
        fetchItems('inventory_items').then(({ data: d2, error: e2 }) => {
          if (!e2 && d2) setItems(d2 as InventoryItem[]);
          setLoading(false);
        });
      } else if (data) {
        setItems(data as InventoryItem[]);
        setLoading(false);
      }
    });
  }, []);

  const matchesCategory = (itemCat: string, catVal: string): boolean => {
    const c = itemCat.toUpperCase().trim();
    if (catVal === 'ALL') return true;
    if (catVal === 'OILS') return c === 'OILS' || c.includes('OIL') || c.includes('زيت') || c.includes('سائل');
    if (catVal === 'TIRES') return c === 'TIRES' || c.includes('TIRE') || c.includes('إطار') || c.includes('بطارية') || c.includes('BATTERY');
    if (catVal === 'ACCESSORIES') return c === 'ACCESSORIES' || c.includes('ACCESSORY') || c.includes('إكسسوار');
    if (catVal === 'SPARE_PARTS') return c === 'SPARE_PARTS' || c.includes('PART') || c.includes('قطعة') || c.includes('فلتر') || c.includes('FILTER');
    if (catVal === 'OTHER') {
      return !matchesCategory(itemCat, 'OILS') && !matchesCategory(itemCat, 'TIRES') &&
             !matchesCategory(itemCat, 'ACCESSORIES') && !matchesCategory(itemCat, 'SPARE_PARTS');
    }
    return false;
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.barcode.toLowerCase().includes(search.toLowerCase());
      const matchCategory = matchesCategory(item.category || '', selectedCategory);
      return matchSearch && matchCategory;
    });
  }, [items, search, selectedCategory]);

  return (
    <div className="app-container" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
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
          {/* Exchange Rate Badge */}
          <div className="rate-badge">
            <span className="rate-indicator"></span>
            <span className="rate-label rate-label-desktop">{t.exchangeRateText}</span>
            <span className="rate-label rate-label-mobile">{lang === 'ar' ? 'سعر الصرف المعتمد' : 'Exchange Rate'}</span>
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
            {cart.length > 0 && <span className="nav-btn-badge">{cart.length}</span>}
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

        {/* Dropdown containing category cards */}
        {filterOpen && (
          <div className="header-filter-dropdown">
            <div className="header-filter-dropdown-content">
              {CATEGORIES[lang].map((cat) => {
                // Filter items for this category
                const catItems = items.filter(item => {
                  const itemCat = (item.category || '').toUpperCase();
                  if (cat.val === 'ALL') return true;
                  if (cat.val === 'OILS') return itemCat.includes('OIL') || itemCat.includes('زيت') || itemCat.includes('سائل');
                  if (cat.val === 'TIRES') return itemCat.includes('TIRE') || itemCat.includes('إطار') || itemCat.includes('بطارية') || itemCat.includes('BATTERY');
                  if (cat.val === 'ACCESSORIES') return itemCat.includes('ACCESSORY') || itemCat.includes('إكسسوار');
                  if (cat.val === 'SPARE_PARTS') return itemCat.includes('PART') || itemCat.includes('قطعة') || itemCat.includes('فلتر') || itemCat.includes('FILTER');
                  if (cat.val === 'OTHER') {
                    const isOil = itemCat.includes('OIL') || itemCat.includes('زيت') || itemCat.includes('سائل');
                    const isTire = itemCat.includes('TIRE') || itemCat.includes('إطار') || itemCat.includes('بطارية') || itemCat.includes('BATTERY');
                    const isAccessory = itemCat.includes('ACCESSORY') || itemCat.includes('إكسسوار');
                    const isPart = itemCat.includes('PART') || itemCat.includes('قطعة') || itemCat.includes('فلتر') || itemCat.includes('FILTER');
                    return !isOil && !isTire && !isAccessory && !isPart;
                  }
                  return false;
                });

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
                lang === 'ar'
                  ? `مرحباً كويك أوتو، أود الاستفسار عن/طلب قطعة: ${item.name} (${item.brand || ''} ${item.model || ''}) بكود OEM: ${item.barcode}`
                  : `Hello QUICK AUTO, I'd like to ask about/order part: ${item.name} (${item.brand || ''} ${item.model || ''}) with OEM code: ${item.barcode}`
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
                    <span className={`image-qty-badge ${!inStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                      {item.quantity}
                    </span>
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
                    <span className="model-badge-new" title={item.model || ''}>{item.model || '—'}</span>
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

                  {/* S4: WhatsApp order button, Cart icon button, and direct call button */}
                  <div className="card-row-4">
                    <button 
                      className={`card-cart-btn ${cart.includes(item.id) ? 'in-cart' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleToggleCart(item.id); }}
                      title={cart.includes(item.id) ? (lang === 'ar' ? 'إزالة من السلة' : 'Remove from cart') : (lang === 'ar' ? 'إضافة إلى السلة' : 'Add to cart')}
                    >
                      <ShoppingCart size={14} />
                    </button>

                    <a 
                      href={waUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="wa-order-btn-new wa-icon-only"
                      onClick={(e) => e.stopPropagation()}
                      title={t.orderWhatsApp}
                    >
                      <MessageSquare size={16} />
                    </a>
                    
                    <a 
                      href="tel:+963992162351" 
                      className="call-btn-new"
                      title={lang === 'ar' ? 'اتصال مباشر' : 'Call Direct'}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone size={14} />
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

      {/* Side Drawer for Cart / Wishlist */}
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
                          <button 
                            className="drawer-remove-btn" 
                            onClick={() => handleToggleCart(item.id)}
                            title={lang === 'ar' ? 'إزالة' : 'Remove'}
                          >
                            ×
                          </button>
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
                    ${cartItems.reduce((acc, item) => acc + item.selling_price_usd, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <a 
                  href={`https://wa.me/963992162351?text=${encodeURIComponent(
                    lang === 'ar'
                      ? `مرحباً كويك أوتو، أود طلب المواد التالية:\n${cartItems.map((item, idx) => `${idx + 1}. ${item.name} (${item.brand || ''} ${item.model || ''}) OEM: ${item.barcode}`).join('\n')}`
                      : `Hello QUICK AUTO, I'd like to order the following items:\n${cartItems.map((item, idx) => `${idx + 1}. ${item.name} (${item.brand || ''} ${item.model || ''}) OEM: ${item.barcode}`).join('\n')}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="drawer-checkout-btn"
                >
                  <MessageSquare size={16} />
                  <span>{lang === 'ar' ? 'طلب المواد عبر واتساب' : 'Order Items via WhatsApp'}</span>
                </a>
              </div>
            )}
          </div>
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
                  className="modal-image"
                />
                <span className="modal-qty-badge">
                  {lang === 'ar' ? `المتوفر: ${selectedItem.quantity} قطعة` : `Available: ${selectedItem.quantity} pcs`}
                </span>
              </div>
              
              <div className="modal-info">
                <h2 className="modal-title">{selectedItem.name}</h2>
                
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
                
                <div className="modal-prices">
                  <div className="modal-price-usd">
                    <span className="price-num">${selectedItem.selling_price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="modal-price-syp">
                    <span className="price-num">{(Math.ceil(selectedItem.selling_price_usd * exchangeRate / 5) * 5).toLocaleString()}</span>
                    <span className="price-unit"> {t.currencySYP}</span>
                  </div>
                </div>
                
                <div className="modal-actions-row">
                  <a 
                    href={`https://wa.me/963992162351?text=${encodeURIComponent(
                      lang === 'ar'
                        ? `مرحباً كويك أوتو، أود الاستفسار عن/طلب قطعة: ${selectedItem.name} (${selectedItem.brand || ''} ${selectedItem.model || ''}) بكود OEM: ${selectedItem.barcode}`
                        : `Hello QUICK AUTO, I'd like to ask about/order part: ${selectedItem.name} (${selectedItem.brand || ''} ${selectedItem.model || ''}) with OEM code: ${selectedItem.barcode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-wa-btn"
                  >
                    <MessageSquare size={16} />
                    <span>{t.orderWhatsApp}</span>
                  </a>
                  
                  <button 
                    className={`modal-cart-btn ${cart.includes(selectedItem.id) ? 'in-cart' : ''}`}
                    onClick={() => handleToggleCart(selectedItem.id)}
                  >
                    <ShoppingCart size={16} />
                    <span>
                      {cart.includes(selectedItem.id)
                        ? (lang === 'ar' ? 'مضاف للسلة' : 'In Cart')
                        : (lang === 'ar' ? 'إضافة للسلة' : 'Add to Cart')}
                    </span>
                  </button>

                  <button 
                    className={`modal-wishlist-btn ${wishlist.includes(selectedItem.id) ? 'active' : ''}`}
                    onClick={() => handleToggleWishlist(selectedItem.id)}
                  >
                    <Heart size={16} fill={wishlist.includes(selectedItem.id) ? "currentColor" : "none"} />
                    <span>
                      {wishlist.includes(selectedItem.id)
                        ? (lang === 'ar' ? 'في المفضلة' : 'In Wishlist')
                        : (lang === 'ar' ? 'إضافة للمفضلة' : 'Add to Wishlist')}
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
