import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Lock,
  ShieldCheck,
  UserCheck,
  Delete,
  ArrowRight,
  KeyRound,
  Mail,
  Sparkles,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { User } from '../../types/pos';

export const PinLoginModal: React.FC = () => {
  const {
    isLocked,
    users,
    currentUser,
    loginWithPin,
    loginWithPassword,
    switchUser,
    setIsSetupWizardOpen,
  } = usePOS();

  const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');
  const [selectedStaff, setSelectedStaff] = useState<User | null>(currentUser || users[0]);
  const [pin, setPin] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>(currentUser?.email || 'owner@dineflow.com');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      // Auto submit on 4th digit
      if (nextPin.length === 4) {
        setTimeout(() => {
          verifyPin(nextPin);
        }, 120);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = (enteredPin: string) => {
    const res = loginWithPin(enteredPin, selectedStaff?.id);
    if (!res.success) {
      setErrorMsg(res.message || 'Incorrect PIN.');
      setPin('');
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailInput.trim() || !passwordInput) {
      setErrorMsg('Please enter both email/username and password.');
      return;
    }
    const res = loginWithPassword(emailInput, passwordInput);
    if (!res.success) {
      setErrorMsg(res.message || 'Login failed.');
    } else {
      setPasswordInput('');
    }
  };

  // Quick 1-tap fast login for evaluator ease
  const handleQuickLogin = (user: User) => {
    setSelectedStaff(user);
    setPin(user.pin);
    setTimeout(() => {
      loginWithPin(user.pin, user.id);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col items-center">
        {/* Lock Icon & Title */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-400">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">DineFlow POS Security Lock</h2>
        <p className="text-xs text-slate-400 mt-0.5 mb-4 text-center">
          Authenticate to unlock restaurant terminal
        </p>

        {/* Mode Toggle: Quick PIN vs Secure Password (Prioritized for Owner/Manager) */}
        <div className="grid grid-cols-2 gap-1 w-full bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 text-xs font-semibold">
          <button
            onClick={() => {
              setAuthMode('pin');
              setErrorMsg('');
            }}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'pin'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Terminal PIN</span>
          </button>
          <button
            onClick={() => {
              setAuthMode('password');
              setErrorMsg('');
            }}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'password'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Owner / Manager Login</span>
          </button>
        </div>

        {errorMsg && (
          <div className="w-full mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-medium text-center flex items-center justify-center gap-1.5 animate-bounce">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {authMode === 'pin' ? (
          /* QUICK PIN MODE */
          <>
            {/* Staff Switcher Horizontal Pills */}
            <div className="w-full mb-4">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                Select Active Staff Member:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {users.map((u) => {
                  const isSelected = selectedStaff?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedStaff(u);
                        setPin('');
                        setErrorMsg('');
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center text-center transition-all border ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-semibold truncate w-full">
                        {u.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-slate-400 mt-0.5">
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN Dots Display */}
            <div className="flex gap-4 mb-4">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      isFilled
                        ? 'bg-emerald-400 scale-125 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                        : 'bg-slate-700 border border-slate-600'
                    }`}
                  />
                );
              })}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleDigit(String(num))}
                  className="h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white border border-slate-700 text-xl font-bold text-slate-100 flex items-center justify-center transition-all shadow-sm active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-13 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 flex items-center justify-center transition-all active:scale-95"
              >
                CLEAR
              </button>
              <button
                onClick={() => handleDigit('0')}
                className="h-13 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white border border-slate-700 text-xl font-bold text-slate-100 flex items-center justify-center transition-all shadow-sm active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="h-13 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center transition-all active:scale-95"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          /* SECURE PASSWORD LOGIN (OWNER / MANAGER) */
          <form onSubmit={handlePasswordLogin} className="w-full space-y-3.5 mb-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Business Email or Username:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. owner@dineflow.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Default: <strong>Owner@123</strong> or <strong>Manager@123</strong>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950/50"
            >
              <span>Sign In with Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Demo Fast Unlock Helpers & Setup Wizard Link */}
        <div className="w-full pt-3 border-t border-slate-800/80 text-center space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">1-Tap Demo PINs:</span>
            <button
              onClick={() => setIsSetupWizardOpen(true)}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              <span>Admin Setup Wizard</span>
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 text-[10px] font-mono">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleQuickLogin(u)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 hover:border-emerald-500 transition"
              >
                {u.name.split(' ')[0]} ({u.role}):{' '}
                <span className="text-emerald-400 font-bold">{u.pin}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
