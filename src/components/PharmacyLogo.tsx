import React, { useState, useEffect } from 'react';
import { Pill } from 'lucide-react';
import { PHARMACY_LOGO_URL } from '../assets/logo';
import { StorageService } from '../services/storage';
import { PharmacyProfile } from '../types';

interface PharmacyLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  imgClassName?: string;
  customLogoUrl?: string;
  profile?: PharmacyProfile;
}

export const PharmacyLogo: React.FC<PharmacyLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  imgClassName = '',
  customLogoUrl,
  profile: propProfile
}) => {
  const [profile, setProfile] = useState<PharmacyProfile>(() => propProfile || StorageService.getPharmacyProfile());
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (propProfile) {
      setProfile(propProfile);
      setImgError(false);
    }
  }, [propProfile]);

  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
        setImgError(false);
      } else {
        setProfile(StorageService.getPharmacyProfile());
        setImgError(false);
      }
    };
    window.addEventListener('pharmacy:profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('pharmacy:profile-updated', handleProfileUpdated);
  }, []);

  const logoSrc = customLogoUrl || profile.logoUrl || PHARMACY_LOGO_URL;

  useEffect(() => {
    setImgError(false);
  }, [logoSrc]);

  const sizeClasses = {
    xs: 'w-7 h-7 rounded-lg text-xs',
    sm: 'w-9 h-9 rounded-xl text-sm',
    md: 'w-11 h-11 rounded-2xl text-base',
    lg: 'w-16 h-16 rounded-2xl text-lg',
    xl: 'w-24 h-24 rounded-3xl text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} shrink-0 overflow-hidden bg-white border border-emerald-100 shadow-xs flex items-center justify-center relative p-0.5`}
      >
        {!imgError ? (
          <img
            src={logoSrc}
            alt={`${profile.name} Logo`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`w-full h-full object-contain rounded-[inherit] ${imgClassName}`}
          />
        ) : (
          <div className="w-full h-full bg-white flex items-center justify-center p-1 relative rounded-[inherit]">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Outer green curved swoosh */}
              <path
                d="M 20,50 A 35,35 0 1,1 80,50"
                fill="none"
                stroke="#059669"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Bottom dark stethoscope circle arc */}
              <path
                d="M 80,50 A 35,35 0 0,1 25,65"
                fill="none"
                stroke="#1e293b"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Stethoscope bell */}
              <circle cx="25" cy="65" r="4.5" fill="#1e293b" />
              {/* Red medical cross in center */}
              <rect x="45" y="32" width="10" height="28" rx="2" fill="#dc2626" />
              <rect x="36" y="41" width="28" height="10" rx="2" fill="#dc2626" />
              {/* City Rx Text */}
              <text x="50" y="82" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0f172a" fontFamily="system-ui, sans-serif">
                Rx
              </text>
            </svg>
          </div>
        )}
      </div>

      {showText && (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
              {profile.name}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {profile.pharmacyType === 'wholesale' ? 'Wholesale' : profile.pharmacyType === 'both' ? 'Retail & Wholesale' : 'Retail'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {profile.taluk || profile.district} • Ph: {profile.mobile}
          </p>
        </div>
      )}
    </div>
  );
};
