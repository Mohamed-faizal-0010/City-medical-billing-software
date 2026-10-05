import React, { useState } from 'react';
import {
  MapPin,
  X,
  Navigation,
  Phone,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Share2,
  Compass,
  Layers
} from 'lucide-react';
import { PharmacyLogo } from './PharmacyLogo';
import { StorageService } from '../services/storage';
import { copyToClipboardSafely } from '../utils/billShareUtils';

interface PharmacyLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PharmacyLocationModal: React.FC<PharmacyLocationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' = normal map, 'k' = satellite

  if (!isOpen) return null;

  const profile = StorageService.getPharmacyProfile();

  const lat = profile.latitude || 10.0336;
  const lng = profile.longitude || 78.3361;
  const fullAddress = `${profile.addressLine1}, ${profile.taluk}, ${profile.district}, ${profile.state} - ${profile.pincode}`;

  const mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}+(City+Medical+Pharmacy)&t=${mapType}&z=16&ie=UTF8&iwloc=&output=embed`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const googleMapsViewUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}+(City+Medical)`;

  const handleCopyAddress = async () => {
    const textToCopy = `${profile.name}\n${fullAddress}\nPhone: ${profile.mobile}\nGPS: ${lat}, ${lng}`;
    await copyToClipboardSafely(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 lg:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <PharmacyLogo size="md" />
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>{profile.name} Location & Map</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Physical Store
                </span>
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{fullAddress}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 lg:p-6 overflow-y-auto space-y-5">
          {/* Interactive Google Map Embed Frame */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 aspect-16/10 md:aspect-16/8">
            <iframe
              title="City Medical Location Map"
              src={mapEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />

            {/* Map Mode Toggle Overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMapType('m')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mapType === 'm'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Road Map
              </button>
              <button
                type="button"
                onClick={() => setMapType('k')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mapType === 'k'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Coordinate Badge Overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-teal-400" />
              <span>{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Directions (Google Maps)</span>
            </a>

            <a
              href={googleMapsViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Google Maps App</span>
            </a>

            <button
              onClick={handleCopyAddress}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Address Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Store Address</span>
                </>
              )}
            </button>

            <a
              href={`tel:${profile.mobile}`}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors ml-auto"
            >
              <Phone className="w-4 h-4" />
              <span>Call Pharmacy: {profile.mobile}</span>
            </a>
          </div>

          {/* Location & Store Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Store Address & Landmarks */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>Store Address</span>
              </div>
              <p className="text-slate-700 font-medium">
                {profile.addressLine1}
              </p>
              <p className="text-slate-600">
                {profile.taluk}, {profile.district}
              </p>
              <p className="text-slate-600">
                {profile.state} - {profile.pincode}
              </p>
              <div className="pt-2 mt-1 border-t border-slate-200 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Landmark: </span>
                Near Melur Central Bus Stand / Chokkalingapuram Govt Hospital Road
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Operating Timings</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Monday - Saturday:</span>
                  <span className="font-semibold">8:00 AM - 10:30 PM</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Sunday:</span>
                  <span className="font-semibold">9:00 AM - 9:00 PM</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>Emergency Dispensing:</span>
                  <span>On Call 24/7</span>
                </div>
              </div>
            </div>

            {/* Regulatory Credentials */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Official Registration</span>
              </div>
              <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Drug License No:</span>
                  <span className="text-slate-800 font-bold">{profile.drugLicenseNo}</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block text-[10px]">GSTIN Number:</span>
                  <span className="text-slate-800 font-bold">{profile.gstin}</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block text-[10px]">Pharmacist in Charge:</span>
                  <span className="text-slate-800 font-semibold">{profile.pharmacistName || 'Anusya Begum'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
