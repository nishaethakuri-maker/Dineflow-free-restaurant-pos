import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  ShieldCheck,
  Crown,
  UserCheck,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
} from 'lucide-react';

export const InitialSetupModal: React.FC = () => {
  const { isSetupWizardOpen, setIsSetupWizardOpen, completeInitialSetup, settings } = usePOS();

  const [step, setStep] = useState<1 | 2>(1);

  // Owner Form (Step 1)
  const [ownerName, setOwnerName] = useState<string>('Bimal Thapa');
  const [ownerEmail, setOwnerEmail] = useState<string>('owner@dineflow.com');
  const [ownerPassword, setOwnerPassword] = useState<string>('Owner@123');
  const [ownerPin, setOwnerPin] = useState<string>('1234');

  // Manager Form (Step 2)
  const [managerName, setManagerName] = useState<string>('Sushila Shrestha');
  const [managerEmail, setManagerEmail] = useState<string>('manager@dineflow.com');
  const [managerPassword, setManagerPassword] = useState<string>('Manager@123');
  const [managerPin, setManagerPin] = useState<string>('5678');

  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isSetupWizardOpen) return null;

  const handleStep1Next = () => {
    setErrorMsg('');
    if (!ownerName.trim()) {
      setErrorMsg('Owner full name is required.');
      return;
    }
    if (!ownerEmail.trim()) {
      setErrorMsg('Owner business email is required.');
      return;
    }
    if (ownerPassword.length < 6) {
      setErrorMsg('Owner secure password must be at least 6 characters.');
      return;
    }
    if (ownerPin.length !== 4) {
      setErrorMsg('Owner quick terminal PIN must be exactly 4 digits.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = () => {
    setErrorMsg('');
    if (!managerName.trim()) {
      setErrorMsg('Duty Manager name is required.');
      return;
    }
    if (managerPin.length !== 4) {
      setErrorMsg('Manager quick PIN must be exactly 4 digits.');
      return;
    }
    if (managerPin === ownerPin) {
      setErrorMsg('For security, Manager PIN cannot be identical to Owner PIN.');
      return;
    }

    completeInitialSetup(
      {
        name: ownerName.trim(),
        email: ownerEmail.trim(),
        password: ownerPassword,
        pin: ownerPin,
      },
      {
        name: managerName.trim(),
        email: managerEmail.trim(),
        password: managerPassword,
        pin: managerPin,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Initial Administrator Security Setup</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Prioritizing primary credentials for <strong>Owner</strong> & <strong>Manager</strong>{' '}
            for {settings.restaurantName}
          </p>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                step === 1
                  ? 'bg-purple-950 text-purple-300 border-purple-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Step 1: Owner Account</span>
            </div>
            <div className="w-4 h-0.5 bg-slate-800" />
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                step === 2
                  ? 'bg-blue-950 text-blue-300 border-blue-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Step 2: Manager Account</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: OWNER SETUP */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Owner Full Name:
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Bimal Thapa"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Owner Email (for secure login):
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@dineflow.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Master Password:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Quick Terminal PIN (4-Digits):
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              The Owner role has unconditional master control over all restaurant settings, financial
              reports, staff permissions, and database operations.
            </p>

            <button
              onClick={handleStep1Next}
              className="w-full mt-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              <span>Continue to Manager Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: MANAGER SETUP */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Duty Manager Full Name:
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="e.g. Sushila Shrestha"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Manager Email (optional):
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  placeholder="manager@dineflow.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Manager Password:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Manager Quick PIN (4-Digits):
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 5678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold tracking-widest text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              Managers are authorized to approve floor discounts, refunds, voids, and override
              kitchen cancellations during busy operating hours.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Credentials & Launch POS</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
