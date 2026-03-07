export interface TravelPhoto {
  url: string
  caption?: string
}

export interface TravelSpot {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  departureName: string
  departureLat: number
  departureLng: number
  date?: string
  photos: TravelPhoto[]
}

const SPOTS_KEY = 'travelSpots'

// 기본 여행 데이터
const DEFAULT_SPOTS: TravelSpot[] = [
  {
    id: 'tokyo',
    name: '도쿄',
    country: '일본',
    lat: 35.6762,
    lng: 139.6503,
    departureName: '인천/서울',
    departureLat: 37.4602,
    departureLng: 126.4407,
    date: '2024',
    photos: [
      { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600', caption: '도쿄 타워' },
      { url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600', caption: '시부야' },
    ],
  },
  {
    id: 'osaka',
    name: '오사카',
    country: '일본',
    lat: 34.6937,
    lng: 135.5023,
    departureName: '인천/서울',
    departureLat: 37.4602,
    departureLng: 126.4407,
    date: '2024',
    photos: [
      { url: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600', caption: '오사카성' },
    ],
  },
]

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return fallback
}

export function getSpots(): TravelSpot[] {
  return loadJSON(SPOTS_KEY, DEFAULT_SPOTS)
}

export function saveSpots(spots: TravelSpot[]) {
  localStorage.setItem(SPOTS_KEY, JSON.stringify(spots))
}

export function buildArcs(spots: TravelSpot[]) {
  return spots.map((spot) => ({
    startLat: spot.departureLat,
    startLng: spot.departureLng,
    endLat: spot.lat,
    endLng: spot.lng,
    fromName: spot.departureName,
    toName: spot.name,
    id: spot.id,
  }))
}
