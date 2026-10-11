import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { User, UserRole, AuditAction } from '../../types/pos';
import { PermissionsMatrixModal } from './PermissionsMatrixModal';
import {
  Users,
  Shield,
  KeyRound,
  Plus,
  Edit,
  History,
  CheckCircle2,
  X,
  FileText,
  UserCheck,
  Sliders,
  Mail,
  Lock,
  Download,
  Search,
  Filter,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const StaffManagementScreen: React.FC = () => {
  const {
    users,
    currentUser,
    updateStaff,
    addStaff,
    auditLogs,
    setIsSetupWizardOpen,
    showToast,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('waiter');
  const [pin, setPin] = useState<string>('0000');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Audit filter states
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditUserFilter, setAuditUserFilter] = useState<string>('all');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  const handleOpenAdd = () => {
    setName('');
    setRole('waiter');
    setPin(String(Math.floor(1000 + Math.random() * 8999)));
    setEmail('');
    setPassword('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingStaff(user);
    setName(user.name);
    setRole(user.role);
    setPin(user.pin);
    setEmail(user.email || '');
    setPassword(user.password || '');
  };

  const handleSaveAdd = () => {
    if (!name.trim() || pin.length !== 4) return;
    addStaff({
      name: name.trim(),
      role,
      pin,
      email: email.trim() || undefined,
      password: password.trim() || undefined,
      isActive: true,
    });
    setShowAddModal(false);
  };

  const handleSaveEdit = () => {
    if (!editingStaff || !name.trim() || pin.length !== 4) return;
    updateStaff({
      ...editingStaff,
      name: name.trim(),
      role,
      pin,
      email: email.trim() || undefined,
      password: password.trim() || undefined,
      failedPinAttempts: 0,
      lockoutUntil: undefined,
    });
    setEditingStaff(null);
  };

  const handleToggleActive = (user: User) => {
    if (user.id === currentUser?.id) return; // Prevent deactivating self
    updateStaff({
      ...user,
      isActive: !user.isActive,
    });
  };

  const handleUnlockAccount = (user: User) => {
    updateStaff({
      ...user,
      failedPinAttempts: 0,
      lockoutUntil: undefined,
    });
    showToast(`Unlocked account for ${user.name}`, 'success');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'manager':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cashier':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'waiter':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'kitchen':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditUserFilter !== 'all' && log.userId !== auditUserFilter) {
        return false;
      }
      if (auditActionFilter !== 'all' && log.action !== auditActionFilter) {
        return false;
      }
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase().trim();
        return (
          log.userName.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, auditUserFilter, auditActionFilter, auditSearch]);

  const handleExportAuditCSV = () => {
    const headers = ['Timestamp', 'Staff Name', 'Role', 'Action', 'Details', 'Device'];
    const rows = filteredAuditLogs.map((l) => [
      new Date(l.timestamp).toISOString(),
      l.userName,
      l.role,
      l.action,
      `"${l.details.replace(/"/g, '""')}"`,
      l.deviceInfo || 'Terminal',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DineFlow_Security_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit log exported to CSV', 'success');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-full pb-20 select-none">
      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Staff Accounts & Role Permissions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based access control (RBAC), 4-digit PIN security, and audit logs
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'staff' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              Staff Roster ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'audit' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
          </div>

          <button
            onClick={() => setShowPermissionsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            title="Configure Granular Role Permissions Matrix"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Permissions Matrix</span>
          </button>

          {activeTab === 'staff' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'staff' ? (
        /* Staff Cards Grid */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => {
              const isCurrent = currentUser?.id === user.id;
              const isLockedOut = user.lockoutUntil && Date.now() < user.lockoutUntil;

              return (
                <div
                  key={user.id}
                  className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between shadow-sm relative transition ${
                    isLockedOut
                      ? 'border-rose-500/50 bg-rose-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          <span>{user.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                              ACTIVE NOW
                            </span>
                          )}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border mt-1.5 ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>{user.pin}</span>
                      </div>
                    </div>

                    {/* Email / Credential badge */}
                    {user.email && (
                      <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">{user.email}</span>
                      </p>
                    )}

                    {/* Lockout status warning */}
                    {isLockedOut && (
                      <div className="mt-2 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Locked out (Failed attempts)</span>
                        </span>
                        <button
                          onClick={() => handleUnlockAccount(user)}
                          className="text-[10px] bg-rose-700 hover:bg-rose-600 px-2 py-0.5 rounded font-bold"
                        >
                          Unlock
                        </button>
                      </div>
                    )}

                    {/* Role Capabilities Quick View */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                      {user.role === 'owner' && (
                        <p>👑 Full Root: Master access over all financial & system settings</p>
                      )}
                      {user.role === 'manager' && (
                        <p>🛡️ Manager: Approve discounts, voids, refunds & reports</p>
                      )}
                      {user.role === 'cashier' && (
                        <p>💵 Cashier: Billing & payments (discounts require approval)</p>
                      )}
                      {user.role === 'waiter' && (
                        <p>🍽️ Waiter: Table ordering & KOT dispatch</p>
                      )}
                      {user.role === 'kitchen' && (
                        <p>👨‍🍳 Kitchen Staff: KDS cooking queue update only</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={isCurrent}
                      className={`text-[11px] font-semibold transition ${
                        user.isActive
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {user.isActive ? 'Active Staff' : 'Deactivated'}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Edit Staff PIN, Password & Role"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* AUDIT TRAIL LOGS TAB */
        <div className="space-y-4">
          {/* Audit Controls & Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit trail by keyword, staff, details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter by Staff */}
              <select
                value={auditUserFilter}
                onChange={(e) => setAuditUserFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300"
              >
                <option value="all">All Staff Members</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>

              {/* Filter by Action */}
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300"
              >
                <option value="all">All Actions</option>
                <option value="login_success">Logins (Success)</option>
                <option value="login_failed">Logins (Failed / Lockouts)</option>
                <option value="pin_login">Quick PIN Unlocks</option>
                <option value="discount_applied">Discounts</option>
                <option value="order_cancelled">Cancellations</option>
                <option value="payment_refunded">Refunds & Voids</option>
                <option value="bill_settled">Bill Settlements</option>
                <option value="permissions_updated">Permission Updates</option>
                <option value="initial_setup_completed">Initial Admin Setup</option>
              </select>

              <button
                onClick={handleExportAuditCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Staff Member</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Action Event</th>
                    <th className="p-3.5">Event Details</th>
                    <th className="p-3.5">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No audit log events found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const isAlertAction =
                        log.action === 'login_failed' ||
                        log.action === 'order_cancelled' ||
                        log.action === 'payment_refunded';

                      return (
                        <tr key={log.id} className="hover:bg-slate-850/50 transition">
                          <td className="p-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-3.5 font-bold text-white whitespace-nowrap">
                            {log.userName}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${getRoleBadge(
                                log.role
                              )}`}
                            >
                              {log.role}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`font-mono font-semibold text-[11px] ${
                                isAlertAction
                                  ? 'text-rose-400'
                                  : log.action === 'initial_setup_completed'
                                  ? 'text-purple-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300 max-w-md">{log.details}</td>
                          <td className="p-3.5 text-slate-500 font-mono text-[10px] uppercase whitespace-nowrap">
                            {log.deviceInfo || 'Terminal'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Matrix Modal */}
      {showPermissionsModal && (
        <PermissionsMatrixModal onClose={() => setShowPermissionsModal(false)} />
      )}

      {/* Edit / Add Staff Modal */}
      {(editingStaff || showAddModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold">
                {showAddModal ? 'Register New Staff Member' : `Edit Account: ${editingStaff?.name}`}
              </h3>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setShowAddModal(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Full Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Shrestha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Role & Privilege Tier:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="owner">Owner / Administrator (Full Access)</option>
                  <option value="manager">Manager (Discounts, Voids, Reports)</option>
                  <option value="cashier">Cashier (Billing & Settlements)</option>
                  <option value="waiter">Waiter (Floor Orders & Tables)</option>
                  <option value="kitchen">Kitchen Staff (KDS Display Only)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Terminal PIN (4-Digits):
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-center font-mono font-bold tracking-widest text-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Email (for login):
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="optional"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {(role === 'owner' || role === 'manager') && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Master Password (for password login):
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setShowAddModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleSaveAdd : handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Save Staff Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
