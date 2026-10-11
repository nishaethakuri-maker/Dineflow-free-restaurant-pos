import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { ProductCard } from './ProductCard';
import { CartDrawer } from './CartDrawer';
import {
  Search,
  Filter,
  Leaf,
  Drumstick,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface PosBillingScreenProps {
  onOpenPayment: () => void;
}

export const PosBillingScreen: React.FC<PosBillingScreenProps> = ({ onOpenPayment }) => {
  const { categories, menuItems, cartItems, cartGrandTotal, settings, deviceMode } = usePOS();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [showMobileCart, setShowMobileCart] = useState<boolean>(false);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category check
      if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
        return false;
      }
      // Food type filter
      if (foodTypeFilter === 'veg' && item.foodType !== 'veg') {
        return false;
      }
      if (foodTypeFilter === 'non-veg' && item.foodType === 'veg') {
        return false;
      }
      // Search query (matches name, nepali name, or item code)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesNepali = item.nameNepali?.toLowerCase().includes(q) || false;
        const matchesCode = item.code.toLowerCase().includes(q);
        return matchesName || matchesNepali || matchesCode;
      }
      return true;
    });
  }, [menuItems, selectedCategoryId, foodTypeFilter, searchQuery]);

  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItems]);

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Main Menu Panel (Left / Full on Phone) */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* Top Control Bar: Search & Veg/Non-Veg Filter Chips */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name or code (e.g. Momo, CHW-01)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Diet Filters: All, Veg Only, Non-Veg Only */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFoodTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                foodTypeFilter === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFoodTypeFilter('veg')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                foodTypeFilter === 'veg'
                  ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 shadow'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Veg</span>
            </button>
            <button
              onClick={() => setFoodTypeFilter('non-veg')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                foodTypeFilter === 'non-veg'
                  ? 'bg-rose-600/30 text-rose-400 border border-rose-500/50 shadow'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Drumstick className="w-3.5 h-3.5" />
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Horizontal Category Pill Bar */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-800/80 bg-slate-900/30 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategoryId === 'all'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🔥 All Menu ({menuItems.length})
          </button>
          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.categoryId === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dishes Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
              <Search className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-sm font-semibold">No menu items match your search</p>
              <p className="text-xs text-slate-600 mt-1">Try resetting the filter or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 pb-20 lg:pb-4">
              {filteredItems.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Floating Mobile Cart Bar (visible when deviceMode is phone or screen is small) */}
        <div className="lg:hidden p-3 bg-slate-900 border-t border-slate-800 fixed bottom-0 left-0 right-0 z-20">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-emerald-950/60"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>View Order Cart ({totalCartCount} items)</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-black text-base">
              <span>{settings.currencySymbol} {cartGrandTotal.toLocaleString()}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Right Cart Panel */}
      <div className="hidden lg:block w-80 xl:w-96 h-full shrink-0">
        <CartDrawer onOpenPayment={onOpenPayment} />
      </div>

      {/* Mobile Cart Overlay (for Phone mode) */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="p-3 bg-slate-900 flex justify-between items-center border-b border-slate-800 text-white">
            <span className="font-bold text-sm">Order Cart</span>
            <button
              onClick={() => setShowMobileCart(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
            >
              Back to Menu
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CartDrawer
              onOpenPayment={() => {
                setShowMobileCart(false);
                onOpenPayment();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
