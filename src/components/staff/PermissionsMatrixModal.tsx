import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { RolePermissions, RolePermissionsMap, UserRole } from '../../types/pos';
import { DEFAULT_PERMISSIONS } from '../../db/sampleData';
import {
  Shield,
  Check,
  X,
  RotateCcw,
  Save,
  Lock,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface PermissionsMatrixModalProps {
  onClose: () => void;
}

export const PermissionsMatrixModal: React.FC<PermissionsMatrixModalProps> = ({ onClose }) => {
  const { settings, updateRolePermissions, showToast } = usePOS();

  // Local copy of permissions map for editing
  const [matrix, setMatrix] = useState<RolePermissionsMap>(() => ({
    ...DEFAULT_PERMISSIONS,
    ...(settings.permissions || {}),
  }));

  const permissionLabels: { key: keyof RolePermissions; label: string; desc: string }[] = [
    { key: 'canAccessPOS', label: 'Access POS Billing', desc: 'Create cart, punch orders' },
    { key: 'canAccessDashboard', label: 'View Dashboard Metrics', desc: 'View revenue & charts' },
    { key: 'canAccessTables', label: 'Manage Tables Floor', desc: 'Assign, move, merge tables' },
    { key: 'canAccessKDS', label: 'Access Kitchen Display (KDS)', desc: 'View & update cooking tickets' },
    { key: 'canAccessReports', label: 'Financial Reports & Analytics', desc: 'Audit sales, tax, export CSV' },
    { key: 'canAccessMenu', label: 'Menu Engineering & Pricing', desc: 'Add/edit dishes and prices' },
    { key: 'canAccessInventory', label: 'Inventory & Raw Materials', desc: 'Stock purchases, wastage' },
    { key: 'canAccessStaff', label: 'Staff Accounts & Roles', desc: 'Manage staff & PINs' },
    { key: 'canAccessSettings', label: 'Restaurant & Hardware Settings', desc: 'Tax, PAN, printer configs' },
    { key: 'canApplyDiscount', label: 'Apply Order Discounts', desc: 'Give % or fixed NPR discount' },
    { key: 'canCancelOrder', label: 'Cancel Active Orders', desc: 'Void orders with recorded reason' },
    { key: 'canRefundPayment', label: 'Refund Settled Bills', desc: 'Void completed invoices' },
    { key: 'canOverridePrices', label: 'Price Override', desc: 'Modify unit rates on checkout' },
    { key: 'canViewAuditLogs', label: 'View Security Audit Trail', desc: 'Inspect system action history' },
    { key: 'canBackupRestore', label: 'Backup & Restore Database', desc: 'Export / import JSON snapshots' },
  ];

  const roles: UserRole[] = ['owner', 'manager', 'cashier', 'waiter', 'kitchen'];

  const handleToggle = (role: UserRole, key: keyof RolePermissions) => {
    if (role === 'owner') return; // Owner always has all permissions
    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key],
      },
    }));
  };

  const handleSaveAll = () => {
    for (const r of roles) {
      if (r !== 'owner') {
        updateRolePermissions(r, matrix[r]);
      }
    }
    showToast('Role permissions matrix saved successfully!', 'success');
    onClose();
  };

  const handleResetDefaults = () => {
    setMatrix(DEFAULT_PERMISSIONS);
    showToast('Reset permissions matrix to restaurant industry defaults.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl text-white shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Role Permissions Matrix Configuration</h2>
              <p className="text-xs text-slate-400">
                Configure granular system access per staff role in DineFlow POS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold flex items-center gap-1.5 transition"
              title="Reset to recommended restaurant defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Permissions Table Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="p-3">Capability / Permission</th>
                <th className="p-3 text-center text-purple-400">Owner</th>
                <th className="p-3 text-center text-blue-400">Manager</th>
                <th className="p-3 text-center text-emerald-400">Cashier</th>
                <th className="p-3 text-center text-amber-400">Waiter</th>
                <th className="p-3 text-center text-rose-400">Kitchen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {permissionLabels.map((item) => (
                <tr key={item.key} className="hover:bg-slate-900/50 transition">
                  <td className="p-3">
                    <span className="font-bold text-white text-xs block">{item.label}</span>
                    <span className="text-[11px] text-slate-400">{item.desc}</span>
                  </td>

                  {/* Columns for each role */}
                  {roles.map((r) => {
                    const isEnabled = matrix[r][item.key];
                    const isOwner = r === 'owner';

                    return (
                      <td key={r} className="p-3 text-center">
                        <button
                          disabled={isOwner}
                          onClick={() => handleToggle(r, item.key)}
                          className={`w-7 h-7 rounded-xl mx-auto flex items-center justify-center transition border ${
                            isEnabled
                              ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30'
                              : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700'
                          } ${isOwner ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
                          title={
                            isOwner
                              ? 'Owner permissions are permanently enabled'
                              : `Toggle ${item.label} for ${r.toUpperCase()}`
                          }
                        >
                          {isEnabled ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Changes take effect immediately across all terminal stations</span>
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Matrix</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
