import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { RestaurantSettings } from '../../types/pos';
import { AndroidProjectExporter } from './AndroidProjectExporter';
import {
  Settings,
  Building2,
  Receipt,
  Printer,
  Database,
  Save,
  RotateCcw,
  Download,
  Upload,
  Percent,
  CheckCircle2,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetDatabase,
    exportDatabase,
    importDatabase,
    showToast,
  } = usePOS();

  // Local state for settings form
  const [formData, setFormData] = useState<RestaurantSettings>({ ...settings });
  const [importJson, setImportJson] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  const handleSave = () => {
    updateSettings(formData);
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DineFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Offline database backup exported as JSON!', 'success');
  };

  const handleExecuteImport = () => {
    if (!importJson.trim()) return;
    const ok = importDatabase(importJson.trim());
    if (ok) {
      setShowImportModal(false);
      setImportJson('');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-full pb-20 select-none">
      {/* Title & Save */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            <span>Restaurant & Hardware Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Branding, Nepal PAN/VAT tax compliance, ESC/POS printer hardware, and backups
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Restaurant Profile & Legal Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Restaurant Profile & Tax Identity</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Restaurant Name:</label>
              <input
                type="text"
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Nepali Name (Optional):
              </label>
              <input
                type="text"
                value={formData.restaurantNameNepali || ''}
                onChange={(e) => setFormData({ ...formData, restaurantNameNepali: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tagline / Slogan:</label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Address:</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Contact Phone:</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  PAN / VAT Number:
                </label>
                <input
                  type="text"
                  value={formData.panVatNumber}
                  onChange={(e) => setFormData({ ...formData, panVatNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Currency Symbol:</label>
                <select
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                >
                  <option value="Rs.">Rs. (Nepalese Rupees)</option>
                  <option value="NPR">NPR</option>
                  <option value="रु">रु (Nepali Script)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Taxes & Service Charge Rules */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-400" />
            <span>Taxes & Service Charge Calculations</span>
          </h2>

          <div className="space-y-4">
            {/* Service Charge Switch */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">Enable Service Charge</h4>
                  <p className="text-[11px] text-slate-400">
                    Apply optional restaurant hospitality service charge
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableServiceCharge}
                  onChange={(e) =>
                    setFormData({ ...formData, enableServiceCharge: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {formData.enableServiceCharge && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Service Charge Rate (%):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.serviceChargeRate * 100}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serviceChargeRate: Number(e.target.value) / 100,
                      })
                    }
                    className="w-28 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-white"
                  />
                </div>
              )}
            </div>

            {/* VAT Switch */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">Enable VAT (Value Added Tax)</h4>
                  <p className="text-[11px] text-slate-400">
                    Nepal Inland Revenue Department 13% statutory tax
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableVat}
                  onChange={(e) => setFormData({ ...formData, enableVat: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {formData.enableVat && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">VAT Rate (%):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vatRate * 100}
                    onChange={(e) =>
                      setFormData({ ...formData, vatRate: Number(e.target.value) / 100 })
                    }
                    className="w-28 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-mono text-white"
                  />
                </div>
              )}
            </div>

            {/* Inventory Policy */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-white">Auto-Deduct Raw Ingredients</h4>
                <p className="text-[11px] text-slate-400">
                  Deduct recipe raw ingredients as soon as KDS marks food served
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.autoDeductInventoryOnServe}
                onChange={(e) =>
                  setFormData({ ...formData, autoDeductInventoryOnServe: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Hardware Printer Setup */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Thermal ESC/POS Printer Hardware</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Thermal Printer Name:</label>
              <input
                type="text"
                value={formData.printer.printerName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    printer: { ...formData.printer, printerName: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Paper Roll Width:</label>
                <select
                  value={formData.printer.paperWidth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      printer: {
                        ...formData.printer,
                        paperWidth: e.target.value as '58mm' | '80mm',
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="58mm">58 mm (Mobile Handheld)</option>
                  <option value="80mm">80 mm (Counter POS Terminal)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Connection Port:</label>
                <select
                  value={formData.printer.connectionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      printer: {
                        ...formData.printer,
                        connectionType: e.target.value as 'bluetooth' | 'network' | 'usb',
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="bluetooth">Bluetooth (Android standard)</option>
                  <option value="network">Network LAN / WiFi</option>
                  <option value="usb">USB OTG Cable</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-300">Auto-Print Receipt on Bill Settlement:</span>
              <input
                type="checkbox"
                checked={formData.printer.autoPrintReceiptOnSettle}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    printer: {
                      ...formData.printer,
                      autoPrintReceiptOnSettle: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Offline Backup & Database Recovery */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Database Backup, Restore & Reset</span>
          </h2>

          <p className="text-xs text-slate-400">
            DineFlow POS stores all records in an offline-first Room database equivalent. You can
            export a complete JSON snapshot or restore previous records at any time.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleExportBackup}
              className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export JSON Backup</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Restore from Backup</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={resetDatabase}
              className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database to Authentic Nepali Sample Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Native Android Project Exporter Section */}
      <AndroidProjectExporter />

      {/* Restore JSON Backup Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg text-white shadow-2xl">
            <h3 className="text-sm font-bold mb-2">Paste Database Backup JSON</h3>
            <p className="text-xs text-slate-400 mb-3">
              Paste the exported JSON backup file content below to restore all tables, items, and
              orders:
            </p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={8}
              placeholder='{"version": "1.0", ...}'
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteImport}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Restore Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
