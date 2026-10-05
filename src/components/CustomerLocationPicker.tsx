import React, { useState } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, AlertCircle, Building, Home, Phone } from 'lucide-react';
import { CustomerLocation } from '../types';

interface CustomerLocationPickerProps {
  location: CustomerLocation;
  onChange: (location: CustomerLocation) => void;
  phone?: string;
  onPhoneChange?: (phone: string) => void;
}

// Store coordinates for City Medical Pharmacy, Melur
const STORE_COORDS = {
  lat: 10.0315,
  lng: 78.3340,
  address: 'City Medical, Chokkalingapuram, Melur, Madurai - 625103'
};

// Common areas in and around Melur / Madurai
const LOCALITIES = [
  'Melur Town (Main Bazaar)',
  'Chokkalingapuram',
  'Alagar Kovil Road',
  'Keelavalavu',
  'Kottampatti Road',
  'Trichy Main Road',
  'Therku Theru',
  'Vellalur',
  'Attukulam',
  'Karungalakudi',
  'Madurai Road Highway'
];

export const CustomerLocationPicker: React.FC<CustomerLocationPickerProps> = ({
  location,
  onChange,
  phone,
  onPhoneChange
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Haversine distance calculator in KM
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      position => {
        setIsDetecting(false);
        const lat = parseFloat(position.coords.latitude.toFixed(5));
        const lng = parseFloat(position.coords.longitude.toFixed(5));
        const dist = calculateDistance(STORE_COORDS.lat, STORE_COORDS.lng, lat, lng);

        onChange({
          ...location,
          latitude: lat,
          longitude: lng,
          distanceKm: dist,
          isGpsDetected: true,
          city: location.city || 'Melur',
          district: 'Madurai District',
          taluk: 'Melur Taluk',
          pincode: location.pincode || '625103'
        });
      },
      error => {
        setIsDetecting(false);
        // Provide friendly fallback with approximate Melur Town center
        const fallbackLat = 10.0328;
        const fallbackLng = 78.3361;
        const dist = calculateDistance(STORE_COORDS.lat, STORE_COORDS.lng, fallbackLat, fallbackLng);

        setGeoError('GPS permission was denied or timed out. Defaulted to Melur Town center.');
        onChange({
          ...location,
          latitude: fallbackLat,
          longitude: fallbackLng,
          distanceKm: dist,
          isGpsDetected: false
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const getEtaText = (dist?: number) => {
    if (dist === undefined) return '30 - 45 mins (Standard Local Delivery)';
    if (dist <= 2) return '20 - 30 mins (Ultra Express Delivery - Melur Town)';
    if (dist <= 5) return '30 - 45 mins (Express Delivery - Nearby Villages)';
    if (dist <= 15) return '45 - 60 mins (Standard Rural Delivery)';
    return 'Same Day Delivery (Scheduled Evening Slot)';
  };

  return (
    <div className="space-y-4" id="customer-location-picker">
      {/* GPS Geolocation Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>📍 Automatic GPS Location Detection</span>
                {location.isGpsDetected && (
                  <span className="text-[11px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> GPS Locked
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Pinpoint your exact address for 30-45 minute emergency medicine delivery in Melur & nearby regions.
              </p>
              {location.distanceKm !== undefined && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300/60">
                    Distance: ~{location.distanceKm} km from City Medical
                  </span>
                  <span className="font-medium text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded border border-teal-300/60">
                    ETA: {getEtaText(location.distanceKm)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="self-start sm:self-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-60"
            id="detect-location-btn"
          >
            <Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
            {isDetecting ? 'Detecting GPS...' : 'Use My Current Location'}
          </button>
        </div>

        {geoError && (
          <div className="mt-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{geoError}</span>
          </div>
        )}
      </div>

      {/* Address Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* House / Flat / Street */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Door No. / Building Name / Street Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Home className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={location.addressLine}
              onChange={e => onChange({ ...location, addressLine: e.target.value })}
              placeholder="e.g. Door No. 12/B, Perumal Koil Street"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              id="customer-address-line"
              required
            />
          </div>
        </div>

        {/* Landmark */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Prominent Landmark / Near
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={location.landmark || ''}
              onChange={e => onChange({ ...location, landmark: e.target.value })}
              placeholder="e.g. Near SBI ATM / Government Hospital"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              id="customer-landmark"
            />
          </div>
        </div>

        {/* Locality / Area Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Locality / Area <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              list="localities-list"
              type="text"
              value={location.locality}
              onChange={e => onChange({ ...location, locality: e.target.value })}
              placeholder="Select or enter area"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              id="customer-locality"
              required
            />
            <datalist id="localities-list">
              {LOCALITIES.map(area => (
                <option key={area} value={area} />
              ))}
            </datalist>
          </div>
        </div>

        {/* City & District */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            City / Taluk
          </label>
          <input
            type="text"
            value={location.city || 'Melur (Madurai District)'}
            onChange={e => onChange({ ...location, city: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 text-slate-800"
            id="customer-city"
          />
        </div>

        {/* Pincode */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Postal PIN Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={6}
            value={location.pincode}
            onChange={e => onChange({ ...location, pincode: e.target.value.replace(/\D/g, '') })}
            placeholder="625103"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-mono"
            id="customer-pincode"
            required
          />
        </div>

        {/* Optional Contact Number if requested in address context */}
        {onPhoneChange && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Delivery Contact Phone (Rider will call this number) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-500 py-0.5 border-r border-slate-300 pr-2">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={phone || ''}
                onChange={e => onPhoneChange(e.target.value.replace(/\D/g, ''))}
                placeholder="98421 XXXXX"
                className="w-full pl-14 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-mono"
                id="customer-delivery-phone"
                required
              />
            </div>
          </div>
        )}

        {/* Special Delivery Instructions */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Special Instructions / Delivery Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={location.deliveryNotes || ''}
            onChange={e => onChange({ ...location, deliveryNotes: e.target.value })}
            placeholder="e.g. Ring door bell, patient is resting, hand over to daughter, etc."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            id="customer-delivery-notes"
          />
        </div>
      </div>
    </div>
  );
};
