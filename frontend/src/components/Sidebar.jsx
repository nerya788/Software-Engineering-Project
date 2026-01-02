import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Armchair, 
  Store, 
  Lightbulb, 
  Settings, 
  LogOut,
  Heart
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Sidebar = ({ currentUser, onLogout, mainEventId }) => {
  // פונקציית עזר ליצירת לינקים דינמיים לאירוע הראשי
  const eventLink = (suffix) => mainEventId ? `/events/${mainEventId}/${suffix}` : '/';

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'מרכז בקרה' },
    { to: eventLink('guests'), icon: Users, label: 'ניהול מוזמנים' },
    { to: eventLink('seating'), icon: Armchair, label: 'סידורי הושבה' },
    { to: '/vendors', icon: Store, label: 'ספקים ונותני שירות' },
    { to: '/tips', icon: Lightbulb, label: 'טיפים ורעיונות' },
    { to: '/settings', icon: Settings, label: 'הגדרות מערכת' },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col h-full transition-all duration-300 z-50">
      
      {/* --- Header / Logo --- */}
      <div className="p-8 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl text-white shadow-lg shadow-purple-200 dark:shadow-none">
            <Heart size={20} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
              Wedding<span className="text-purple-600">Planner</span>
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              מערכת ניהול
            </span>
          </div>
        </div>
      </div>

      {/* --- Navigation --- */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">תפריט</p>
        
        {menuItems.map((item) => (
          <NavLink 
            key={item.label}
            to={item.to} 
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold text-sm
              ${isActive 
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-white'}
            `}
          >
            <item.icon size={20} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* --- Footer / User Profile --- */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ערכת נושא</span>
            <ThemeToggle />
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition hover:shadow-md group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white dark:ring-gray-700">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {currentUser?.full_name}
            </p>
            <button 
                onClick={onLogout}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
            >
               <LogOut size={12} /> התנתק
            </button>
          </div>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;