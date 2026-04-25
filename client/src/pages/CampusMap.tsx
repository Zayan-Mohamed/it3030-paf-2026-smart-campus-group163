import * as React from 'react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import Map, { 
  Source, 
  Layer, 
  NavigationControl, 
  FullscreenControl, 
  GeolocateControl, 
  ScaleControl,
  Marker,
  Popup
} from 'react-map-gl/mapbox';
import type { FillLayer, MapLayerMouseEvent } from 'mapbox-gl';
import type { FeatureCollection, Geometry } from 'geojson';
import { MapPin, Info, Wrench, CalendarCheck } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import campusDataRaw from '../data/campus.json';
import { useAuth } from '../contexts/AuthContext';
import { getFacilities, getBookings } from '../lib/bookings';
import type { Facility, Booking } from '../types';

// ==========================================
// SECURITY & DEPLOYMENT INSTRUCTIONS
// ==========================================
/*
Content Security Policy (CSP) Requirements:
To allow Mapbox GL JS to render securely without unsafe-eval or unsafe-inline,
implement the following CSP directives in your deployment environment headers:

default-src 'self';
worker-src 'self' blob:;
child-src blob:;
img-src 'self' data: blob: https://api.mapbox.com;
connect-src 'self' https://api.mapbox.com https://events.mapbox.com;
style-src 'self' 'unsafe-inline' https://api.mapbox.com; (Note: mapbox-gl.css uses some inline styles, but restrict to minimum required)
*/

// ==========================================
// ZERO-TRUST DATA HANDLING: TYPE DEFINITIONS
// ==========================================
export interface CampusFeatureProperties {
  venue: string;
  name?: string;
  type?: string;
  // Sensitive fields - should be filtered backend or before map hydration
  security_cameras?: string[];
  server_room_location?: string;
  [key: string]: unknown; // Catch-all for other props, though we restrict access
}

export type CampusGeoJSON = FeatureCollection<Geometry, CampusFeatureProperties>;

