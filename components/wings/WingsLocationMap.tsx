'use client'

import { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { AlertCircle } from 'lucide-react'

const CO_UNB = { lat: -15.7622, lng: -47.8595 }

// Dark map style — navy/red/yellow, integrado ao layout WFL do site.
const WFL_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#022755' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#022755' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9aa6bd' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#0d3a78' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#03306a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#063b6f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#F6E331' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0a3c75' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#022755' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#0f4a8a' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#E30D3F' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0a3460' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#01193a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7fb3ff' }] },
]

// Contorno mapeado no Strava — CO UnB, 2026-04-28
const TRACK_PATH = [{"lat":-15.75998,"lng":-47.86276},{"lat":-15.75992,"lng":-47.86272},{"lat":-15.75983,"lng":-47.86259},{"lat":-15.75979,"lng":-47.86235},{"lat":-15.75979,"lng":-47.86236},{"lat":-15.75978,"lng":-47.86231},{"lat":-15.75986,"lng":-47.86204},{"lat":-15.75983,"lng":-47.86189},{"lat":-15.75983,"lng":-47.86175},{"lat":-15.75979,"lng":-47.86154},{"lat":-15.75979,"lng":-47.86131},{"lat":-15.75987,"lng":-47.86059},{"lat":-15.75994,"lng":-47.86025},{"lat":-15.75998,"lng":-47.85974},{"lat":-15.7601,"lng":-47.85892},{"lat":-15.76011,"lng":-47.85887},{"lat":-15.76006,"lng":-47.85857},{"lat":-15.76006,"lng":-47.85828},{"lat":-15.75998,"lng":-47.85803},{"lat":-15.75999,"lng":-47.85803},{"lat":-15.75987,"lng":-47.85786},{"lat":-15.75978,"lng":-47.85779},{"lat":-15.75974,"lng":-47.85778},{"lat":-15.75975,"lng":-47.85778},{"lat":-15.75951,"lng":-47.8577},{"lat":-15.75945,"lng":-47.85762},{"lat":-15.75941,"lng":-47.85748},{"lat":-15.75944,"lng":-47.85738},{"lat":-15.75953,"lng":-47.85701},{"lat":-15.75955,"lng":-47.8569},{"lat":-15.75964,"lng":-47.85668},{"lat":-15.75967,"lng":-47.85655},{"lat":-15.75978,"lng":-47.85599},{"lat":-15.75978,"lng":-47.85596},{"lat":-15.75984,"lng":-47.8559},{"lat":-15.75997,"lng":-47.85584},{"lat":-15.76003,"lng":-47.85587},{"lat":-15.76008,"lng":-47.85588},{"lat":-15.76009,"lng":-47.85588},{"lat":-15.76068,"lng":-47.85589},{"lat":-15.76138,"lng":-47.85597},{"lat":-15.7617,"lng":-47.85602},{"lat":-15.76192,"lng":-47.85604},{"lat":-15.76193,"lng":-47.85604},{"lat":-15.76209,"lng":-47.85605},{"lat":-15.76253,"lng":-47.856145},{"lat":-15.76297,"lng":-47.85624},{"lat":-15.7633,"lng":-47.85618},{"lat":-15.76356,"lng":-47.85617},{"lat":-15.76368,"lng":-47.85616},{"lat":-15.76438,"lng":-47.85629},{"lat":-15.76448,"lng":-47.85634},{"lat":-15.76449,"lng":-47.85634},{"lat":-15.76486,"lng":-47.85652},{"lat":-15.76487,"lng":-47.85652},{"lat":-15.76494,"lng":-47.85661},{"lat":-15.765,"lng":-47.85679},{"lat":-15.76502,"lng":-47.85695},{"lat":-15.76502,"lng":-47.85696},{"lat":-15.76504,"lng":-47.85728},{"lat":-15.76499,"lng":-47.85746},{"lat":-15.76487,"lng":-47.85759},{"lat":-15.76499,"lng":-47.85746},{"lat":-15.76504,"lng":-47.85728},{"lat":-15.765,"lng":-47.85679},{"lat":-15.76494,"lng":-47.85661},{"lat":-15.76485,"lng":-47.8565},{"lat":-15.76438,"lng":-47.85629},{"lat":-15.76368,"lng":-47.85616},{"lat":-15.7633,"lng":-47.85618},{"lat":-15.76297,"lng":-47.85624},{"lat":-15.7633,"lng":-47.85618},{"lat":-15.76368,"lng":-47.85616},{"lat":-15.76438,"lng":-47.85629},{"lat":-15.76485,"lng":-47.8565},{"lat":-15.76494,"lng":-47.85661},{"lat":-15.765,"lng":-47.85679},{"lat":-15.76504,"lng":-47.85728},{"lat":-15.76499,"lng":-47.85746},{"lat":-15.76487,"lng":-47.85759},{"lat":-15.76476,"lng":-47.85779},{"lat":-15.76475,"lng":-47.8579},{"lat":-15.76475,"lng":-47.85797},{"lat":-15.76465,"lng":-47.85816},{"lat":-15.76462,"lng":-47.85829},{"lat":-15.76447,"lng":-47.85846},{"lat":-15.7644,"lng":-47.85852},{"lat":-15.76414,"lng":-47.8587},{"lat":-15.7637,"lng":-47.85922},{"lat":-15.76342,"lng":-47.85956},{"lat":-15.76339,"lng":-47.85969},{"lat":-15.7633,"lng":-47.85987},{"lat":-15.76325,"lng":-47.85994},{"lat":-15.76317,"lng":-47.86003},{"lat":-15.76317,"lng":-47.86008},{"lat":-15.76316,"lng":-47.86025},{"lat":-15.76312,"lng":-47.8603},{"lat":-15.76307,"lng":-47.86037},{"lat":-15.76247,"lng":-47.86105},{"lat":-15.76231,"lng":-47.86144},{"lat":-15.7623,"lng":-47.86154},{"lat":-15.76228,"lng":-47.86171},{"lat":-15.76208,"lng":-47.86216},{"lat":-15.762,"lng":-47.86225},{"lat":-15.76189,"lng":-47.8623},{"lat":-15.76176,"lng":-47.86244},{"lat":-15.76138,"lng":-47.86285},{"lat":-15.76136,"lng":-47.86287},{"lat":-15.76081,"lng":-47.86312},{"lat":-15.76079,"lng":-47.86312},{"lat":-15.7608,"lng":-47.86312},{"lat":-15.76059,"lng":-47.8631},{"lat":-15.76045,"lng":-47.86301},{"lat":-15.76029,"lng":-47.86296},{"lat":-15.75999,"lng":-47.86277}]


