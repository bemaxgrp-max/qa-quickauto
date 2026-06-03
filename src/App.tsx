import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { 
  Search, Globe, Phone, MapPin, AlertCircle, Wrench, Droplet, 
  Sparkles, Cpu, Layers, Grid, Copy, Check, MessageSquare, Package 
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

const CATEGORY_ICONS: Record<string, any> = {
  ALL: Grid,
  SPARE_PARTS: Wrench,
  OILS: Droplet,
  ACCESSORIES: Sparkles,
  TIRES: Cpu,
  OTHER: Layers
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

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(15000); // Fallback rate
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const fetchCatalogData = async () => {
    setLoading(true);
    try {
      // 1. Fetch latest exchange rate (Supabase stores rate * 100, e.g. 1500000 for 15000)
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (rateData && rateData.rate) {
        const rawRate = rateData.rate;
        // Handle both Legacy (raw e.g. 15000) and New (100x e.g. 1500000) formats
        if (rawRate > 100000) {
          setExchangeRate(rawRate / 100);
        } else {
          setExchangeRate(rawRate);
        }
      }

      // 2. Fetch inventory items from the secure public view (or table)
      const { data: itemsData, error } = await supabase
        .from('public_inventory_view')
        .select('*');

      if (error) {
        console.warn('Could not read from public_inventory_view, falling back to table:', error.message);
        const { data: fallbackData } = await supabase
          .from('inventory_items')
          .select('id, name, barcode, brand, model, quantity, selling_price_usd, category, created_at');
        if (fallbackData) {
          setItems(fallbackData);
        }
      } else if (itemsData) {
        setItems(itemsData);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter items based on category and search text
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch =
        (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.barcode || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.brand || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.model || '').toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === 'ALL' ||
        (item.category || 'OTHER') === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [items, search, selectedCategory]);

  // General counts for Stats Cards
  const totalStockCount = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantity > 0 ? item.quantity : 0), 0);
  }, [items]);

  const categoriesCount = useMemo(() => {
    const activeCats = new Set(items.map(i => i.category || 'OTHER'));
    return activeCats.size;
  }, [items]);

  return (
    <div className="app-container" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* Background Decorative Blurs */}
      <div className="background-decor blur-orb-1"></div>
      <div className="background-decor blur-orb-2"></div>
      <div className="background-decor blur-orb-3"></div>

      {/* Top Header Navigation */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-quick">QUICK</span>
          <span className="brand-space"> </span>
          <span className="brand-auto">AUTO</span>
        </div>
        
        <div className="navbar-actions">
          {/* Exchange Rate Badge */}
          <div className="rate-badge">
            <span className="rate-indicator"></span>
            <span className="rate-label">{t.exchangeRateText}</span>
            <span className="rate-value">{exchangeRate.toLocaleString()} {t.currencySYP} / $</span>
          </div>

          {/* Language Toggle */}
          <button className="lang-btn" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <Globe size={16} />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="live-pill">
          <span className="pulse-dot"></span>
          <span>{t.lastUpdated}</span>
        </div>
        <h1 className="hero-title">{t.title}</h1>
        <p className="hero-subtitle">{t.subtitle}</p>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-box">
            <Package size={20} className="stat-icon" />
            <div className="stat-details">
              <span className="stat-num">{totalStockCount.toLocaleString()}</span>
              <span className="stat-label">{t.totalParts}</span>
            </div>
          </div>
          <div className="stat-box">
            <Layers size={20} className="stat-icon" />
            <div className="stat-details">
              <span className="stat-num">{categoriesCount}</span>
              <span className="stat-label">{t.totalCategories}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Search & Filters Section */}
      <main className="catalog-wrapper">
        <div className="controls-card">
          {/* Search Input */}
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            {CATEGORIES[lang].map((cat) => {
              const IconComponent = CATEGORY_ICONS[cat.val] || Layers;
              return (
                <button
                  key={cat.val}
                  className={`category-tab ${selectedCategory === cat.val ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.val)}
                >
                  <IconComponent size={16} className="tab-icon" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
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
                lang === 'ar'
                  ? `مرحباً كويك أوتو، أود الاستفسار عن/طلب قطعة: ${item.name} (${item.brand || ''} ${item.model || ''}) بكود OEM: ${item.barcode}`
                  : `Hello QUICK AUTO, I'd like to ask about/order part: ${item.name} (${item.brand || ''} ${item.model || ''}) with OEM code: ${item.barcode}`
              );
              const waUrl = `https://wa.me/963992162351?text=${waText}`;

              return (
                <div key={item.id} className="part-card">
                  {/* Status & Copy Header */}
                  <div className="card-header-row">
                    <span className={`status-badge ${!inStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                      {!inStock ? t.outOfStock : isLowStock ? t.lowStock : t.inStock}
                    </span>

                    <button 
                      className="copy-btn" 
                      onClick={() => handleCopyCode(item.id, item.barcode)}
                      title={copiedId === item.id ? t.copied : t.copy}
                    >
                      {copiedId === item.id ? <Check size={14} className="success-icon" /> : <Copy size={14} />}
                      <span>{copiedId === item.id ? t.copied : item.barcode}</span>
                    </button>
                  </div>

                  {/* Part Details */}
                  <h3 className="part-name">{item.name}</h3>

                  <div className="part-meta-rows">
                    {item.brand && (
                      <div className="meta-row">
                        <span className="meta-label">{t.brand}</span>
                        <span className="meta-val">{item.brand}</span>
                      </div>
                    )}
                    {item.model && (
                      <div className="meta-row">
                        <span className="meta-label">{t.model}</span>
                        <span className="meta-val">{item.model}</span>
                      </div>
                    )}
                    
                    {/* Quantity Display */}
                    <div className="meta-row quantity-row">
                      <span className="meta-label">{t.qtyAvailable}</span>
                      <span className={`meta-val qty-val ${!inStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                        {item.quantity} {t.pieces}
                      </span>
                    </div>
                  </div>

                  {/* Price and Action Section */}
                  <div className="price-box">
                    <div className="price-info">
                      <div className="price-syp">
                        <span className="price-num">{priceSyp.toLocaleString()}</span>
                        <span className="price-unit">{t.currencySYP}</span>
                      </div>
                      <div className="price-usd">
                        <span>$</span>
                        <span>{item.selling_price_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <a 
                      href={waUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="wa-order-btn"
                    >
                      <MessageSquare size={16} />
                      <span>{t.orderWhatsApp}</span>
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
        <div className="footer-info">
          <div className="info-item">
            <MapPin size={18} className="footer-icon" />
            <a 
              href="https://maps.google.com/?q=32.6256,36.1054" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link"
            >
              {t.address}
            </a>
          </div>
          <div className="info-item">
            <Phone size={18} className="footer-icon" />
            <a href="tel:+963992162351" className="footer-link">+963 992 162 351</a>
          </div>
        </div>
        <p className="copyright">© {new Date().getFullYear()} QUICK AUTO. {t.allRightsReserved}</p>
      </footer>
    </div>
  );
}
