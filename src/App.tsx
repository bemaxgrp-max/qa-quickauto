import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { Search, Globe, Phone, MapPin, AlertCircle } from 'lucide-react';

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

const TRANSLATIONS = {
  ar: {
    title: 'دليل قطع غيار QUICKAUTO',
    subtitle: 'ابحث عن قطع الغيار والملحقات المتوفرة في مركزنا الفني مباشرة وبشفافية',
    searchPlaceholder: 'ابحث باسم القطعة، ماركتها، أو كود OEM...',
    exchangeRateText: 'سعر الصرف المعتمد:',
    currencySYP: 'ل.س',
    inStock: 'متوفر في المركز',
    outOfStock: 'غير متوفر مؤقتاً',
    lowStock: 'كمية محدودة',
    brand: 'الماركة:',
    model: 'الموديل المتوافق:',
    code: 'كود القطعة (OEM):',
    phone: 'اتصال ومبيعات',
    address: 'درعا - طريق دمشق - بجانب اتصالات درعا',
    noResults: 'لم يتم العثور على قطع تطابق بحثك. يرجى مراجعة الاسم أو الكود.',
    loading: 'جاري تحميل دليل قطع الغيار...',
    allRightsReserved: 'جميع الحقوق محفوظة. مركز كويك أوتو الفني'
  },
  en: {
    title: 'QUICKAUTO Spare Parts Catalog',
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
    address: 'Daraa - Damascus Road - Next to Daraa Telecom',
    noResults: 'No parts matched your search. Please check the name or code.',
    loading: 'Loading spare parts catalog...',
    allRightsReserved: 'All Rights Reserved. QUICKAUTO Technical Center'
  }
};

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(15000); // Fallback rate
  const [loading, setLoading] = useState(true);

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
        setExchangeRate(rateData.rate / 100);
      }

      // 2. Fetch inventory items from the secure public view (or table)
      // Note: We use public_inventory_view if defined, otherwise we query inventory_items directly.
      // We limit to active items.
      const { data: itemsData, error } = await supabase
        .from('public_inventory_view')
        .select('*');

      if (error) {
        // Fallback if view is not created yet, fetch from table
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

  return (
    <div className="app-container" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Top Header Navigation */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-quick">QUICK</span>
          <span className="brand-auto">AUTO</span>
        </div>
        
        <div className="navbar-actions">
          {/* Exchange Rate Badge */}
          <div className="rate-badge">
            <span className="rate-label">{t.exchangeRateText}</span>
            <span className="rate-value">{exchangeRate.toLocaleString()} {t.currencySYP} / $</span>
          </div>

          {/* Language Toggle */}
          <button className="lang-btn" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <Globe size={18} />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title">{t.title}</h1>
        <p className="hero-subtitle">{t.subtitle}</p>
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
            {CATEGORIES[lang].map((cat) => (
              <button
                key={cat.val}
                className={`category-tab ${selectedCategory === cat.val ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.val)}
              >
                {cat.label}
              </button>
            ))}
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

              return (
                <div key={item.id} className="part-card">
                  {/* Status Badge */}
                  <div className="card-status-wrapper">
                    <span className={`status-badge ${!inStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                      {!inStock ? t.outOfStock : isLowStock ? t.lowStock : t.inStock}
                    </span>
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
                    <div className="meta-row">
                      <span className="meta-label">{t.code}</span>
                      <span className="meta-val code-val">{item.barcode}</span>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="price-box">
                    <div className="price-syp">
                      <span className="price-num">{priceSyp.toLocaleString()}</span>
                      <span className="price-unit">{t.currencySYP}</span>
                    </div>
                    <div className="price-usd">
                      <span>$</span>
                      <span>{item.selling_price_usd}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky Bottom Contact Panel for Mobile */}
      <footer className="footer">
        <div className="footer-info">
          <div className="info-item">
            <MapPin size={16} />
            <span>{t.address}</span>
          </div>
          <div className="info-item">
            <Phone size={16} />
            <a href="tel:+963955555555" className="phone-link">+963 955 555 555</a>
          </div>
        </div>
        <p className="copyright">© {new Date().getFullYear()} QUICKAUTO. {t.allRightsReserved}</p>
      </footer>
    </div>
  );
}