declare global {
  interface Window {
    __wflMapsConfigured?: boolean
  }
}

type Props = {
  height?: string
}

export default function WingsLocationMap({ height = '420px' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID

    if (!apiKey) {
      setError('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurada')
      setLoading(false)
      return
    }

    async function init() {
      try {
        if (!window.__wflMapsConfigured) {
          setOptions({
            key: apiKey!,
            mapIds: mapId ? [mapId] : undefined,
          })
          window.__wflMapsConfigured = true
        }

        await importLibrary('maps')
        await importLibrary('marker')

        if (cancelled || !containerRef.current) return

        const google = window.google

        const map = new google.maps.Map(containerRef.current, {
          center: CO_UNB,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
          backgroundColor: '#022755',
          mapId: mapId || undefined,
          styles: mapId ? undefined : WFL_MAP_STYLES,
        })

        // Marker custom — pino vermelho WFL com pulse
        const pinElement = document.createElement('div')
        pinElement.innerHTML = `
          <div style="position: relative; width: 56px; height: 56px;">
            <div style="
              position: absolute; inset: 0; border-radius: 9999px;
              background: #E30D3F; opacity: 0.25;
              animation: wflPulse 2s ease-out infinite;
            "></div>
            <div style="
              position: absolute; top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              width: 28px; height: 28px; border-radius: 9999px;
              background: #E30D3F; border: 3px solid #F6E331;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            "></div>
          </div>
          <style>
            @keyframes wflPulse {
              0%   { transform: scale(0.6); opacity: 0.6; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          </style>
        `

        // Usa AdvancedMarkerElement se disponível (requer mapId), senão fallback
        const AdvancedMarker = (google.maps as unknown as {
          marker?: { AdvancedMarkerElement?: new (opts: object) => google.maps.marker.AdvancedMarkerElement }
        }).marker?.AdvancedMarkerElement

        if (mapId && AdvancedMarker) {
          new AdvancedMarker({
            map,
            position: CO_UNB,
            content: pinElement,
            title: 'Pista de Atletismo — CO UnB',
          })
        } else {
          new google.maps.Marker({
            map,
            position: CO_UNB,
            title: 'Pista de Atletismo — CO UnB',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#E30D3F',
              fillOpacity: 1,
              strokeColor: '#F6E331',
              strokeWeight: 3,
            },
          })
        }

        // Contorno do espaço demarcado (traçado no Strava)
        new google.maps.Polyline({
          map,
          path: TRACK_PATH,
          strokeColor: '#E30D3F',
          strokeOpacity: 1,
          strokeWeight: 4,
          geodesic: true,
        })

        // Ajusta o mapa para o bounding box do percurso
        const bounds = new google.maps.LatLngBounds()
        TRACK_PATH.forEach(p => bounds.extend(p))
        map.fitBounds(bounds, 40)

        setLoading(false)
      } catch (e) {
        console.error('[wings/map]', e)
        if (!cancelled) {
          setError((e as Error).message || 'Erro ao carregar mapa')
          setLoading(false)
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div
        className="bg-wfl-navy/95 border border-wfl-border/30 flex items-center justify-center text-white/80 px-6 text-center"
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0 bg-wfl-navy" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-wfl-navy/80 text-white/70 text-sm tracking-wider uppercase">
          Carregando mapa…
        </div>
      )}
    </div>
  )
}
