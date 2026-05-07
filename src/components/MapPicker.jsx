import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Search, MapPin, Loader2 } from 'lucide-react';

// Fix Leaflet default icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

export const MapPicker = ({ onConfirm, onClose, title }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedData, setSelectedData] = useState(null);

  const handleLocationSelect = async (lat, lng) => {
    if (!mapInstance.current) return;

    setLoading(true);
    
    // Update marker
    if (markerInstance.current) {
      markerInstance.current.setLatLng([lat, lng]);
    } else {
      markerInstance.current = L.marker([lat, lng]).addTo(mapInstance.current);
    }

    try {
      // Reverse geocoding using Nominatim with English preference
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`);
      const data = await response.json();
      
      const addr = data.address || {};
      const street = addr.road || addr.suburb || addr.neighbourhood || '';
      const city = addr.city || addr.town || addr.village || addr.state_district || '';
      const zip = addr.postcode || '';
      const display_name = data.display_name || '';

      setSelectedData({
        lat,
        lng,
        address: display_name,
        street,
        city,
        zip
      });
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map
    mapInstance.current = L.map(mapRef.current).setView([23.8103, 90.4125], 13); // Default center

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapInstance.current);

    mapInstance.current.on('click', (e) => {
      handleLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    // Try to get live location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 16);
            handleLocationSelect(latitude, longitude);
          }
        },
        (error) => console.warn('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstance.current) return;

    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=en`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const nLat = parseFloat(lat);
        const nLng = parseFloat(lon);
        
        mapInstance.current.setView([nLat, nLng], 16);
        handleLocationSelect(nLat, nLng);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">Click on the map or search to select a location</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search for an address, city, or landmark..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 animate-spin" size={18} />}
          </form>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          {!selectedData && !loading && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-100 text-sm font-medium text-slate-600 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-600" />
                Click anywhere to drop a pin
              </div>
            </div>
          )}
        </div>

        {/* Footer / Selected Address */}
        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Selected Location</p>
              <p className="text-sm text-slate-700 font-medium line-clamp-2">
                {selectedData ? selectedData.address : 'No location selected yet'}
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={onClose}
                className="flex-1 md:flex-none px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!selectedData || loading}
                onClick={() => selectedData && onConfirm(selectedData)}
                className="flex-1 md:flex-none px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
