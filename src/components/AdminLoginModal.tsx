import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  User,
  Mail,
  UserPlus,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { UserSession } from '../types/wms';

const ADMIN_STORAGE_KEY = 'tbc_wms_registered_admins_v2';
const MASTER_ADMIN_PASSCODE = 'WMS@ADMIN2026';

interface AdminAccountRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Super Admin' | 'Executive Admin' | 'Auditor';
  createdAt: string;
}

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (session: UserSession) => void;
  lang: 'en' | 'bn';
  onBackToCustomer?: () => void;
  isFullScreen?: boolean;
}

function getStoredAdmins(): AdminAccountRecord[] {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveStoredAdmins(admins: AdminAccountRecord[]): void {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admins));
  } catch {}
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  lang,
  onBackToCustomer,
  isFullScreen = false
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Sign In fields
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Sign Up fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupRole, setSignupRole] = useState<'Super Admin' | 'Executive Admin' | 'Auditor'>('Super Admin');
  const [adminPasscode, setAdminPasscode] = useState('');

  // Status feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasExistingAdmins, setHasExistingAdmins] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = getStoredAdmins();
      setHasExistingAdmins(existing.length > 0);
      // If no admins exist yet, prompt to create initial account
      if (existing.length === 0) {
        setMode('signup');
      }
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedEmail = adminEmail.trim().toLowerCase();
    const trimmedPass = adminPass.trim();

    const admins = getStoredAdmins();

    if (admins.length === 0) {
      setErrorMessage(
        lang === 'bn'
          ? 'কোনো অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে প্রথমে সাইন আপ করুন।'
          : 'No registered admin account found. Please sign up to create your primary admin profile.'
      );
      setMode('signup');
      return;
    }

    const matched = admins.find(
      (a) =>
        (a.email.toLowerCase() === trimmedEmail || a.id.toLowerCase() === trimmedEmail) &&
        a.password === trimmedPass
    );

    if (matched) {
      const session: UserSession = {
        type: 'admin',
        name: matched.name,
        email: matched.email,
        adminRole: matched.role
      };
      setSuccessMessage(lang === 'bn' ? 'লগইন সফল হয়েছে!' : 'Authentication successful!');
      setTimeout(() => {
        onLoginSuccess(session);
      }, 400);
    } else {
      setErrorMessage(
        lang === 'bn'
          ? 'ভুল ইমেইল বা পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।'
          : 'Invalid admin credentials! Please check your email and password.'
      );
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const password = signupPass.trim();
    const passcode = adminPasscode.trim();

    if (!name || name.length < 2) {
      setErrorMessage(lang === 'bn' ? 'অ্যাডমিনের পূর্ণ নাম দিন।' : 'Please enter your full admin name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage(lang === 'bn' ? 'সঠিক অফিসিয়াল ইমেইল দিন।' : 'Please enter a valid official email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    const existingAdmins = getStoredAdmins();

    // Verify Master Security Passcode to prevent unauthorized public signup
    // If it's the very first admin setup, accept master code or standard initial key
    if (existingAdmins.length > 0 && passcode !== MASTER_ADMIN_PASSCODE) {
      setErrorMessage(
        lang === 'bn'
          ? `ভুল অ্যাডমিন সিকিউরিটি কোড! (ডিফল্ট মাস্টার কোড: ${MASTER_ADMIN_PASSCODE})`
          : `Invalid Admin Security Passcode! (Default Master Passcode: ${MASTER_ADMIN_PASSCODE})`
      );
      return;
    }

    // Check if email already registered
    if (existingAdmins.some((a) => a.email.toLowerCase() === email)) {
      setErrorMessage(
        lang === 'bn'
          ? 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাডমিন অ্যাকাউন্ট রয়েছে।'
          : 'An admin account with this email already exists.'
      );
      return;
    }

    const newAdmin: AdminAccountRecord = {
      id: `ADMIN-${Date.now()}`,
      name,
      email,
      password,
      role: signupRole,
      createdAt: new Date().toISOString()
    };

    existingAdmins.push(newAdmin);
    saveStoredAdmins(existingAdmins);
    setHasExistingAdmins(true);

    const session: UserSession = {
      type: 'admin',
      name: newAdmin.name,
      email: newAdmin.email,
      adminRole: newAdmin.role
    };

    setSuccessMessage(
      lang === 'bn'
        ? 'নতুন অ্যাডমিন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...'
        : 'Admin registered successfully! Redirecting to dashboard...'
    );

    setTimeout(() => {
      onLoginSuccess(session);
    }, 600);
  };

  return (
    <div className={`fixed inset-0 z-50 ${isFullScreen ? 'bg-slate-950 min-h-screen' : 'bg-slate-950/70 backdrop-blur-md'} flex items-center justify-center p-4 overflow-y-auto`}>
      <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          {onBackToCustomer ? (
            <button
              onClick={onBackToCustomer}
              className="absolute top-4 right-4 text-slate-400 hover:text-white px-2.5 py-1 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              title="Return to Customer Storefront"
            >
              <span>{lang === 'bn' ? 'স্টোরে ফিরুন' : 'Store'}</span>
              <X className="w-4 h-4" />
            </button>
          ) : onClose ? (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">TBC WMS Admin Console</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Restricted
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'গোপন অ্যাডমিনিস্ট্রেটর পোর্টাল সিকিউরিটি'
                  : 'Restricted administrative access portal'}
              </p>
            </div>
          </div>

          {/* Tab Selector: Login vs Sign Up */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'অ্যাডমিন লগইন' : 'Admin Sign In'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নতুন অ্যাডমিন তৈরি' : 'Admin Sign Up'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'আপনার রেজিস্টার্ড অ্যাডমিন ইমেইল ও পাসওয়ার্ড প্রদান করুন:'
                : 'Enter your registered administrator credentials:'}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'অ্যাডমিন ইমেইল *' : 'Admin Email *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin.email@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'পাসওয়ার্ড *' : 'Admin Password *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{lang === 'bn' ? 'অ্যাডমিন প্যানেলে লগইন করুন' : 'Sign In to Admin Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!hasExistingAdmins && (
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 text-center">
                <span>
                  {lang === 'bn'
                    ? 'কোনো অ্যাকাউন্ট নেই? "নতুন অ্যাডমিন তৈরি" ট্যাবে গিয়ে প্রথম অ্যাকাউন্ট তৈরি করুন।'
                    : 'No admin yet? Switch to "Admin Sign Up" to configure the first administrator.'}
                </span>
              </div>
            )}

            {onBackToCustomer && (
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={onBackToCustomer}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? '← কাস্টমার পোর্টাল / স্টোরফ্রন্টে ফিরে যান' : '← Return to Customer Storefront'}
                </button>
              </div>
            )}
          </form>
        ) : (
          /* 2. SIGN UP FORM */
          <form onSubmit={handleSignupSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'নতুন অ্যাডমিনের তথ্য এবং মাস্টার সিকিউরিটি কোড দিন:'
                : 'Create an administrator account with verified security credentials:'}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'অ্যাডমিন নাম *' : 'Full Name *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'অফিসিয়াল ইমেইল *' : 'Admin Email *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="admin.email@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'অ্যাডমিন পাসওয়ার্ড *' : 'Password (min 6 chars) *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={signupPass}
                  onChange={(e) => setSignupPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {lang === 'bn' ? 'অ্যাডমিন রোল (পদবী)' : 'Admin Role'}
              </label>
              <select
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
              >
                <option value="Super Admin">Super Admin (সম্পূর্ণ নিয়ন্ত্রণ)</option>
                <option value="Executive Admin">Executive Admin (ভেরিফিকেশন ও অফার)</option>
                <option value="Auditor">Auditor (পেআউট ও হিসাব)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>{lang === 'bn' ? 'মাস্টার সিকিউরিটি কোড *' : 'Master Admin Passcode *'}</span>
                <span className="text-[10px] text-indigo-600 font-mono font-normal">
                  Default: {MASTER_ADMIN_PASSCODE}
                </span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder={`Enter ${MASTER_ADMIN_PASSCODE}`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                {lang === 'bn'
                  ? `সাধারণ ব্যবহারকারীদের প্রবেশ আটকাতে সিকিউরিটি কোড প্রয়োজন (${MASTER_ADMIN_PASSCODE})`
                  : `Security verification required to provision admin privilege (${MASTER_ADMIN_PASSCODE})`}
              </p>
            </div>

            <button
              type="submit"
              className="w-full mt-3 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{lang === 'bn' ? 'অ্যাডমিন অ্যাকাউন্ট তৈরি করুন' : 'Create Administrator Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onBackToCustomer && (
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={onBackToCustomer}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? '← কাস্টমার পোর্টাল / স্টোরফ্রন্টে ফিরে যান' : '← Return to Customer Storefront'}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
