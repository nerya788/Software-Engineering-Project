import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Search } from 'lucide-react';

const FAVORITES_KEY = 'wedding_favorite_tips';

// 200 טיפים סטטיים (נוצרים פעם אחת) – אין DB, נשמרים רק מועדפים ב-localStorage
const buildTips = () => {
  const categories = [
    { id: 'Planning', label: 'תכנון ולו״ז' },
    { id: 'Budget', label: 'תקציב' },
    { id: 'Vendors', label: 'ספקים' },
    { id: 'Guests', label: 'מוזמנים' },
    { id: 'Design', label: 'עיצוב ואווירה' },
    { id: 'Logistics', label: 'לוגיסטיקה' },
    { id: 'DayOf', label: 'יום האירוע' },
    { id: 'Health', label: 'רווחה ושפיות' },
  ];

  const base = [
    { cat: 'Planning', text: 'בנו לו״ז שבועי קצר עד החתונה – מה עושים השבוע בלבד.' },
    { cat: 'Budget', text: 'הגדירו תקציב מקסימום ואז חלקו אותו לאחוזים לפי עדיפויות.' },
    { cat: 'Vendors', text: 'בקשו הצעת מחיר כתובה + מה בדיוק כלול (שעות, תוספות, ביטול).' },
    { cat: 'Guests', text: 'פתחו רשימת מוזמנים “חובה” ו-“רצוי” כדי לנהל קיצוצים בקלות.' },
    { cat: 'Design', text: 'בחרו 2–3 צבעים מובילים והיצמדו אליהם לכל ההזמנות/קישוטים.' },
    { cat: 'Logistics', text: 'עשו צ׳ק-ליסט ליום האירוע: מי לוקח, מי מביא, מי מתקשר.' },
    { cat: 'DayOf', text: 'קבעו “איש קשר” אחד לכל ספק כדי שלא תרוצו בין כולם.' },
    { cat: 'Health', text: 'קבעו ערב אחד בשבוע בלי חתונה – רק לנוח.' },
  ];

  const tips = [];
  for (let i = 0; i < 200; i++) {
    const b = base[i % base.length];
    const cat = categories.find(c => c.id === b.cat) || categories[0];
    tips.push({
      id: i + 1,
      categoryId: cat.id,
      categoryLabel: cat.label,
      title: `טיפ #${i + 1}`,
      text: b.text + (i % 3 === 0 ? ' (כלל אצבע: פשוט ויעיל)' : ''),
    });
  }

  return { tips, categories };
};

const { tips: ALL_TIPS, categories: ALL_CATEGORIES } = buildTips();

