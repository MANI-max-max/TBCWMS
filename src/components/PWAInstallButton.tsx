import React, { useState } from 'react';
import { Download, Monitor, Smartphone, Share2, PlusSquare, X, Check, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  language?: 'en' | 'bn';
  variant?: 'compact' | 'full' | 'nav';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language = 'en',
  variant = 'nav',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed and running standalone, show a small verified app badge or hide
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
        <Check className="w-3.5 h-3.5" />
        <span>{language === 'bn' ? 'অ্যাপ ইনস্টল্ড' : 'App Installed'}</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setShowModal(false);
        return;
      }
    }
    // If not directly installable via prompt (e.g., iOS or needs instructions), show guide modal
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        title={language === 'bn' ? 'কম্পিউটার ও মোবাইল অ্যাপ ইনস্টল করুন' : 'Install Computer & Mobile App'}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
          variant === 'full'
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200'
            : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100/80'
        } ${className}`}
      >
        {isMobile ? (
          <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        ) : (
          <Monitor className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        )}
        <span>
          {language === 'bn'
            ? isMobile
              ? 'মোবাইল অ্যাপ'
              : 'কম্পিউটার অ্যাপ'
            : isMobile
              ? 'Mobile App'
              : 'Desktop App'}
        </span>
        <Download className="w-3 h-3 opacity-70" />
      </button>

      {/* Install Instruction / Download Modal for Computer and Mobile */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5 text-slate-900 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with App Icon */}
            <div className="flex items-center gap-4">
              <img
                src="/pwa-192x192.png"
                alt="TBC WMS Icon"
                className="w-14 h-14 rounded-2xl shadow-md border border-indigo-100 object-cover"
              />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {language === 'bn' ? 'TBC WMS অ্যাপ ইনস্টল করুন' : 'Install TBC WMS App'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'bn'
                    ? 'কম্পিউটার ও মোবাইল উভয় ডিভাইসেই দ্রুত ব্যবহার করুন'
                    : 'Available for Computer (PC/Mac) & Mobile (Android/iOS)'}
                </p>
              </div>
            </div>

            {/* Direct 1-Click Install if prompt is ready */}
            {isInstallable && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center space-y-3">
                <p className="text-xs text-indigo-900 font-medium">
                  {language === 'bn'
                    ? '১-ক্লিকে সরাসরি আপনার ডিভাইসে ইনস্টল করুন:'
                    : 'Click below to install directly to your device launcher/desktop:'}
                </p>
                <button
                  onClick={async () => {
                    await install();
                    setShowModal(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  {language === 'bn' ? 'এখনই ইনস্টল করুন (Install Now)' : 'Install App Now'}
                </button>
              </div>
            )}

            {/* Platform Guides */}
            <div className="space-y-3 text-xs">
              {/* Computer Guide */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'bn' ? '🖥️ কম্পিউটার বা ল্যাপটপে (PC / Mac):' : '🖥️ On Computer (PC / Mac):'}</span>
                </div>
                <p className="text-slate-600 pl-6 leading-relaxed">
                  {language === 'bn'
                    ? 'Chrome বা Edge ব্রাউজারের অ্যাড্রেস বারের ডানপাশে থাকা [Install App ⊕] আইকনে ক্লিক করুন অথবা মেন্যু থেকে "Install TBC WMS" সিলেক্ট করুন।'
                    : 'Click the Install icon (⊕) in the browser address bar or open menu (⋮) → "Install TBC WMS".'}
                </p>
              </div>

              {/* Android Guide */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? '📱 অ্যান্ড্রয়েড মোবাইলে (Android):' : '📱 On Android Mobile:'}</span>
                </div>
                <p className="text-slate-600 pl-6 leading-relaxed">
                  {language === 'bn'
                    ? 'Chrome ব্রাউজারের ওপরের ডানদিকের থ্রি-ডট (⋮) মেন্যু চাপুন এবং "Install app" অথবা "Add to Home screen" নির্বাচন করুন।'
                    : 'Open Chrome menu (⋮) and tap "Install app" or "Add to Home screen".'}
                </p>
              </div>

              {/* iOS Guide */}
              {isIOS && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Share2 className="w-4 h-4 text-amber-600" />
                    <span>{language === 'bn' ? '🍏 আইফোন ও আইপ্যাডে (iPhone / iPad):' : '🍏 On iPhone / iPad (Safari):'}</span>
                  </div>
                  <ol className="text-amber-800 pl-6 list-decimal space-y-1 leading-relaxed">
                    <li>
                      {language === 'bn' ? 'Safari টুলবারের ' : 'Tap the '}
                      <strong>{language === 'bn' ? 'Share (শেয়ার)' : 'Share'}</strong>
                      {language === 'bn' ? ' আইকনটি চাপুন।' : ' icon at bottom.'}
                    </li>
                    <li>
                      {language === 'bn' ? 'নিচে স্ক্রোল করে ' : 'Scroll and tap '}
                      <strong>{language === 'bn' ? 'Add to Home Screen' : 'Add to Home Screen'}</strong>
                      {language === 'bn' ? ' বাটনে ক্লিক করুন।' : '.'}
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Footer with safety badge */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'bn' ? '১০০% নিরাপদ ও অফলাইন সাপোর্ট' : '100% Safe & Offline Ready'}</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'ঠিক আছে' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
