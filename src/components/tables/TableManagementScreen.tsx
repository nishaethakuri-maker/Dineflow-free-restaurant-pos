import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { RestaurantTable, TableStatus } from '../../types/pos';
import {
  LayoutGrid,
  Users,
  Clock,
  ArrowRightLeft,
  Merge,
  Split,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  UtensilsCrossed,
} from 'lucide-react';

interface TableManagementScreenProps {
  onNavigateToPOS: () => void;
  onOpenPaymentForOrder?: (orderId: string) => void;
}

export const TableManagementScreen: React.FC<TableManagementScreenProps> = ({
  onNavigateToPOS,
}) => {
  const {
    tables,
    orders,
    setSelectedTable,
    setActiveOrderType,
    loadOrderIntoCart,
    clearCart,
    moveTableOrder,
    mergeTableOrders,
    settings,
  } = usePOS();

  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [activeTableDetail, setActiveTableDetail] = useState<RestaurantTable | null>(null);

  // Transfer / Move modal
  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [targetMoveTableId, setTargetMoveTableId] = useState<string>('');

  // Merge modal
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [targetMergeTableId, setTargetMergeTableId] = useState<string>('');

  // Sections
  const sections = Array.from(new Set(tables.map((t) => t.section)));

  const filteredTables = tables.filter((t) => {
    if (selectedSection === 'all') return true;
    return t.section === selectedSection;
  });

  const getTableOrder = (table: RestaurantTable) => {
    if (!table.currentOrderId) return null;
    return orders.find((o) => o.id === table.currentOrderId) || null;
  };

  const handleTableClick = (table: RestaurantTable) => {
    setActiveTableDetail(table);
  };

  const handleStartOrder = (table: RestaurantTable) => {
    clearCart();
    setSelectedTable(table);
    setActiveOrderType('dine-in');
    setActiveTableDetail(null);
    onNavigateToPOS();
  };

  const handleOpenActiveOrder = (table: RestaurantTable) => {
    if (!table.currentOrderId) return;
    loadOrderIntoCart(table.currentOrderId);
    setActiveTableDetail(null);
    onNavigateToPOS();
  };

  const handleExecuteMove = () => {
    if (!activeTableDetail || !targetMoveTableId) return;
    const success = moveTableOrder(activeTableDetail.id, targetMoveTableId);
    if (success) {
      setShowMoveModal(false);
      setActiveTableDetail(null);
    }
  };

  const handleExecuteMerge = () => {
    if (!activeTableDetail || !targetMergeTableId) return;
    const success = mergeTableOrders(activeTableDetail.id, targetMergeTableId);
    if (success) {
      setShowMergeModal(false);
      setActiveTableDetail(null);
    }
  };

  // Helper for elapsed time format
  const formatElapsed = (ms?: number) => {
    if (!ms) return '';
    const mins = Math.floor((Date.now() - ms) / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-full pb-20 select-none">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-emerald-400" />
            <span>Table Floor Layout</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time table occupancy, transfers, and bill merging
          </p>
        </div>

        {/* Status Legend Pills */}
        <div className="flex items-center gap-2 text-[11px] font-semibold flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Available ({tables.filter((t) => t.status === 'available').length})
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Occupied ({tables.filter((t) => t.status === 'occupied').length})
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/80 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Reserved ({tables.filter((t) => t.status === 'reserved').length})
          </span>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedSection('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
            selectedSection === 'all'
              ? 'bg-emerald-600 border-emerald-500 text-white shadow'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Areas ({tables.length})
        </button>
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setSelectedSection(sec)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedSection === sec
                ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {sec} ({tables.filter((t) => t.section === sec).length})
          </button>
        ))}
      </div>

      {/* Visual Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'occupied';
          const runningOrder = getTableOrder(table);

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`p-4 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-40 shadow-sm relative group active:scale-95 ${
                isOccupied
                  ? 'bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-500/50 hover:border-amber-400 shadow-amber-950/20'
                  : 'bg-slate-900 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-850'
              }`}
            >
              {/* Header: Table Number & Capacity */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black font-mono text-white tracking-wider">
                    {table.tableNumber}
                  </h3>
                  <span className="text-[10px] text-slate-500 block truncate max-w-[90px]">
                    {table.section}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{table.capacity}</span>
                </div>
              </div>

              {/* Status & Financial Details */}
              <div className="mt-auto">
                {isOccupied && runningOrder ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-300">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {settings.currencySymbol} {runningOrder.grandTotal.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatElapsed(table.occupiedSince)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {runningOrder.items.length} items &bull; #{runningOrder.orderNumber}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                    <span>Available</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Detail Bottom Sheet / Modal */}
      {activeTableDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono">{activeTableDetail.tableNumber}</h2>
                  <span
                    className={`text-xs uppercase font-bold px-2 py-0.5 rounded-full ${
                      activeTableDetail.status === 'occupied'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {activeTableDetail.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTableDetail.section} &bull; Capacity: {activeTableDetail.capacity} Guests
                </p>
              </div>

              <button
                onClick={() => setActiveTableDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Occupied, Show Order Details */}
            {activeTableDetail.status === 'occupied' && activeTableDetail.currentOrderId ? (
              <div className="space-y-4 mb-6">
                {(() => {
                  const order = orders.find((o) => o.id === activeTableDetail.currentOrderId);
                  if (!order) return <p className="text-xs text-slate-500">Order not found.</p>;

                  return (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Order Ref:</span>
                        <span className="text-emerald-400 font-bold">{order.orderNumber}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Waiter:</span>
                        <span className="text-slate-200">{order.waiterName}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Dining Duration:</span>
                        <span className="text-slate-200 font-mono">
                          {formatElapsed(activeTableDetail.occupiedSince)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium">Running Items:</span>
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span>
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-mono text-slate-400">
                              {settings.currencySymbol} {it.unitPrice * it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                        <span>Running Total:</span>
                        <span className="font-mono text-emerald-400">
                          {settings.currencySymbol} {order.grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Occupied Action Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleOpenActiveOrder(activeTableDetail)}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition"
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Modify Cart</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMoveModal(true);
                      setTargetMoveTableId('');
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition border border-slate-700"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                    <span>Move Table</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMergeModal(true);
                      setTargetMergeTableId('');
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition border border-slate-700"
                  >
                    <Merge className="w-4 h-4 text-amber-400" />
                    <span>Merge Bills</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Available Table Actions */
              <div className="space-y-4 mb-4">
                <p className="text-xs text-slate-400">
                  This table is currently clean and ready for seated guests.
                </p>
                <button
                  onClick={() => handleStartOrder(activeTableDetail)}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Order for {activeTableDetail.tableNumber}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Move Table Modal */}
      {showMoveModal && activeTableDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              Transfer Order from {activeTableDetail.tableNumber}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select an available target table to move this active dining session:
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
              {tables
                .filter((t) => t.status === 'available')
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTargetMoveTableId(t.id)}
                    className={`p-2.5 rounded-xl text-xs font-bold font-mono border transition ${
                      targetMoveTableId === t.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.tableNumber}
                  </button>
                ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowMoveModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!targetMoveTableId}
                onClick={handleExecuteMove}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold hover:bg-blue-500"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Tables Modal */}
      {showMergeModal && activeTableDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Merge className="w-4 h-4 text-amber-400" />
              Merge Bills into {activeTableDetail.tableNumber}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Select another occupied table to merge its running items into this bill:
            </p>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {tables
                .filter((t) => t.status === 'occupied' && t.id !== activeTableDetail.id)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTargetMergeTableId(t.id)}
                    className={`w-full p-2.5 rounded-xl text-xs flex justify-between items-center border transition ${
                      targetMergeTableId === t.id
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-mono font-bold">{t.tableNumber}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Total: {settings.currencySymbol} {t.currentOrderTotal}
                    </span>
                  </button>
                ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowMergeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!targetMergeTableId}
                onClick={handleExecuteMerge}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold hover:bg-amber-500"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
