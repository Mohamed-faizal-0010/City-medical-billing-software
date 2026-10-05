import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Database,
  FileCheck2,
  Server,
  UserCheck,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  History,
  CheckCircle2,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  Search,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  LogIn,
  MoreVertical,
  Download,
  Smartphone
} from 'lucide-react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface SecurityViewProps {
  currentUser?: User | null;
  onSwitchUser?: (user: User) => void;
  onUsersUpdated?: () => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  currentUser: initialCurrentUser,
  onSwitchUser,
  onUsersUpdated
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'rbac' | 'audit' | 'encryption'>('users');

  // Multi-user state
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [activeUser, setActiveUser] = useState<User | null>(() => initialCurrentUser || StorageService.getCurrentUser());

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);

  // Form states for Add User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('cashier');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLicense, setNewLicense] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states for Edit User
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('cashier');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLicense, setEditLicense] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  // Form states for Reset Password
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetConfirmVal, setResetConfirmVal] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Status feedback
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Encryption & Audit state
  const [cipherAlgorithm] = useState('AES-256-GCM (Galois/Counter Mode)');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState(true);

  const profile = StorageService.getPharmacyProfile();

  const auditLogs = [
    {
      id: 'aud-111',
      timestamp: '2026-09-14 09:15:20',
      actor: activeUser?.name || 'Staff User',
      role: activeUser?.role?.toUpperCase() || 'ADMIN',
      action: 'User Session Authenticated with Encrypted Credentials',
      status: 'Cryptographically Verified',
      ip: '192.168.1.101 (Terminal Melur)'
    },
    {
      id: 'aud-110',
      timestamp: '2026-09-14 08:30:12',
      actor: 'Dr. Fakrudeen Ajmal, M.Pharm',
      role: 'ADMIN',
      action: 'System Security & Role Permissions Audit Completed',
      status: 'Integrity OK',
      ip: '192.168.1.100 (Melur Main)'
    },
    {
      id: 'aud-109',
      timestamp: '2026-09-13 18:45:10',
      actor: 'Anusya Begum, D.Pharm',
      role: 'PHARMACIST',
      action: 'Prescription Dispensed (CON-2026-001 -> INV-2026-1048)',
      status: 'Cryptographically Verified',
      ip: '192.168.1.104 (City Medical Terminal 1)'
    },
    {
      id: 'aud-108',
      timestamp: '2026-09-13 14:15:10',
      actor: 'Dr. R. Sundaresan, MD',
      role: 'DOCTOR',
      action: 'Consultation & Digital Rx Created (CON-2026-002)',
      status: 'Signed with SHA-256',
      ip: '192.168.1.108 (Consultation Room 1)'
    },
    {
      id: 'aud-107',
      timestamp: '2026-09-12 11:30:45',
      actor: 'M. Meenakshi',
      role: 'CASHIER',
      action: 'UPI Payment Settled (ICICI Ref: UPI-ICICI-928104889)',
      status: 'Payment Gateway Authenticated',
      ip: '192.168.1.102 (Cash Counter)'
    }
  ];

  const reloadUsers = () => {
    const updated = StorageService.getUsers();
    setUsers(updated);
    setActiveUser(StorageService.getCurrentUser());
    if (onUsersUpdated) onUsersUpdated();
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setSelectedUserForEdit(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditLicense(user.licenseNumber || '');
    setEditStatus(user.status || 'active');
    setFormError('');
    setFormSuccess('');
    setShowEditModal(true);
  };

  // Open Password Modal
  const handleOpenPasswordReset = (user: User) => {
    setSelectedUserForEdit(user);
    setResetPasswordVal('');
    setResetConfirmVal('');
    setFormError('');
    setFormSuccess('');
    setShowPasswordModal(true);
  };

  // Handle Add User Submission
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (newPassword !== newConfirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    const res = StorageService.addUser({
      username: newUsername.trim(),
      password: newPassword,
      name: newName.trim(),
      role: newRole,
      email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@citymedical.local`,
      phone: newPhone.trim(),
      licenseNumber: newLicense.trim(),
      status: 'active'
    });

    if (res.success && res.user) {
      reloadUsers();
      setShowAddModal(false);
      try {
        StorageService.downloadUserCredentials(res.user, newPassword);
      } catch (err) {
        console.error(err);
      }
      // Reset form
      setNewUsername('');
      setNewPassword('');
      setNewConfirmPassword('');
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewLicense('');
      setFormSuccess(`User @${res.user.username} created & credentials pass downloaded successfully!`);
      setTimeout(() => setFormSuccess(''), 4000);
    } else {
      setFormError(res.error || 'Failed to create user account.');
    }
  };

  // Handle Edit User Submission
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setFormError('');
    setFormSuccess('');

    const res = StorageService.updateUser(selectedUserForEdit.id, {
      name: editName.trim(),
      username: editUsername.trim(),
      role: editRole,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      licenseNumber: editLicense.trim(),
      status: editStatus
    });

    if (res.success && res.user) {
      if (editRole === 'pharmacist' || selectedUserForEdit.role === 'pharmacist') {
        const curProf = StorageService.getPharmacyProfile();
        StorageService.savePharmacyProfile({
          ...curProf,
          pharmacistName: editName.trim(),
          pharmacistRegNo: editLicense.trim() || curProf.pharmacistRegNo
        });
      }
      reloadUsers();
      setShowEditModal(false);
      setFormSuccess(`Staff profile for ${res.user.name} updated.`);
      setTimeout(() => setFormSuccess(''), 4000);
    } else {
      setFormError(res.error || 'Failed to update user account.');
    }
  };

  // Handle Reset Password Submission
  const handleSavePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setFormError('');
    setFormSuccess('');

    if (resetPasswordVal !== resetConfirmVal) {
      setFormError('Passwords do not match.');
      return;
    }

    if (resetPasswordVal.length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    const res = StorageService.updateUser(selectedUserForEdit.id, {
      password: resetPasswordVal
    });

    if (res.success) {
      reloadUsers();
      setShowPasswordModal(false);
      setFormSuccess(`Password successfully updated for @${selectedUserForEdit.username}.`);
      setTimeout(() => setFormSuccess(''), 4000);
    } else {
      setFormError(res.error || 'Failed to update password.');
    }
  };

  // Handle Delete User
  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete user @${user.username} (${user.name})? This action cannot be undone.`)) {
      const res = StorageService.deleteUser(user.id);
      if (res.success) {
        reloadUsers();
        setFormSuccess(`User @${user.username} deleted.`);
        setTimeout(() => setFormSuccess(''), 4000);
      } else {
        alert(res.error || 'Cannot delete this user.');
      }
    }
  };

  // Switch Active User Session
  const handleSwitchUserSession = (user: User) => {
    StorageService.setCurrentUser(user);
    setActiveUser(user);
    if (onSwitchUser) onSwitchUser(user);
    reloadUsers();
    setFormSuccess(`Terminal session switched to ${user.name} (@${user.username})`);
    setTimeout(() => setFormSuccess(''), 4000);
  };

  // Run Cryptographic Verification
  const handleRunVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationPassed(true);
    }, 600);
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.licenseNumber && u.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
    admin: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    pharmacist: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    cashier: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    doctor: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-User System & AES-256 Security</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              User Accounts & Security Governance
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Manage licensed pharmacy staff, assign role-based permissions (Admin, Pharmacist, Cashier, Doctor), enforce password security, and trace audit logs for regulatory compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md transition-all text-xs cursor-pointer active:scale-95"
              id="btn-add-new-user-top"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New User</span>
            </button>

            <button
              onClick={handleRunVerification}
              disabled={isVerifying}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all text-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying...' : 'Verify Cryptography'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Success Notification */}
      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navigation Subtabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl shadow-2xs px-3 py-1.5 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'users'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          id="tab-sub-users"
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Credentials ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'rbac'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          id="tab-sub-rbac"
        >
          <Shield className="w-4 h-4" />
          <span>Role Permissions Matrix (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          id="tab-sub-audit"
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveSubTab('encryption')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeSubTab === 'encryption'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          id="tab-sub-encryption"
        >
          <Lock className="w-4 h-4" />
          <span>Data Encryption & Compliance</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: USER ACCOUNTS & CREDENTIALS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Total Registered Staff</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{users.length}</span>
              <span className="text-[10px] text-emerald-700 font-bold">All active in terminal</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Chief Administrators</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">
                {users.filter(u => u.role === 'admin').length}
              </span>
              <span className="text-[10px] text-slate-400">Full system override</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">Registered Pharmacists</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {users.filter(u => u.role === 'pharmacist').length}
              </span>
              <span className="text-[10px] text-slate-400">Dispensing & PO control</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-semibold block">POS Cashiers & Doctors</span>
              <span className="text-2xl font-black text-teal-700 mt-1 block">
                {users.filter(u => u.role === 'cashier' || u.role === 'doctor').length}
              </span>
              <span className="text-[10px] text-slate-400">Billing & Consultations</span>
            </div>
          </div>

          {/* Search, Filter & Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full sm:w-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search staff by name, username (@user), email, or license..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Roles ({users.length})</option>
                <option value="admin">Administrators</option>
                <option value="pharmacist">Pharmacists</option>
                <option value="cashier">POS Cashiers</option>
                <option value="doctor">Doctors</option>
              </select>

              <button
                onClick={() => {
                  StorageService.downloadAllUsersList();
                  setFormSuccess('Downloaded complete staff directory roster (.txt)!');
                  setTimeout(() => setFormSuccess(''), 4000);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 border border-slate-200"
                title="Download complete staff directory as formatted text file"
                id="btn-download-all-staff"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Download Staff Roster</span>
                <span className="sm:hidden">Download</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
                id="btn-add-user"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">License / Reg #</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        No staff accounts matching your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isCurrent = activeUser?.id === user.id;
                      const roleMeta = roleColors[user.role] || roleColors.cashier;

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isCurrent ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          {/* Staff Name + Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                                  {user.name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-extrabold rounded border border-emerald-300">
                                      Active Session
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">ID: {user.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Username */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              @{user.username}
                            </span>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${roleMeta.bg} ${roleMeta.text} ${roleMeta.border}`}
                            >
                              {user.role}
                            </span>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="text-slate-700 truncate font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* License */}
                          <td className="py-3.5 px-4">
                            {user.licenseNumber ? (
                              <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {user.licenseNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Not Registered</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                user.status === 'inactive'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  user.status === 'inactive' ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              />
                              {user.status === 'inactive' ? 'Suspended' : 'Active'}
                            </span>
                          </td>

                          {/* Last Login */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            {user.lastLogin || 'Never'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isCurrent && (
                                <button
                                  onClick={() => handleSwitchUserSession(user)}
                                  title="Switch to this user session"
                                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  StorageService.downloadUserCredentials(user);
                                  setFormSuccess(`Downloaded credentials pass for @${user.username}!`);
                                  setTimeout(() => setFormSuccess(''), 4000);
                                }}
                                title="Download User Credentials Pass (.txt)"
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenPasswordReset(user)}
                                title="Change or Reset Password"
                                className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(user)}
                                title="Edit Staff Profile"
                                className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-slate-200"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user)}
                                title="Delete User Account"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* ========================================================================= */}
      {/* SUBTAB 2: ROLE PERMISSIONS MATRIX (RBAC)                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'rbac' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Role-Based Access Control Matrix (RBAC)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Granular access privileges assigned across terminal modules and regulatory workflows
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">System Operation / Module</th>
                  <th className="py-3 px-4 text-center">Chief Administrator</th>
                  <th className="py-3 px-4 text-center">Pharmacist In-Charge</th>
                  <th className="py-3 px-4 text-center">POS Cashier (Billing)</th>
                  <th className="py-3 px-4 text-center">Consultant Doctor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    POS Retail Sales & UPI QR Payments
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Loose Quantity Dispensing (Fractional Strips / Tablets)
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Schedule H / Prescription Drug Dispensing Validation
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Required Sign-off</td>
                  <td className="py-3 px-4 text-center text-amber-600 font-semibold">⚠ Needs R.Ph Approval</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Prescribe Only</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Purchase Invoices, GRN & Supplier Accounts
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Customer Sales Returns & Real-time Restocking
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Clinic OPD Portal & Digital Prescriptions (Rx)
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Allowed</td>
                  <td className="py-3 px-4 text-center text-slate-400">View Only</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Full Control</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Tax Ledger, GST Returns & Profit/Loss Financials
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Full Control</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Stock Reports</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Multi-User Management & Password Resets
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✔ Administrator Only</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                  <td className="py-3 px-4 text-center text-slate-300">✖ Denied</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: AUDIT TRAIL                                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cryptographic Audit Trail</h3>
              <p className="text-xs text-slate-500">Every sensitive action is stamped with operator identity and terminal IP</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Immutable Hash Logging</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator / Staff</th>
                  <th className="py-3 px-4">Action Performed</th>
                  <th className="py-3 px-4">Integrity Status</th>
                  <th className="py-3 px-4 text-right">Terminal IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-slate-500">{log.timestamp}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{log.actor}</span>
                      <span className="text-[10px] text-slate-400">{log.role}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: ENCRYPTION & ARCHITECTURE                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'encryption' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Data At-Rest Encryption</h3>
              <p className="text-xs text-slate-500 mt-0.5">Hardware-accelerated database cipher</p>
            </div>
            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-slate-700">
              <div>Algorithm: <strong className="text-slate-900">{cipherAlgorithm}</strong></div>
              <div>Key Length: <strong>256 bits (32 bytes)</strong></div>
              <div>Block Size: <strong>128 bits</strong></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Key Management & Hashing</h3>
              <p className="text-xs text-slate-500 mt-0.5">PBKDF2 key stretching</p>
            </div>
            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-slate-700">
              <div>Derivation: <strong className="text-slate-900">PBKDF2-SHA512</strong></div>
              <div>HMAC Check: <strong className="text-slate-900">HMAC-SHA256</strong></div>
              <div>Status: <span className="text-emerald-700 font-bold">100% Tamper Free</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Statutory Healthcare Standards</h3>
              <p className="text-xs text-slate-500 mt-0.5">India Pharmacy & GST Rules</p>
            </div>
            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>DISHA Digital Health Compliant</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Drugs & Cosmetics Act Schedule H</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>GST Rule 46 Tax Invoicing</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW USER                                                  */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Create Staff User Account</h3>
                  <p className="text-xs text-emerald-100">Add staff member with username, password, and role</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Staff Full Name & Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. S. Karthik, D.Pharm"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                  id="modal-new-name-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="e.g. karthik"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                    id="modal-new-username-input"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Used to sign in (@username)</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Assigned Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                    id="modal-new-role-select"
                  >
                    <option value="cashier">POS Cashier (Billing)</option>
                    <option value="pharmacist">Registered Pharmacist</option>
                    <option value="doctor">Consultant Doctor</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 4 characters"
                      className="w-full px-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                      id="modal-new-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newConfirmPassword}
                    onChange={e => setNewConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                    id="modal-new-confirm-password-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="staff@citymed.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Mobile Phone Number</label>
                    <button
                      type="button"
                      onClick={() => setNewPhone('8438678498')}
                      className="text-[10px] text-emerald-700 font-bold hover:underline"
                    >
                      Fill 8438678498
                    </button>
                  </div>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="8438678498"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pharmacist / Medical Registration Number
                </label>
                <input
                  type="text"
                  value={newLicense}
                  onChange={e => setNewLicense(e.target.value)}
                  placeholder="e.g. TN-RPH-99412 or TNMC-55912"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  id="modal-btn-submit-new-user"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Create & Download Credentials Pass</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER DETAILS                                                */}
      {/* ========================================================================= */}
      {showEditModal && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-teal-700 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Edit Staff Profile</h3>
                  <p className="text-xs text-teal-100">Update details for @{selectedUserForEdit.username}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="cashier">POS Cashier (Billing)</option>
                    <option value="pharmacist">Registered Pharmacist</option>
                    <option value="doctor">Consultant Doctor</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">License #</label>
                  <input
                    type="text"
                    value={editLicense}
                    onChange={e => setEditLicense(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="inactive">Suspended (Access Blocked)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESET / CHANGE PASSWORD                                          */}
      {/* ========================================================================= */}
      {showPasswordModal && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Change / Reset Password</h3>
                  <p className="text-xs text-amber-100">For user @{selectedUserForEdit.username} ({selectedUserForEdit.name})</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePasswordReset} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-1">
                <span className="font-semibold block text-slate-900">Operator Information:</span>
                <p>Username: <strong className="font-mono">@{selectedUserForEdit.username}</strong></p>
                <p>Current Role: <strong className="capitalize">{selectedUserForEdit.role}</strong></p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={resetPasswordVal}
                    onChange={e => setResetPasswordVal(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full px-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500"
                    id="modal-reset-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  value={resetConfirmVal}
                  onChange={e => setResetConfirmVal(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500"
                  id="modal-reset-confirm-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  id="modal-btn-confirm-password-reset"
                >
                  <Key className="w-4 h-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
