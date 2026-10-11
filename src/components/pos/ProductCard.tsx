import React, { useState } from 'react';
import { MenuItem, MenuItemVariant } from '../../types/pos';
import { usePOS } from '../../context/POSContext';
import { Plus, Check, ChevronDown } from 'lucide-react';

interface ProductCardProps {
  item: MenuItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const { addToCart, settings } = usePOS();
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | undefined>(
    item.hasVariants && item.variants ? item.variants[0] : undefined
  );
  const [showVariants, setShowVariants] = useState<boolean>(false);

  const currentPrice = item.price + (selectedVariant ? selectedVariant.priceDifference : 0);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    addToCart(item, selectedVariant);
  };

  return (
    <div
      onClick={handleAdd}
      className={`group relative flex flex-col justify-between bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer select-none ${
        item.isAvailable
          ? 'border-slate-800 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-950/20 active:scale-[0.98]'
          : 'border-slate-800/40 opacity-55 grayscale cursor-not-allowed'
      }`}
    >
      {/* Item Image with Food Type Badge */}
      <div className="relative h-28 sm:h-32 w-full bg-slate-950 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-2xl font-bold">
            🍽️
          </div>
        )}

        {/* Veg / Non-Veg Indicator Badge (Traditional South Asian Green Square vs Red Triangle) */}
        <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md p-1 rounded-md border border-slate-700/60 shadow">
          {item.foodType === 'veg' ? (
            <div className="w-3.5 h-3.5 border-2 border-emerald-500 rounded-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 border-2 border-rose-500 rounded-sm flex items-center justify-center">
              <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-500" />
            </div>
          )}
        </div>

        {/* Item Code Badge */}
        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-slate-700/60">
          {item.code}
        </div>

        {/* Availability status */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
            <span className="bg-rose-500/20 text-rose-300 text-[11px] font-bold px-2 py-1 rounded-md border border-rose-500/30">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition">
              {item.name}
            </h3>
          </div>
          {item.nameNepali && (
            <p className="text-[11px] text-slate-400 font-sans line-clamp-1">{item.nameNepali}</p>
          )}
          {item.description && (
            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
          )}
        </div>

        {/* Variant Selector (if item has variants like Steam / Fried / C-Momo) */}
        {item.hasVariants && item.variants && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowVariants(!showVariants);
            }}
            className="relative"
          >
            <div className="flex items-center justify-between px-2 py-1 bg-slate-800 rounded-lg text-[10px] text-slate-300 border border-slate-700 hover:border-slate-600 transition">
              <span className="font-medium truncate">{selectedVariant?.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1 shrink-0" />
            </div>

            {showVariants && (
              <div className="absolute left-0 bottom-full mb-1 w-full bg-slate-850 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVariant(v);
                      setShowVariants(false);
                    }}
                    className={`w-full px-2 py-1.5 text-left text-[10px] flex items-center justify-between transition ${
                      selectedVariant?.id === v.id
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{v.name}</span>
                    <span className="font-mono text-[9px] opacity-80">
                      {v.priceDifference > 0 ? `+${v.priceDifference}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price & Add to Cart Button */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <div className="text-sm sm:text-base font-bold font-mono text-emerald-400">
            {settings.currencySymbol} {currentPrice}
          </div>

          <button
            onClick={handleAdd}
            disabled={!item.isAvailable}
            className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex items-center justify-center transition shadow shadow-emerald-950/40 disabled:opacity-40"
            title="Add to order cart"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
