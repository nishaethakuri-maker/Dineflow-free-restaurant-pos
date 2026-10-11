import React, { useState, useMemo, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { KitchenStatus, Order } from '../../types/pos';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  Flame,
  Volume2,
  VolumeX,
  RefreshCw,
  Bell,
  Filter,
} from 'lucide-react';

export const KitchenDisplayScreen: React.FC = () => {
  const { orders, updateOrderKitchenStatus, updateItemKitchenStatus, settings } = usePOS();

  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'preparing' | 'ready'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Live timer tick every 10 seconds for elapsed indicators
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders relevant to kitchen (exclude cancelled and completed)
  const kitchenOrders = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'completed')
      .sort((a, b) => a.createdAt - b.createdAt); // Oldest first (FIFO)
  }, [orders]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return kitchenOrders;
    return kitchenOrders.filter((o) => {
      if (statusFilter === 'new') return o.status === 'active';
      return o.status === statusFilter;
    });
  }, [kitchenOrders, statusFilter]);

  const formatElapsed = (createdAt: number) => {
    const elapsedMinutes = Math.floor((currentTime - createdAt) / 60000);
    if (elapsedMinutes < 1) return '< 1m';
    if (elapsedMinutes < 60) return `${elapsedMinutes}m`;
    const hrs = Math.floor(elapsedMinutes / 60);
    return `${hrs}h ${elapsedMinutes % 60}m`;
  };

  const getUrgencyColor = (createdAt: number) => {
    const elapsed = (currentTime - createdAt) / 60000;
    if (elapsed > 20) return 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
    if (elapsed > 10) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-full pb-20 select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-400" />
            <span>Kitchen Display System (KDS)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Kitchen Order Tickets (KOT) with station progress & timer alerts
          </p>
        </div>

        {/* Audio Alert & Station Filter */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              soundEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Kitchen Order Bell"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>KOT Chime {soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Active Tickets: <strong className="text-amber-400">{kitchenOrders.length}</strong>
          </span>
        </div>
      </div>

      {/* Ticket Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
            statusFilter === 'all'
              ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-950/40'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Active ({kitchenOrders.length})
        </button>
        <button
          onClick={() => setStatusFilter('new')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
            statusFilter === 'new'
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-950/40'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          New Orders ({kitchenOrders.filter((o) => o.status === 'active').length})
        </button>
        <button
          onClick={() => setStatusFilter('preparing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
            statusFilter === 'preparing'
              ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-950/40'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Preparing ({kitchenOrders.filter((o) => o.status === 'preparing').length})
        </button>
        <button
          onClick={() => setStatusFilter('ready')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
            statusFilter === 'ready'
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Ready for Pickup ({kitchenOrders.filter((o) => o.status === 'ready').length})
        </button>
      </div>

      {/* Kitchen Ticket Cards Grid */}
      {filteredTickets.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center justify-center">
          <CheckCircle2 className="w-14 h-14 stroke-1 text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-white">All Kitchen Orders Cleared!</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            No pending tickets in the queue. New orders from cashiers or waiters will ring here
            instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTickets.map((ticket) => {
            const isNew = ticket.status === 'active';
            const isPreparing = ticket.status === 'preparing';
            const isReady = ticket.status === 'ready';

            return (
              <div
                key={ticket.id}
                className={`bg-slate-900 border rounded-3xl flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-200 ${
                  isNew
                    ? 'border-blue-500/60 shadow-blue-950/30'
                    : isPreparing
                    ? 'border-amber-500/60 shadow-amber-950/30'
                    : 'border-emerald-500/60 shadow-emerald-950/30'
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-4 border-b flex items-start justify-between ${
                    isNew
                      ? 'bg-blue-950/40 border-blue-800/40'
                      : isPreparing
                      ? 'bg-amber-950/40 border-amber-800/40'
                      : 'bg-emerald-950/40 border-emerald-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-white">
                        {ticket.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-700">
                        {ticket.orderType === 'dine-in'
                          ? ticket.tableName || 'Dine-In'
                          : ticket.orderType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Server: {ticket.waiterName}
                    </p>
                  </div>

                  {/* Elapsed Timer Pill */}
                  <div
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${getUrgencyColor(
                      ticket.createdAt
                    )}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatElapsed(ticket.createdAt)}</span>
                  </div>
                </div>

                {/* Ticket Items List */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-64">
                  {ticket.items.map((it) => {
                    const isItemReady = it.kitchenStatus === 'ready';
                    return (
                      <div
                        key={it.id}
                        className={`p-2.5 rounded-xl border transition ${
                          isItemReady
                            ? 'bg-slate-950/40 border-slate-800 opacity-60 line-through'
                            : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono font-black text-sm text-amber-400">
                              {it.quantity}x
                            </span>
                            <span className="font-bold text-xs text-white leading-snug">
                              {it.name}
                            </span>
                          </div>

                          {/* Quick item level mark ready */}
                          <button
                            onClick={() =>
                              updateItemKitchenStatus(
                                ticket.id,
                                it.id,
                                isItemReady ? 'preparing' : 'ready'
                              )
                            }
                            className={`p-1 rounded-lg border text-[10px] transition ${
                              isItemReady
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                            title="Toggle Item Prepared"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Cooking Notes Alert */}
                        {it.notes && (
                          <div className="mt-1.5 text-[11px] font-semibold text-rose-300 bg-rose-950/40 border border-rose-900/50 px-2 py-1 rounded-md">
                            ⚠️ Note: {it.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ticket Footer Action Buttons */}
                <div className="p-3 bg-slate-950 border-t border-slate-800">
                  {isNew && (
                    <button
                      onClick={() => updateOrderKitchenStatus(ticket.id, 'preparing')}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-950/40"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Preparing</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => updateOrderKitchenStatus(ticket.id, 'ready')}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950/40"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark All Ready for Pickup</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => updateOrderKitchenStatus(ticket.id, 'served')}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-emerald-800/60"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Served to Table</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
