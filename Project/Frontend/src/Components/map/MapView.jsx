import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useSimulationContext } from '../../context/SimulationContext'
import AgentCanvas from './AgentCanvas'
import ZoneOverlays from './ZoneOverlays'

// Fix Leaflet default marker icon issue with Vite
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapView() {
  const { mapCenter, pageState } = useSimulationContext()

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative'
    }}>
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapCenter.zoom || 12}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        {/* Dark OpenStreetMap tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          maxZoom={19}
        />

        {/* Map controller — handles center updates */}
        <MapController />

        {/* Zone overlays — polygons for red/amber/safe zones */}
        <ZoneOverlays />

        {/* Agent canvas overlay */}
        <AgentCanvas />
      </MapContainer>
    </div>
  )
}

// Inner component to access map instance and update center
function MapController() {
  const map = useMap()
  const { mapCenter, worldState } = useSimulationContext()
  const prevCenter = useRef(null)

  useEffect(() => {
    if (!mapCenter) return
    const key = `${mapCenter.lat},${mapCenter.lng}`
    if (prevCenter.current === key) return
    prevCenter.current = key

    map.flyTo(
      [mapCenter.lat, mapCenter.lng],
      mapCenter.zoom || 12,
      { duration: 1.5, easeLinearity: 0.25 }
    )
  }, [mapCenter, map])

  return null
}