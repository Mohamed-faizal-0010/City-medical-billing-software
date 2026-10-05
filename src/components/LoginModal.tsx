import React, { useState, useEffect } from 'react';
import {
  Lock,
  User as UserIcon,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Pill,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
  Phone,
  Mail,
  BadgeCheck,
  X,
  Smartphone,
  Download,
  MessageCircle,
  Check,
  Sparkles,
  RotateCcw,
  FileText
} from 'lucide-react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
  allowClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  onClose,
  allowClose = false,
}) => {
  // Authentication Modes:
  // 'signup-otp'   : Phone OTP registration -> Create verification code -> Create username & password -> Download -> Access
  // 'login-otp'    : Login with Phone OTP (8438678498)
  // 'login-pwd'    : Username + Password Login
  const [mode, setMode] = useState<'signup-otp' | 'login-otp' | 'login-pwd'>('signup-otp');

  // Shared state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // OTP Verification state
  const TARGET_DEFAULT_PHONE = '8438678498';
  const [otpPhone, setOtpPhone] = useState(TARGET_DEFAULT_PHONE);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Sign Up Form state (Step 2 after Phone Verification)
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('cashier');
  const [regEmail, setRegEmail] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Standard Username / Password login state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);

  // Users list from Storage
  const [allUsers, setAllUsers] = useState<User[]>(() => StorageService.getUsers());
  const pharmacyProfile = StorageService.getPharmacyProfile();

  const refreshUsersList = () => {
    setAllUsers(StorageService.getUsers());
  };

  // Timer countdown for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handler: Generate and Create Verification Code
  const handleGenerateVerificationCode = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanPhone = otpPhone.replace(/[^0-9]/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const { code, expiresAt } = StorageService.generateVerificationCode(cleanPhone);
      setGeneratedCode(code);
      setCodeExpiresAt(expiresAt);
      setCountdown(60);
      setIsLoading(false);
      setSuccessMsg(`Verification code created for +91 ${cleanPhone}!`);
    }, 250);
  };

  // Handler: 1-Click Auto-Fill Code
  const handleAutoFillCode = () => {
    if (generatedCode) {
      setOtpCodeInput(generatedCode);
      verifyEnteredCode(generatedCode);
    } else {
      setOtpCodeInput('843867');
      verifyEnteredCode('843867');
    }
  };

  // Verify entered code
  const verifyEnteredCode = (codeToVerify?: string) => {
    const code = (codeToVerify || otpCodeInput).trim();
    setErrorMsg('');

    if (!code) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return false;
    }

    const verification = StorageService.verifyCode(otpPhone, code);
    if (verification.valid) {
      setIsPhoneVerified(true);
      setSuccessMsg(`✓ Mobile number +91 ${otpPhone} verified successfully!`);
      // If no name is set yet, propose a helpful default
      if (!regName) {
        if (otpPhone.endsWith('8438678498')) {
          setRegName('Dr. Fakrudeen Ajmal');
          setRegUsername('ajmal');
        } else {
          setRegName('Staff User');
          setRegUsername(`user${otpPhone.slice(-4)}`);
        }
      }
      return true;
    } else {
      setIsPhoneVerified(false);
      setErrorMsg(verification.error || 'Invalid verification code.');
      return false;
    }
  };

  // Handler: Mobile OTP Sign In
  const handleLoginWithPhoneOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = otpPhone.replace(/[^0-9]/g, '');
    const cleanCode = otpCodeInput.trim();

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }
    if (!cleanCode) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = StorageService.authenticateByPhone(cleanPhone, cleanCode);
      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.name}! Accessing terminal...`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 600);
      } else if (res.success && res.isNewUser) {
        // Verified but user doesn't exist yet -> guide to complete registration
        setIsPhoneVerified(true);
        setMode('signup-otp');
        setSuccessMsg(`Phone verified! Please set your username and password below to complete signup.`);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify code.');
      }
    }, 350);
  };

  // Handler: Register New User with Username, Password, and Download Credentials
  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isPhoneVerified) {
      setErrorMsg('Please verify your mobile number with the 6-digit code first.');
      return;
    }

    if (!regUsername.trim()) {
      setErrorMsg('Please enter a username.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = StorageService.addUser({
        username: regUsername.trim(),
        password: regPassword,
        name: regName.trim() || `Staff (${regUsername})`,
        role: regRole,
        email: regEmail.trim() || `${regUsername.trim().toLowerCase()}@citymedical.local`,
        phone: otpPhone.replace(/[^0-9]/g, ''),
        licenseNumber: regLicense.trim(),
        status: 'active'
      });

      setIsLoading(false);

      if (result.success && result.user) {
        refreshUsersList();

        // 1. Download User Credentials Pass automatically
        try {
          StorageService.downloadUserCredentials(result.user, regPassword);
        } catch (err) {
          console.error('Failed to trigger auto download:', err);
        }

        setSuccessMsg(`✓ Staff account @${result.user.username} created & downloaded! Logging in...`);

        // 2. Grant Access & Sign in
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 800);
      } else {
        setErrorMsg(result.error || 'Failed to create user account.');
      }
    }, 400);
  };

  // Handler: Username / Password Login
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const result = StorageService.authenticateUser(username, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.error || 'Invalid username or password.');
      }
    }, 300);
  };

  const handleQuickSelectStaff = (user: User) => {
    setUsername(user.username);
    setPassword(user.password || 'citymed123');
    setErrorMsg('');
    setSuccessMsg(`Selected ${user.name} (@${user.username})`);
  };

  const handleDownloadUserPass = (user: User) => {
    StorageService.downloadUserCredentials(user);
    setSuccessMsg(`Downloaded credentials pass for @${user.username}!`);
  };

  // Links for WhatsApp and SMS delivery to 8438678498
  const cleanPhone = otpPhone.replace(/[^0-9]/g, '');
  const formattedIntlPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const otpMessage = `Your City Rx - City Medical verification code is: *${generatedCode || '843867'}*. Use this OTP to access your pharmacy account.`;
  const whatsappUrl = `https://wa.me/${formattedIntlPhone}?text=${encodeURIComponent(otpMessage)}`;
  const smsUrl = `sms:+${formattedIntlPhone}?body=${encodeURIComponent(otpMessage)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-600 p-6 text-white text-center relative">
          {allowClose && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-2 text-white shadow-inner">
            <Pill className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">{pharmacyProfile.name}</h2>
          <p className="text-xs text-emerald-100 font-medium">
            Melur, Madurai • Helpline: +91 {TARGET_DEFAULT_PHONE}
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-semibold text-white border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mobile OTP Verification & Access Gateway</span>
          </div>
        </div>

        {/* 3 Navigation Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold divide-x divide-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode('signup-otp');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-all ${
              mode === 'signup-otp'
                ? 'border-b-2 border-emerald-600 text-emerald-800 bg-white font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-signup-otp"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="truncate">Sign Up (OTP)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login-otp');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-all ${
              mode === 'login-otp'
                ? 'border-b-2 border-emerald-600 text-emerald-800 bg-white font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-login-otp"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="truncate">Phone Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login-pwd');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-all ${
              mode === 'login-pwd'
                ? 'border-b-2 border-emerald-600 text-emerald-800 bg-white font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-login-pwd"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="truncate">Password</span>
          </button>
        </div>

        {/* Feedback Messages */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 1: SIGN UP WITH PHONE VERIFICATION (OTP)                             */}
          {/* ========================================================================= */}
          {mode === 'signup-otp' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Sign Up & Create Verified User</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                    OTP Verified
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify mobile number <strong>8438678498</strong>, create username and password, download credentials pass, and unlock POS.
                </p>
              </div>

              {/* Step 1: Mobile Phone Number Input with Quick Tap */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mobile Phone Number</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpPhone(TARGET_DEFAULT_PHONE);
                      setErrorMsg('');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    Quick fill: {TARGET_DEFAULT_PHONE}
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={otpPhone}
                      onChange={e => {
                        setOtpPhone(e.target.value);
                        setIsPhoneVerified(false);
                      }}
                      placeholder="8438678498"
                      className="w-full pl-11 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isLoading || countdown > 0}
                    onClick={handleGenerateVerificationCode}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{countdown > 0 ? `Resend (${countdown}s)` : 'Create Verification Code'}</span>
                  </button>
                </div>

                {/* Generated Verification Code Banner */}
                {(generatedCode || otpPhone.endsWith('8438678498')) && (
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active Verification Code:</span>
                      </div>
                      <span className="font-mono text-base font-black px-2.5 py-0.5 bg-white border border-emerald-300 rounded-lg text-emerald-800 tracking-widest shadow-2xs">
                        {generatedCode || '843867'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleAutoFillCode}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Auto-Fill Code ({generatedCode || '843867'})</span>
                      </button>

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>Send WhatsApp</span>
                      </a>

                      <a
                        href={smsUrl}
                        className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Smartphone className="w-3 h-3 text-blue-600" />
                        <span>Send SMS</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Enter 6-digit Code */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Enter 6-Digit Code Received:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCodeInput}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setOtpCodeInput(val);
                        if (val.length === 6) {
                          verifyEnteredCode(val);
                        }
                      }}
                      placeholder="e.g. 843867"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-base font-mono font-black text-center tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => verifyEnteredCode()}
                      className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors ${
                        isPhoneVerified
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isPhoneVerified ? '✓ Verified' : 'Verify Code'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Create Username & Password Form */}
              <form onSubmit={handleCompleteRegistration} className="space-y-3 pt-1 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      Staff Full Name <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Printed on bill receipts</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Fakrudeen Ajmal, B.Pharm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Create Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="e.g. ajmal"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Role / Permissions <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regRole}
                      onChange={e => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="cashier">POS Cashier (Billing)</option>
                      <option value="pharmacist">Registered Pharmacist</option>
                      <option value="doctor">Consultant Doctor</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Create Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="Min 4 chars"
                        className="w-full px-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="ajmal@citymedical.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">License / Reg. No.</label>
                    <input
                      type="text"
                      value={regLicense}
                      onChange={e => setRegLicense(e.target.value)}
                      placeholder="e.g. TN-RPH-61942"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Submit & Download Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                    id="btn-register-download-access"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? 'Enrolling & Downloading...'
                        : 'Create User, Download Credentials Pass & Access Terminal'}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-1.5">
                    Automatically saves account, downloads <code>CityRx_Staff_Pass_*.txt</code>, and opens POS
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: PHONE OTP LOGIN (DIRECT ACCESS WITH 8438678498)                   */}
          {/* ========================================================================= */}
          {mode === 'login-otp' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Sign In with Phone Verification</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered mobile number (e.g. <strong>8438678498</strong>) to get a verification code and sign in instantly without typing passwords.
                </p>
              </div>

              <form onSubmit={handleLoginWithPhoneOTP} className="space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Mobile Number</label>
                    <button
                      type="button"
                      onClick={() => setOtpPhone(TARGET_DEFAULT_PHONE)}
                      className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100"
                    >
                      Use {TARGET_DEFAULT_PHONE}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={otpPhone}
                        onChange={e => setOtpPhone(e.target.value)}
                        placeholder="8438678498"
                        className="w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isLoading || countdown > 0}
                      onClick={handleGenerateVerificationCode}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{countdown > 0 ? `${countdown}s` : 'Get Code'}</span>
                    </button>
                  </div>
                </div>

                {/* Active OTP Card */}
                {(generatedCode || otpPhone.endsWith('8438678498')) && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">Your Verification Code:</span>
                      <span className="font-mono text-base font-black px-2.5 py-0.5 bg-white border border-emerald-300 rounded-lg text-emerald-800 tracking-widest shadow-2xs">
                        {generatedCode || '843867'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleAutoFillCode}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Auto-Fill Code ({generatedCode || '843867'})</span>
                      </button>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>Send WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCodeInput}
                    onChange={e => setOtpCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 843867"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-black text-center tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Verifying Code...' : 'Verify Code & Access Terminal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 3: USERNAME + PASSWORD TERMINAL SIGN IN                              */}
          {/* ========================================================================= */}
          {mode === 'login-pwd' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Sign in with Username & Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your credentials or choose an active staff member below
                </p>
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Username</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="e.g. admin, ajmal, pharmacist"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <span>{isLoading ? 'Verifying Credentials...' : 'Unlock Terminal & Access POS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Staff Switcher & Download Credentials Pass */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Staff Directory ({allUsers.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      StorageService.downloadAllUsersList();
                      setSuccessMsg('Downloaded complete staff roster file!');
                    }}
                    className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download All Staff</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {allUsers.map(user => {
                    const isSelected = username.toLowerCase() === user.username.toLowerCase();
                    return (
                      <div
                        key={user.id}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleQuickSelectStaff(user)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold truncate">{user.name.split(',')[0]}</p>
                            <p className="text-[10px] text-slate-500 capitalize truncate">
                              @{user.username} • {user.role}
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadUserPass(user)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-white transition-colors"
                          title={`Download ${user.name} credentials pass`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
