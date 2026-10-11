import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Bluetooth,
  Battery,
  Lock,
  User as UserIcon,
  Tablet,
  Smartphone,
  Maximize2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../../context/POSContext';

export const AndroidSystemBar: React.FC = () => {
  const { currentUser, logoutOrLock, deviceMode, setDeviceMode, settings } = usePOS();
  const [time, setTime] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-300 px-4 py-1.5 flex items-center justify-between text-xs font-mono select-none z-30">
      {/* Left: Brand + Time */}
      <div className="flex items-center gap-3">
        <span className="font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          DineFlow POS
        </span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-300 font-semibold">{time}</span>
        <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
          Android 15 POS Edition
        </span>
      </div>

      {/* Middle: Device Form Factor Switcher */}
      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setDeviceMode('tablet')}
          title="Tablet Counter POS Mode (10.1-inch Landscape)"
          className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-sans transition-all ${
            deviceMode === 'tablet'
              ? 'bg-emerald-600 text-white font-medium shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tablet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tablet POS</span>
        </button>
        <button
          onClick={() => setDeviceMode('phone')}
          title="Waiter Handheld Phone Mode (6.7-inch Portrait)"
          className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-sans transition-all ${
            deviceMode === 'phone'
              ? 'bg-emerald-600 text-white font-medium shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mobile Phone</span>
        </button>
        <button
          onClick={() => setDeviceMode('fullscreen')}
          title="Full Screen POS View"
          className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-sans transition-all ${
            deviceMode === 'fullscreen'
              ? 'bg-emerald-600 text-white font-medium shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edge-to-Edge</span>
        </button>
      </div>

      {/* Right: Hardware Signals + Current Staff + Lock */}
      <div className="flex items-center gap-3">
        {/* Printer status indicator */}
        <div
          className="hidden sm:flex items-center gap-1 text-slate-400"
          title={`Thermal Printer: ${settings.printer.printerName} (${settings.printer.paperWidth})`}
        >
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 hidden lg:inline">
            {settings.printer.paperWidth} ESC/POS
          </span>
        </div>

        {/* Connectivity */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span title={isOnline ? 'Offline-First Engine Active (Local Room DB)' : 'Working Offline'}>
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
          </span>
          <span title="Bluetooth Thermal Printer Ready">
            <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
          </span>
          <div className="flex items-center gap-0.5 text-emerald-400">
            <Battery className="w-3.5 h-3.5" />
            <span className="text-[10px]">98%</span>
          </div>
        </div>

        {/* Current Staff */}
        {currentUser && (
          <button
            onClick={logoutOrLock}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-md transition-all border border-slate-700"
            title="Tap to Lock Terminal or Switch Staff"
          >
            <UserIcon className="w-3 h-3 text-emerald-400" />
            <span className="font-sans font-medium text-xs max-w-[90px] truncate">
              {currentUser.name.split(' ')[0]}
            </span>
            <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              {currentUser.role}
            </span>
            <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const AndroidSoftNav: React.FC<{ onBack?: () => void; onHome?: () => void }> = ({
  onBack,
  onHome,
}) => {
  return (
    <div className="bg-black/90 py-1.5 flex items-center justify-center gap-16 border-t border-slate-800 text-slate-400 select-none">
      {/* Android Back button: triangle pointing left */}
      <button
        onClick={onBack}
        className="p-1 hover:text-white transition active:scale-90"
        title="Android Back"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>

      {/* Android Home button: circle */}
      <button
        onClick={onHome}
        className="p-1 hover:text-white transition active:scale-90"
        title="Android Home"
      >
        <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
      </button>

      {/* Android Overview button: rounded square */}
      <button
        onClick={onHome}
        className="p-1 hover:text-white transition active:scale-90"
        title="Android Recents"
      >
        <div className="w-3 h-3 rounded-xs border-2 border-current" />
      </button>
    </div>
  );
};
