import { supabase } from '../lib/supabase'

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

// Supabase 테이블의 snake_case → 코드의 camelCase 변환
interface SpotRow {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  departure_name: string
  departure_lat: number
  departure_lng: number
  date: string | null
  photos: TravelPhoto[]
}

function rowToSpot(row: SpotRow): TravelSpot {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    lat: row.lat,
    lng: row.lng,
    departureName: row.departure_name,
    departureLat: row.departure_lat,
    departureLng: row.departure_lng,
    date: row.date ?? undefined,
    photos: row.photos ?? [],
  }
}

function spotToRow(spot: TravelSpot): Omit<SpotRow, 'id'> & { id: string } {
  return {
    id: spot.id,
    name: spot.name,
    country: spot.country,
    lat: spot.lat,
    lng: spot.lng,
    departure_name: spot.departureName,
    departure_lat: spot.departureLat,
    departure_lng: spot.departureLng,
    date: spot.date ?? null,
    photos: spot.photos,
  }
}

export async function getSpots(): Promise<TravelSpot[]> {
  const { data, error } = await supabase
    .from('travel_spots')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch travel spots:', error)
    return []
  }

  return (data as SpotRow[]).map(rowToSpot)
}

export async function addSpot(spot: TravelSpot): Promise<boolean> {
  const { error } = await supabase
    .from('travel_spots')
    .insert(spotToRow(spot))

  if (error) {
    console.error('Failed to add travel spot:', error)
    return false
  }
  return true
}

export async function deleteSpot(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('travel_spots')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete travel spot:', error)
    return false
  }
  return true
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
