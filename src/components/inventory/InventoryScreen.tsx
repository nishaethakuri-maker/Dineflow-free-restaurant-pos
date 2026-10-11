import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { InventoryItem } from '../../types/pos';
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  History,
  X,
  Check,
} from 'lucide-react';
import { posDb } from '../../db/storage';

export const InventoryScreen: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryStock, settings } = usePOS();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Stock In / Out Modal
  const [activeItemForAction, setActiveItemForAction] = useState<InventoryItem | null>(null);
  const [actionType, setActionType] = useState<'purchase' | 'wastage' | 'adjustment'>('purchase');
  const [actionQty, setActionQty] = useState<number>(1);
  const [actionReason, setActionReason] = useState<string>('');

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<string>('Meat');
  const [newItemStock, setNewItemStock] = useState<number>(10);
  const [newItemUnit, setNewItemUnit] = useState<string>('kg');
  const [newItemThreshold, setNewItemThreshold] = useState<number>(3);
  const [newItemCost, setNewItemCost] = useState<number>(200);

  // Stock movements
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const stockMovements = posDb.getStockMovements();

  const categories = Array.from(new Set(inventory.map((i) => i.category)));

  const filteredItems = inventory.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  const handleExecuteStockUpdate = () => {
    if (!activeItemForAction || actionQty <= 0) return;
    const delta = actionType === 'purchase' ? actionQty : -actionQty;
    updateInventoryStock(activeItemForAction.id, delta, actionType, actionReason);
    setActiveItemForAction(null);
    setActionQty(1);
    setActionReason('');
  };

  const handleCreateItem = () => {
    if (!newItemName.trim()) return;
    addInventoryItem({
      name: newItemName.trim(),
      category: newItemCategory,
      currentStock: newItemStock,
      unit: newItemUnit,
      minThreshold: newItemThreshold,
      costPerUnit: newItemCost,
    });
    setShowAddModal(false);
    setNewItemName('');
  };

  // Total inventory valuation (NPR)
  const totalValuation = inventory.reduce(
    (sum, it) => sum + it.currentStock * it.costPerUnit,
    0
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-full pb-20 select-none">
      {/* Title & Valuation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-400" />
            <span>Raw Ingredients & Stock Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic order recipe deduction, purchase tracking, and wastage logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span>Stock Movements Log</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* Valuation & Low Stock Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Inventory Value</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {settings.currencySymbol} {Math.round(totalValuation).toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            Rs.
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-400 font-medium">Tracked Ingredients</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {inventory.length} items
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-400 font-medium">Low Stock Alerts</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">
              {inventory.filter((i) => i.currentStock <= i.minThreshold).length} items
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search raw material name..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Ingredient Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Current Stock</th>
                <th className="p-4 text-right">Min Threshold</th>
                <th className="p-4 text-right">Cost / Unit</th>
                <th className="p-4 text-right">Total Value</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minThreshold;
                const itemValue = item.currentStock * item.costPerUnit;

                return (
                  <tr key={item.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span>{item.name}</span>
                    </td>
                    <td className="p-4 text-slate-400">{item.category}</td>
                    <td className="p-4 text-right font-mono font-bold text-sm">
                      <span className={isLow ? 'text-amber-400' : 'text-emerald-400'}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-400">
                      {item.minThreshold} {item.unit}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-300">
                      {settings.currencySymbol} {item.costPerUnit}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-200">
                      {settings.currencySymbol} {Math.round(itemValue).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isLow
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isLow ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setActiveItemForAction(item);
                            setActionType('purchase');
                            setActionQty(5);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px] flex items-center gap-1 transition"
                          title="Record Stock Purchase"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Buy</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveItemForAction(item);
                            setActionType('wastage');
                            setActionQty(1);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-semibold text-[11px] flex items-center gap-1 transition"
                          title="Record Wastage"
                        >
                          <ArrowDownRight className="w-3 h-3" />
                          <span>Waste</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Update / Purchase / Wastage Modal */}
      {activeItemForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Update Stock: {activeItemForAction.name}</span>
              </h3>
              <button
                onClick={() => setActiveItemForAction(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActionType('purchase')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                    actionType === 'purchase'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  + Purchase / In
                </button>
                <button
                  onClick={() => setActionType('wastage')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                    actionType === 'wastage'
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  - Wastage / Out
                </button>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Quantity ({activeItemForAction.unit}):
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={actionQty || ''}
                  onChange={(e) => setActionQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Reason / Supplier Note:</label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Fresh morning delivery / Expired item"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveItemForAction(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteStockUpdate}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Save Movement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold">Add New Raw Ingredient</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Ingredient Name:</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Mutton Keema, Tomato, Dairy Cream"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Category:</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Meat">Meat</option>
                    <option value="Grains & Flour">Grains & Flour</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Oils & Spices">Oils & Spices</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Unit:</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="ltr">Liters (ltr)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="packets">Packets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Opening Stock:</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Min Alert Qty:</label>
                  <input
                    type="number"
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Cost / Unit:</label>
                  <input
                    type="number"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateItem}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Save Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movements History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl text-white shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <span>Ingredient Stock Movement History</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {stockMovements.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  No stock movements recorded yet.
                </p>
              ) : (
                stockMovements.map((mov) => {
                  const invItem = inventory.find((i) => i.id === mov.inventoryItemId);
                  const isPositive = mov.quantity > 0;
                  return (
                    <div
                      key={mov.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{invItem?.name || 'Item'}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                              mov.type === 'purchase'
                                ? 'bg-emerald-950 text-emerald-400'
                                : mov.type === 'order_deduction'
                                ? 'bg-blue-950 text-blue-400'
                                : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {mov.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{mov.reason}</p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(mov.createdAt).toLocaleTimeString()} by {mov.performedBy}
                        </span>
                      </div>

                      <div className="text-right font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? '+' : ''}
                          {mov.quantity} {invItem?.unit}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
