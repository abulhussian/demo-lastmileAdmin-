import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { api } from '../../lib/api';
import {
  MapPin,
  Trash2,
  Plus,
  Compass,
  Layers,
  UserCheck,
  CheckCircle,
  X,
  RotateCcw,
  Navigation,
  Sparkles,
  Info,
  Pencil,
  Check,
  Search,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Fix Leaflet marker icons
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

export const AdminZones = () => {
  const { drivers, fetchDrivers, showToast } = useLogistics();
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  
  // Mapping of driverId -> array of zoneIds
  const [driverZonesMap, setDriverZonesMap] = useState({});
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Driver Assignment flow states
  const [isEditingDrivers, setIsEditingDrivers] = useState(false);
  const [tempAssignedDrivers, setTempAssignedDrivers] = useState([]); // Array of driver IDs

  // Map Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditingBoundary, setIsEditingBoundary] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]); // Array of L.LatLng
  const [newZoneName, setNewZoneName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingZone, setSavingZone] = useState(false);
  const [updatingZone, setUpdatingZone] = useState(false);
  
  // Location Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const zonesGroupRef = useRef(null);
  const activeDrawGroupRef = useRef(null);

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstance.current) return;

    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=en`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const nLat = parseFloat(lat);
        const nLng = parseFloat(lon);
        
        mapInstance.current.setView([nLat, nLng], 15);
        showToast(`Centered map on: ${data[0].display_name}`, 'success');
      } else {
        showToast('Location not found', 'error');
      }
    } catch (error) {
      console.error('Search error:', error);
      showToast('Error searching for location', 'error');
    } finally {
      setSearchingLocation(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchDrivers();
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoadingZones(true);
      const res = await api.get('/zones');
      if (res && res.success && res.data) {
        setZones(res.data);
      } else if (res && res.data) {
        setZones(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err);
      showToast('Failed to load zones', 'error');
    } finally {
      setLoadingZones(false);
    }
  };

  // Fetch driver assignments
  useEffect(() => {
    if (drivers && drivers.length > 0) {
      loadDriverAssignments();
    }
  }, [drivers]);

  const loadDriverAssignments = async () => {
    setLoadingAssignments(true);
    const mapping = {};
    try {
      await Promise.all(
        drivers.map(async (driver) => {
          try {
            const res = await api.get(`/zones/driver/${driver.id}`);
            if (res && res.data) {
              mapping[driver.id] = res.data.map(z => z.id);
            }
          } catch (e) {
            console.error(`Error loading zones for driver ${driver.id}:`, e);
          }
        })
      );
      setDriverZonesMap(mapping);
    } catch (err) {
      console.error('Error fetching driver assignments:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Setup Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstance.current = L.map(mapRef.current).setView([24.7136, 46.6753], 12); // Default center (Riyadh)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapInstance.current);

    zonesGroupRef.current = L.featureGroup().addTo(mapInstance.current);
    activeDrawGroupRef.current = L.featureGroup().addTo(mapInstance.current);

    // Clean up
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map click handler depending on isDrawing mode
  useEffect(() => {
    if (!mapInstance.current) return;

    const onMapClick = (e) => {
      if (!isDrawing) return;
      setDrawPoints((prev) => [...prev, e.latlng]);
    };

    mapInstance.current.off('click');
    mapInstance.current.on('click', onMapClick);
  }, [isDrawing]);

  // Render zones polygons on map
  useEffect(() => {
    if (!mapInstance.current || !zonesGroupRef.current) return;

    // Clear old polygons
    zonesGroupRef.current.clearLayers();

    zones.forEach((zone) => {
      // Backend coordinates are [[lng, lat], [lng, lat], ...]
      const leafletCoords = zone.coordinates.map(pt => [pt[1], pt[0]]);
      
      const isSelected = selectedZone?.id === zone.id;

      const polygon = L.polygon(leafletCoords, {
        color: isSelected ? '#4f46e5' : '#818cf8',
        fillColor: isSelected ? '#4f46e5' : '#c7d2fe',
        fillOpacity: isSelected ? 0.4 : 0.2,
        weight: isSelected ? 3 : 1.5,
      }).addTo(zonesGroupRef.current);

      polygon.on('click', () => {
        setSelectedZone(zone);
        setIsDrawing(false);
        setIsEditingBoundary(false);
        setDrawPoints([]);
        setIsEditingDrivers(false);
      });

      polygon.bindTooltip(zone.name, {
        permanent: true,
        direction: 'center',
        className: 'bg-white/95 backdrop-blur px-2 py-0.5 rounded shadow text-xs font-bold border border-indigo-100 text-slate-800'
      });
    });

    // Fit map bounds to zones if available
    if (zones.length > 0 && !selectedZone && !isDrawing) {
      try {
        const bounds = zonesGroupRef.current.getBounds();
        if (bounds.isValid()) {
          mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (err) {
        console.warn('Could not fit bounds:', err);
      }
    }
  }, [zones, selectedZone, isDrawing]);

  // Handle selected zone camera centering
  useEffect(() => {
    if (selectedZone && mapInstance.current && !isEditingBoundary) {
      const leafletCoords = selectedZone.coordinates.map(pt => [pt[1], pt[0]]);
      const tempPolygon = L.polygon(leafletCoords);
      mapInstance.current.fitBounds(tempPolygon.getBounds(), { maxZoom: 14, padding: [40, 40] });
    }
  }, [selectedZone, isEditingBoundary]);

  // Render active drawing state on map
  useEffect(() => {
    if (!activeDrawGroupRef.current) return;

    activeDrawGroupRef.current.clearLayers();

    if (drawPoints.length === 0) return;

    // Draw lines
    if (drawPoints.length > 1) {
      L.polyline(drawPoints, { color: '#ec4899', weight: 3, dashArray: '5, 5' }).addTo(activeDrawGroupRef.current);
    }

    // Draw vertex markers
    drawPoints.forEach((pt, idx) => {
      L.circleMarker(pt, {
        radius: 6,
        fillColor: '#ec4899',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      }).addTo(activeDrawGroupRef.current);
    });

    // Close preview if we have more than 2 points
    if (drawPoints.length > 2) {
      L.polygon([...drawPoints, drawPoints[0]], {
        color: '#ec4899',
        fillColor: '#fbcfe8',
        fillOpacity: 0.2,
        weight: 0
      }).addTo(activeDrawGroupRef.current);
    }
  }, [drawPoints]);

  const handleStartDrawing = () => {
    setSelectedZone(null);
    setIsDrawing(true);
    setIsEditingBoundary(false);
    setDrawPoints([]);
    setIsEditingDrivers(false);
    showToast('Click points on the map to define the polygon boundary', 'info');
  };

  const handleEditBoundary = () => {
    if (!selectedZone) return;
    setIsEditingBoundary(true);
    setIsDrawing(true);
    setIsEditingDrivers(false);
    
    let coords = selectedZone.coordinates;
    if (coords.length > 1) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) {
        coords = coords.slice(0, -1);
      }
    }
    setDrawPoints(coords.map(pt => L.latLng(pt[1], pt[0])));
    showToast('Modify the zone boundary points on the map, then click Save changes', 'info');
  };

  const handleUndoPoint = () => {
    setDrawPoints((prev) => prev.slice(0, -1));
  };

  const handleClearDrawing = () => {
    setDrawPoints([]);
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setIsEditingBoundary(false);
    setDrawPoints([]);
    setSearchQuery('');
  };

  const handleSaveDrawing = () => {
    if (drawPoints.length < 3) {
      showToast('Polygons require at least 3 vertices', 'error');
      return;
    }
    if (isEditingBoundary) {
      submitUpdateZone();
    } else {
      setShowSaveModal(true);
    }
  };

  const submitUpdateZone = async () => {
    setUpdatingZone(true);
    try {
      const coordinates = drawPoints.map(p => [p.lng, p.lat]);
      const res = await api.put(`/zones/${selectedZone.id}`, {
        name: selectedZone.name,
        coordinates
      });
      if (res && res.success) {
        showToast('Zone boundary updated successfully', 'success');
        setIsEditingBoundary(false);
        setIsDrawing(false);
        setDrawPoints([]);
        setSearchQuery('');
        setSelectedZone(res.data);
        fetchZones();
      } else {
        throw new Error(res.message || 'Failed to update zone boundary');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update zone boundary', 'error');
    } finally {
      setUpdatingZone(false);
    }
  };

  const submitNewZone = async () => {
    if (!newZoneName.trim()) {
      showToast('Please enter a zone name', 'error');
      return;
    }
    setSavingZone(true);
    try {
      // Backend expects: [[lng, lat], [lng, lat], ...]
      const coordinates = drawPoints.map(p => [p.lng, p.lat]);
      
      const res = await api.post('/zones', {
        name: newZoneName.trim(),
        coordinates
      });

      if (res && res.success) {
        showToast('Zone created successfully', 'success');
        setNewZoneName('');
        setShowSaveModal(false);
        setIsDrawing(false);
        setDrawPoints([]);
        setSearchQuery('');
        fetchZones();
      } else {
        throw new Error(res.message || 'Error creating zone');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to save zone', 'error');
    } finally {
      setSavingZone(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Are you sure you want to delete this zone? All driver mappings to this zone will be cleared.')) return;
    try {
      const res = await api.delete(`/zones/${zoneId}`);
      if (res && res.success) {
        showToast('Zone deleted successfully', 'success');
        setSelectedZone(null);
        fetchZones();
        loadDriverAssignments();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete zone', 'error');
    }
  };

  // Driver Assignment Edit Flow
  const handleStartEditDrivers = () => {
    if (!selectedZone) return;
    setIsEditingDrivers(true);
    // Gather all currently assigned driver ids
    const currentAssigned = drivers
      .filter(d => (driverZonesMap[d.id] || []).includes(selectedZone.id))
      .map(d => d.id);
    setTempAssignedDrivers(currentAssigned);
  };

  const handleToggleDriverDraft = (driverId) => {
    setTempAssignedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId) 
        : [...prev, driverId]
    );
  };

  const handleSaveDrivers = async () => {
    if (!selectedZone) return;
    setLoadingAssignments(true);
    try {
      await Promise.all(
        drivers.map(async (driver) => {
          const wasAssigned = (driverZonesMap[driver.id] || []).includes(selectedZone.id);
          const isNowAssigned = tempAssignedDrivers.includes(driver.id);
          
          if (wasAssigned !== isNowAssigned) {
            if (isNowAssigned) {
              // If the driver is currently assigned to some other zone, clear it first
              const otherZones = (driverZonesMap[driver.id] || []).filter(id => id !== selectedZone.id);
              if (otherZones.length > 0) {
                await api.post('/zones/assign', {
                  driverId: driver.id,
                  zoneIds: []
                });
              }
              // Now assign to this zone
              await api.post('/zones/assign', {
                driverId: driver.id,
                zoneIds: [selectedZone.id]
              });
            } else {
              // Unassign from this zone
              const remainingZones = (driverZonesMap[driver.id] || []).filter(id => id !== selectedZone.id);
              await api.post('/zones/assign', {
                driverId: driver.id,
                zoneIds: remainingZones
              });
            }
          }
        })
      );
      showToast('Driver assignments updated successfully', 'success');
      setIsEditingDrivers(false);
      await loadDriverAssignments();
    } catch (err) {
      console.error(err);
      showToast('Failed to update driver assignments', 'error');
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Count drivers assigned to a specific zone
  const getZoneDriverCount = (zoneId) => {
    return Object.values(driverZonesMap).filter(zonesList => zonesList.includes(zoneId)).length;
  };

  return (
    <MainLayout title="Zones Management">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-140px)] min-h-[600px]">
        
        {/* Left column: List of Zones */}
        <div className="xl:col-span-3 flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-md font-bold text-slate-900">Registered Zones</h2>
              <p className="text-[11px] text-slate-500">Configure regions & allocation boundaries</p>
            </div>
            {!isDrawing && (
              <button
                onClick={handleStartDrawing}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center gap-1 text-xs font-bold shadow-sm"
              >
                <Plus size={14} />
                <span>Draw</span>
              </button>
            )}
          </div>

          {isDrawing && (
            <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-indigo-600">
                <Compass size={14} className="animate-spin" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {isEditingBoundary ? 'Editing Boundary' : 'Zone Drawing Mode'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {isEditingBoundary 
                  ? 'Drag or clear points to adjust the polygon zone perimeter.' 
                  : 'Click points on the map to define the coordinates.'}
              </p>

              <form onSubmit={handleSearchLocation} className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search location to draw..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-[10px] font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchingLocation ? (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-600 animate-spin" size={12} />
                ) : (
                  searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={11} />
                    </button>
                  )
                )}
              </form>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  disabled={drawPoints.length === 0}
                  onClick={handleUndoPoint}
                  className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw size={10} />
                  <span>Undo</span>
                </button>
                <button
                  disabled={drawPoints.length === 0}
                  onClick={handleClearDrawing}
                  className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold bg-white text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={10} />
                  <span>Clear</span>
                </button>
                <button
                  onClick={handleCancelDrawing}
                  className="py-1.5 text-[10px] font-bold bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={drawPoints.length < 3 || updatingZone}
                  onClick={handleSaveDrawing}
                  className="py-1.5 text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check size={10} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          )}

          {loadingZones ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-xs font-semibold">Loading zones...</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {zones.length === 0 ? (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                  <Layers size={24} className="opacity-50" />
                  <p className="text-xs font-semibold">No zones created yet</p>
                </div>
              ) : (
                zones.map((zone) => {
                  const isSelected = selectedZone?.id === zone.id;
                  const driverCount = getZoneDriverCount(zone.id);
                  return (
                    <div
                      key={zone.id}
                      onClick={() => {
                        setSelectedZone(zone);
                        setIsDrawing(false);
                        setIsEditingBoundary(false);
                        setIsEditingDrivers(false);
                      }}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group",
                        isSelected 
                          ? "border-indigo-600 bg-indigo-50/15" 
                          : "border-slate-150 hover:border-slate-350 hover:bg-slate-50/50"
                      )}
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{zone.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Navigation size={10} />
                            {zone.coordinates.length} vertices
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-indigo-600 font-bold">
                            {driverCount} {driverCount === 1 ? 'driver' : 'drivers'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(zone.id);
                        }}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Center: Map Area */}
        <div className="xl:col-span-5 flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden relative">
          <div ref={mapRef} className="w-full h-full z-10" />

          {/* Quick instructions HUD */}
          {isDrawing && (
            <div className="absolute top-4 left-4 z-[999] bg-slate-950/80 backdrop-blur border border-slate-800 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow flex items-center gap-2">
              <Sparkles className="text-indigo-400 animate-pulse" size={12} />
              <span>Left-click on the map to define polygon zone path.</span>
            </div>
          )}
        </div>

        {/* Right column: Zone Info & Driver allocations */}
        <div className="xl:col-span-4 flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl p-5 overflow-hidden">
          {selectedZone ? (
            <div className="flex flex-col h-full">
              
              {/* Zone Header and Details */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-950 truncate">{selectedZone.name} Details</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Manage drivers mapped to this boundary</p>
                </div>
                <div className="flex items-center gap-1">
                  {!isEditingBoundary && !isDrawing && (
                    <button
                      onClick={handleEditBoundary}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold border border-slate-200"
                    >
                      <Pencil size={12} />
                      <span>Edit Boundary</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedZone(null);
                      setIsEditingDrivers(false);
                      setIsEditingBoundary(false);
                      setIsDrawing(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Allocated drivers */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-indigo-600" />
                    <span>Allocated Drivers</span>
                  </h4>
                  
                  {isEditingDrivers ? (
                    <button
                      onClick={handleSaveDrivers}
                      disabled={loadingAssignments}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={11} />
                      <span>Done</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStartEditDrivers}
                      className="px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Pencil size={11} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {drivers.map((driver) => {
                    const isAssigned = isEditingDrivers 
                      ? tempAssignedDrivers.includes(driver.id)
                      : (driverZonesMap[driver.id] || []).includes(selectedZone.id);
                    const otherZoneIds = (driverZonesMap[driver.id] || []).filter(id => id !== selectedZone.id);
                    const hasOtherZone = otherZoneIds.length > 0;
                    const otherZoneObj = hasOtherZone ? zones.find(z => z.id === otherZoneIds[0]) : null;

                    return (
                      <div
                        key={driver.id}
                        onClick={() => {
                          if (isEditingDrivers) {
                            handleToggleDriverDraft(driver.id);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border flex items-center justify-between transition-all",
                          isEditingDrivers ? "cursor-pointer" : "cursor-default",
                          isAssigned 
                            ? "border-indigo-200 bg-indigo-50/10" 
                            : "border-slate-100 hover:border-slate-200 bg-white"
                        )}
                      >
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{driver.name}</h5>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                              {driver.vehicleNumber || 'No plate'}
                            </p>
                            {hasOtherZone && otherZoneObj && (
                              <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-150 px-1.5 py-0.5 rounded-full mt-1 self-start w-fit">
                                <Compass size={10} className="shrink-0 text-amber-500" />
                                <span>Zone: {otherZoneObj.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {isAssigned ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full">
                            <CheckCircle size={12} fill="currentColor" className="text-white fill-indigo-600" />
                            <span>Assigned</span>
                          </div>
                        ) : (
                          isEditingDrivers && (
                            <span className="text-[10px] text-slate-400 font-bold hover:text-indigo-600">Assign</span>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 px-4">
              <Compass size={36} className="text-indigo-500 mb-3" />
              <h3 className="text-xs font-bold text-slate-700">No Zone Selected</h3>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[240px] leading-relaxed">
                Click on a zone boundary on the map or select a zone from the registered zones list to manage driver allocations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Zone Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-950">Save Boundary Zone</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone Name</label>
              <input
                type="text"
                placeholder="e.g. Riyadh East, Sector 4"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
              <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                The boundary will be validated for overlaps and intersections with existing zones before saving.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={savingZone}
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={savingZone || !newZoneName.trim()}
                onClick={submitNewZone}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {savingZone ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Zone</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
