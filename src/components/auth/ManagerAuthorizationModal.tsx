import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { ShieldAlert, KeyRound, CheckCircle2, X, Lock } from 'lucide-react';
import { User } from '../../types/pos';

interface ManagerAuthorizationModalProps {
  actionTitle: string;
  actionDescription: string;
  onAuthorized: (manager: User) => void;
  onCancel: () => void;
}

export const ManagerAuthorizationModal: React.FC<ManagerAuthorizationModalProps> = ({
  actionTitle,
  actionDescription,
  onAuthorized,
  onCancel,
}) => {
  const { verifyManagerPin, currentUser } = usePOS();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleVerify = () => {
    setErrorMsg('');
    if (pin.length !== 4) {
      setErrorMsg('Please enter a 4-digit PIN.');
      return;
    }

    const res = verifyManagerPin(pin, actionTitle);
    if (res.success && res.user) {
      onAuthorized(res.user);
    } else {
      setErrorMsg(res.message || 'Authorization failed. Owner or Manager PIN required.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2.5 text-amber-400">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Manager Override Required</h3>
              <span className="text-[10px] text-amber-400 font-medium">{actionTitle}</span>
            </div>
          </div>

          <button onClick={onCancel} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          {actionDescription}. Current user (<strong>{currentUser?.name}</strong> -{' '}
          <span className="uppercase">{currentUser?.role}</span>) requires authorization from an
          active <strong>Manager</strong> or <strong>Owner</strong>.
        </p>

        {errorMsg && (
          <div className="mb-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium animate-bounce">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Manager / Owner 4-Digit PIN:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 5678 (Manager) or 1234 (Owner)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-base text-center font-mono font-bold tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md shadow-amber-950/40"
          >
            Authorize Action
          </button>
        </div>
      </div>
    </div>
  );
};