const matchFacilityToFeature = (facility: Facility, featureProperties: Record<string, unknown> | null) => {
  if (!facility || !featureProperties || typeof featureProperties.name !== 'string') return false;
  
  const fName = facility.name.toLowerCase();
  const fLoc = (facility.location || '').toLowerCase();
  const geoName = featureProperties.name.toLowerCase();
  
  // 1. Direct name overlap
  if (geoName.includes(fName) || fName.includes(geoName)) return true;
  // 2. Direct location overlap
  if (fLoc && (geoName.includes(fLoc) || fLoc.includes(geoName))) return true;
  
  // 3. Advanced heuristics for mapping factual DB data (Rooms) to GeoJSON (Whole Buildings)
  if ((fName.includes('admin') || fLoc.includes('admin')) && geoName.includes('main office')) return true;
  if ((fName.includes('computing') || fLoc.includes('computing') || fLoc.includes('foc')) && geoName.includes('computing')) return true;
  if ((fName.includes('business') || fLoc.includes('business') || fLoc.includes('fobm')) && geoName.includes('business')) return true;
  if ((fName.includes('new building') || fLoc.includes('new building')) && geoName.includes('new building')) return true;
  if (fName.includes('auditorium') && geoName.includes('auditorium')) return true;
  if (fName.includes('tennis') && geoName.includes('tennis')) return true;
  if ((fName.includes('hospitality') || fName.includes('cahm')) && geoName.includes('hospitality')) return true;
  if (fName.includes('ground') && geoName.includes('grounds')) return true;

  return false;
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN;

export const CampusMap: React.FC = () => {
  const { token } = useAuth();
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; name: string } | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<{ 
    id: string; 
    name: string; 
    type?: string; 
    coords: [number, number];
    facilityInfo?: Facility;
    bookingInfo?: Booking[];
  } | null>(null);

  const [activeEvents, setActiveEvents] = useState<string[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<string[]>([]);
  const [dbFacilities, setDbFacilities] = useState<Facility[]>([]);
  const [dbBookings, setDbBookings] = useState<Booking[]>([]);

  const campusData: CampusGeoJSON = campusDataRaw as unknown as CampusGeoJSON;

  // Sync actual DB data
  useEffect(() => {
    async function loadFactualData() {
      if (!token) return;
      try {
        const [facsResponse, bksResponse] = await Promise.all([
          getFacilities(token),
          getBookings(token, { status: 'APPROVED' })
        ]);
        
        const facsResponseObj = facsResponse as { data?: Facility[] } | Facility[];
        const bksResponseObj = bksResponse as { data?: Booking[] } | Booking[];
        
        const facs = 'data' in facsResponseObj ? facsResponseObj.data || [] : facsResponseObj;
        const bks = 'data' in bksResponseObj ? bksResponseObj.data || [] : bksResponseObj;

        const facsArray = Array.isArray(facs) ? facs : [];
        const bksArray = Array.isArray(bks) ? bks : [];

        setDbFacilities(facsArray);
        setDbBookings(bksArray);

        const activeEventVenues: string[] = [];
        const maintenanceVenues: string[] = [];

        facsArray.forEach((f: Facility) => {
          const matchedFeature = campusData.features.find(feat => matchFacilityToFeature(f, feat.properties));

          if (matchedFeature) {
            if (f.status === 'UNDER_MAINTENANCE') {
              maintenanceVenues.push(matchedFeature.properties.venue);
            }
            
            const hasBookings = bksArray.some(b => b.facilityId === f.id);
            if (hasBookings) {
              activeEventVenues.push(matchedFeature.properties.venue);
            }
          }
        });

        setActiveEvents(Array.from(new Set(activeEventVenues)));
        setMaintenanceAlerts(Array.from(new Set(maintenanceVenues)));
      } catch (e) {
        console.error('Failed to load factual campus data', e);
      }
    }
    loadFactualData();
  }, [token, campusData]);

  // Dynamically determine colors based on external state matching venue_id
  const activeEventColor = '#10b981'; // Emerald 500
  const maintenanceColor = '#f59e0b'; // Amber 500
  const defaultColor = '#3b82f6'; // Blue 500

  // We use useMemo to calculate the dynamic style expression
  const buildingFillLayer = useMemo<FillLayer>(() => {
    return {
      id: 'campus-buildings',
      type: 'fill',
      source: 'campus-data',
      paint: {
        'fill-color': [
          'match',
          ['get', 'venue'],
          ...(activeEvents.length > 0 ? activeEvents.flatMap(id => [id, activeEventColor]) : ['__none__', activeEventColor]),
          ...(maintenanceAlerts.length > 0 ? maintenanceAlerts.flatMap(id => [id, maintenanceColor]) : ['__none__', maintenanceColor]),
          defaultColor
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': '#1e3a8a'
      }
    };
  }, [activeEvents, maintenanceAlerts]);

  const onMouseMove = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (feature && feature.properties) {
      setHoverInfo({
        x: event.point.x,
        y: event.point.y,
        name: feature.properties.name || 'Unknown Building'
      });
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  const onClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (feature && feature.properties) {
      const matchedFac = dbFacilities.find(f => matchFacilityToFeature(f, feature.properties));

      const matchedBookings = matchedFac ? dbBookings.filter(b => b.facilityId === matchedFac.id) : [];

      setSelectedVenue({
        id: feature.properties.venue,
        name: feature.properties.name || 'Unknown Location',
        type: matchedFac ? matchedFac.facilityType : (feature.properties.type || 'General'),
        coords: [event.lngLat.lng, event.lngLat.lat],
        facilityInfo: matchedFac,
        bookingInfo: matchedBookings
      });
    }
  }, [dbFacilities, dbBookings]);

  // Compute markers based on our JSON's first coordinate for a rough visual center
  const markers = useMemo(() => {
    return campusData.features.map((feature, idx) => {
      // Find a coordinate to place the marker
      let lng, lat;
      if (feature.geometry.type === 'Point') {
        lng = feature.geometry.coordinates[0];
        lat = feature.geometry.coordinates[1];
      } else if (feature.geometry.type === 'Polygon') {
        lng = feature.geometry.coordinates[0][0][0];
        lat = feature.geometry.coordinates[0][0][1];
      } else if (feature.geometry.type === 'LineString') {
        lng = feature.geometry.coordinates[0][0];
        lat = feature.geometry.coordinates[0][1];
      }

      if (!lng || !lat || !feature.properties?.venue) return null;
      
      const venueId = feature.properties.venue;
      const isMaintenance = maintenanceAlerts.includes(venueId);
      const isEvent = activeEvents.includes(venueId);

      let Icon = MapPin;
      let colorClass = "text-blue-600 drop-shadow-md";
      
      if (isMaintenance) {
        Icon = Wrench;
        colorClass = "text-amber-600 drop-shadow-md";
      } else if (isEvent) {
        Icon = CalendarCheck;
        colorClass = "text-emerald-600 drop-shadow-md";
      }

      return (
        <Marker
          key={`${venueId}-${idx}`}
          longitude={lng as number}
          latitude={lat as number}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            const matchedFac = dbFacilities.find(f => matchFacilityToFeature(f, feature.properties));
            const matchedBookings = matchedFac ? dbBookings.filter(b => b.facilityId === matchedFac.id) : [];

            setSelectedVenue({
              id: venueId,
              name: feature.properties?.name || 'Unknown Location',
              type: matchedFac ? matchedFac.facilityType : (feature.properties?.type || 'General'),
              coords: [lng as number, lat as number],
              facilityInfo: matchedFac,
              bookingInfo: matchedBookings
            });
          }}
        >
          <div className="cursor-pointer hover:scale-110 transition-transform duration-200">
            <Icon className={colorClass} size={28} />
          </div>
        </Marker>
      );
    }).filter(Boolean);
  }, [campusData, activeEvents, maintenanceAlerts, dbFacilities, dbBookings]);

  // Secret Management & Graceful Degradation
  if (!MAPBOX_TOKEN) {
    console.error('Security Alert: VITE_MAPBOX_TOKEN is missing from environment variables.');
    return (
      <div className="flex h-full min-h-[500px] w-full items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
        <div className="text-center p-6 max-w-md text-slate-600">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Map Configuration Error</h3>
          <p>The campus map cannot be displayed due to a missing API token. Please contact the system administrator.</p>
        </div>
      </div>
    );
  }

  // Resource Exhaustion Prevention (Hardcoded restrictions)
  const MAX_BOUNDS: [number, number, number, number] = [
    79.965, 6.905, // Southwest coordinates (approx bounds around Malabe SLIIT campus)
    79.985, 6.925  // Northeast coordinates
  ];

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg border border-slate-200">
      
      {/* Interactive Legend overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-md border border-slate-200 pointer-events-none">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Info size={18} className="text-blue-500"/> Campus Key</h3>
        <div className="flex flex-col gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-blue-500 border border-blue-600"></div>
            <span>Standard Facility</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-emerald-500 border border-emerald-600"></div>
            <span>Active Event (<span className="font-semibold text-emerald-600">{activeEvents.length}</span>)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-amber-500 border border-amber-600"></div>
            <span>Under Maintenance (<span className="font-semibold text-amber-600">{maintenanceAlerts.length}</span>)</span>
          </div>
        </div>
      </div>

      <Map
        initialViewState={{
          longitude: 79.973,
          latitude: 6.915,
          zoom: 17,
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={['campus-buildings']}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        minZoom={15}
        maxZoom={20}
        maxBounds={MAX_BOUNDS}
        cursor={hoverInfo ? 'pointer' : 'grab'}
      >
        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" visualizePitch={true} />
        <GeolocateControl position="top-right" />
        <ScaleControl position="bottom-right" />

        <Source id="campus-data" type="geojson" data={campusData}>
          <Layer {...buildingFillLayer} />
        </Source>

        {markers}

        {/* Hover Tooltip tooltip */}
        {hoverInfo && !selectedVenue && (
          <div className="absolute z-20 bg-slate-900 text-white text-xs font-medium py-1 px-2 rounded pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px] shadow-lg" style={{ left: hoverInfo.x, top: hoverInfo.y }}>
            {hoverInfo.name}
            <div className="absolute left-1/2 bottom-[-4px] transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
          </div>
        )}

        {/* Click Popup Card */}
        {selectedVenue && (
          <Popup
            longitude={selectedVenue.coords[0]}
            latitude={selectedVenue.coords[1]}
            anchor="bottom"
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedVenue(null)}
            offset={30}
            className="z-30 rounded-lg overflow-hidden shadow-xl border-none"
            maxWidth="320px"
          >
            <div className="p-1 min-w-[200px] max-h-[300px] overflow-y-auto">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-base m-0 leading-tight pr-4">{selectedVenue.name}</h3>
              </div>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center text-slate-600">
                  <span className="font-medium text-slate-500 mr-2 text-xs uppercase tracking-wider">Type:</span> 
                  <span className="capitalize">{selectedVenue.type?.replace(/_/g, ' ')}</span>
                </div>
                
                {selectedVenue.facilityInfo && (
                  <div className="flex items-center text-slate-600">
                    <span className="font-medium text-slate-500 mr-2 text-xs uppercase tracking-wider">Capacity:</span> 
                    <span>{selectedVenue.facilityInfo.capacity} people</span>
                  </div>
                )}

                {activeEvents.includes(selectedVenue.id) && selectedVenue.bookingInfo && selectedVenue.bookingInfo.length > 0 && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-2 rounded-md flex items-start gap-2">
                    <CalendarCheck size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wide">Live Events</p>
                      <ul className="text-xs list-disc pl-3 mt-1">
                        {selectedVenue.bookingInfo.map(b => (
                          <li key={b.id}>
                            <strong>{b.facilityName}</strong>: {b.purpose}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {maintenanceAlerts.includes(selectedVenue.id) && (
                  <div className="mt-2 bg-amber-50 border border-amber-100 text-amber-700 px-3 py-2 rounded-md flex items-start gap-2">
                    <Wrench size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wide">Maintenance Alert</p>
                      <p className="text-xs">Facilities team is operating in this area.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};