const Tips = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('recommended'); // recommended | title | category
  const [favorites, setFavorites] = useState([]);

  const loadFavorites = () => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      setFavorites(Array.isArray(ids) ? ids : []);
    } catch {
      setFavorites([]);
    }
  };

  const saveFavorites = (ids) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
    setFavorites(ids);

    // מעדכן את הדשבורד באותו טאאב (storage לא תמיד נורה באותו חלון)
    window.dispatchEvent(new Event('tips_favorites_updated'));
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const toggleFavorite = (tipId) => {
    const isFav = favorites.includes(tipId);
    const next = isFav ? favorites.filter(id => id !== tipId) : [...favorites, tipId];
    saveFavorites(next);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = ALL_TIPS.filter(t => {
      const matchCat = category === 'all' || t.categoryId === category;
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.text.toLowerCase().includes(q) ||
        t.categoryLabel.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    if (sort === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'he'));
    } else if (sort === 'category') {
      list = [...list].sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel, 'he') || a.id - b.id);
    } else {
      // recommended: מועדפים למעלה, ואז לפי id
      list = [...list].sort((a, b) => {
        const af = favorites.includes(a.id) ? 0 : 1;
        const bf = favorites.includes(b.id) ? 0 : 1;
        return af - bf || a.id - b.id;
      });
    }

    return list;
  }, [search, category, sort, favorites]);

  const favoriteTips = useMemo(() => {
    const set = new Set(favorites);
    return ALL_TIPS.filter(t => set.has(t.id));
  }, [favorites]);

  return (
    <div className="min-h-screen p-8 font-sans transition-colors duration-300 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100" dir="rtl">
      <div className="max-w-[1400px] mx-auto mb-8 flex justify-between items-center">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition bg-white border rounded-full shadow-sm text-surface-500 border-surface-200 hover:text-purple-600 hover:shadow-md dark:bg-surface-800 dark:border-surface-700 dark:text-surface-300 dark:hover:text-purple-400">
          <ArrowRight size={16} /> חזרה לדשבורד
        </Link>

        <div className="text-sm font-bold text-surface-500 dark:text-surface-400">
          ⭐ מועדפים: {favorites.length}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* שמאל: מועדפים */}
        <div className="lg:col-span-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-xl shadow-surface-200/50 dark:shadow-none overflow-hidden">
          <div className="p-6 border-b border-surface-100 dark:border-surface-700">
            <h2 className="text-xl font-extrabold text-transparent bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
              מועדפים
            </h2>
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              הטיפים שסימנת בכוכב. נשמרים במחשב שלך עד שתסיר ⭐.
            </p>
          </div>

          <div className="p-4">
            {favoriteTips.length === 0 ? (
              <div className="p-6 text-center text-sm text-surface-400">
                אין עדיין מועדפים. סמן ⭐ ליד טיפ כדי להוסיף.
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteTips.map(tip => (
                  <div key={tip.id} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/60 dark:bg-surface-700/20">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-300">{tip.categoryLabel}</div>
                        <div className="text-sm font-extrabold">{tip.title}</div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(tip.id)}
                        className="p-2 rounded-lg hover:bg-white/70 dark:hover:bg-surface-800 transition"
                        title="הסר מהמועדפים"
                      >
                        <Star size={18} className="text-yellow-400" fill="currentColor" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
                      {tip.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ימין: מאגר טיפים */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-xl shadow-surface-200/50 dark:shadow-none overflow-hidden">
          <div className="p-6 border-b border-surface-100 dark:border-surface-700">
            <h2 className="text-2xl font-extrabold tracking-tight">Wedding Tips</h2>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              מיון לפי קטגוריה, חיפוש, וכוכב ⭐ למועדפים.
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* חיפוש */}
              <div className="relative">
                <span className="absolute top-3.5 right-4 text-surface-400">
                  <Search size={16} />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש טיפ..."
                  className="w-full py-3 pl-4 pr-12 text-sm transition border outline-none rounded-xl border-surface-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-sm bg-white dark:bg-surface-700 dark:border-surface-600 dark:text-white dark:placeholder-surface-400"
                />
              </div>

              {/* קטגוריה */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-3 px-4 text-sm font-medium transition border outline-none cursor-pointer rounded-xl border-surface-200 bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-sm text-surface-600 dark:bg-surface-700 dark:border-surface-600 dark:text-surface-200"
              >
                <option value="all">כל הקטגוריות</option>
                {ALL_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              {/* מיון */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full py-3 px-4 text-sm font-medium transition border outline-none cursor-pointer rounded-xl border-surface-200 bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-sm text-surface-600 dark:bg-surface-700 dark:border-surface-600 dark:text-surface-200"
              >
                <option value="recommended">מומלץ (מועדפים למעלה)</option>
                <option value="category">לפי קטגוריה</option>
                <option value="title">לפי כותרת</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            <div className="text-xs text-surface-400 mb-4">
              מציג {filtered.length} מתוך {ALL_TIPS.length}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(tip => {
                const isFav = favorites.includes(tip.id);
                return (
                  <div key={tip.id} className="p-5 rounded-2xl border border-surface-200 dark:border-surface-700 hover:shadow-md transition bg-white dark:bg-surface-800">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold text-purple-600 dark:text-purple-300">{tip.categoryLabel}</div>
                        <div className="text-sm font-extrabold text-surface-800 dark:text-surface-100">{tip.title}</div>
                      </div>

                      <button
                        onClick={() => toggleFavorite(tip.id)}
                        className="p-2 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/40 transition active:scale-95"
                        title={isFav ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
                      >
                        <Star
                          size={18}
                          className={isFav ? 'text-yellow-400' : 'text-surface-300 dark:text-surface-500'}
                          fill={isFav ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
                      {tip.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tips;
