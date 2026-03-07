import { useRef, useState, useEffect, useCallback, type ChangeEvent } from 'react'
import Globe from 'react-globe.gl'
import {
  getSpots, saveSpots,
  buildArcs,
} from '../data/travels'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useBlogTheme } from '../context/BlogThemeContext'
import type { TravelSpot } from '../data/travels'
import styles from './TravelGlobe.module.css'

function createPinElement(name: string, color: string, isHome: boolean) {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;pointer-events:auto;'

  const pin = document.createElement('div')
  pin.style.cssText = `
    width:${isHome ? 28 : 22}px; height:${isHome ? 28 : 22}px;
    background:${color}; border-radius:50% 50% 50% 0;
    transform:rotate(-45deg); border:2px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
    display:flex; align-items:center; justify-content:center;
  `
  const icon = document.createElement('div')
  icon.style.cssText = `transform:rotate(45deg);font-size:${isHome ? 13 : 11}px;line-height:1;`
  icon.textContent = isHome ? '✈' : '📍'
  pin.appendChild(icon)

  const label = document.createElement('div')
  label.style.cssText = `
    margin-top:4px; color:#fff; font-size:11px; font-weight:600;
    background:rgba(0,0,0,0.7); padding:2px 6px; border-radius:4px;
    white-space:nowrap; pointer-events:none;
  `
  label.textContent = name

  wrapper.appendChild(pin)
  wrapper.appendChild(label)
  return wrapper
}

// ─── 장소 검색 (Nominatim) ───
interface PlaceResult {
  display_name: string
  lat: string
  lon: string
  address?: { country?: string; city?: string; town?: string; state?: string }
}

function PlaceSearch({ label, onSelect }: {
  label: string
  onSelect: (name: string, country: string, lat: number, lng: number) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const search = (q: string) => {
    setQuery(q)
    setPicked('')
    if (timerRef.current) clearTimeout(timerRef.current)
    if (q.length < 2) { setResults([]); return }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&accept-language=ko`,
        )
        const data: PlaceResult[] = await res.json()
        setResults(data)
      } catch { setResults([]) }
      setLoading(false)
    }, 400)
  }

  const pick = (r: PlaceResult) => {
    const city = r.address?.city || r.address?.town || r.address?.state || r.display_name.split(',')[0]
    const country = r.address?.country || ''
    setPicked(`${city}, ${country}`)
    setQuery(`${city}, ${country}`)
    setResults([])
    onSelect(city, country, Number(r.lat), Number(r.lon))
  }

  return (
    <div className={styles.searchWrap}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        placeholder="도시 이름 검색 (예: 파리, 도쿄...)"
        value={query}
        onChange={(e) => search(e.target.value)}
      />
      {loading && <p className={styles.searchHint}>검색중...</p>}
      {results.length > 0 && !picked && (
        <ul className={styles.searchResults}>
          {results.map((r, i) => (
            <li key={i} className={styles.searchItem} onClick={() => pick(r)}>
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
      {picked && <p className={styles.searchPicked}>{picked}</p>}
    </div>
  )
}

// ─── 여행 추가 폼 ───
interface AddFormProps {
  onSubmit: (spot: TravelSpot) => void
  onClose: () => void
}

interface DraftPhoto {
  url: string
  caption: string
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('파일을 읽는 중 문제가 발생했습니다.'))
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'))
    image.src = src
  })
}

async function compressImageFile(file: File) {
  const rawDataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(rawDataUrl)
  const maxDimension = 1600
  const longestSide = Math.max(image.width, image.height)
  const scale = longestSide > maxDimension ? maxDimension / longestSide : 1
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    return rawDataUrl
  }

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', 0.82)
}

function AddTravelForm({ onSubmit, onClose }: AddFormProps) {
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [date, setDate] = useState('')
  const [destLat, setDestLat] = useState(0)
  const [destLng, setDestLng] = useState(0)
  const [depName, setDepName] = useState('')
  const [depLat, setDepLat] = useState(0)
  const [depLng, setDepLng] = useState(0)
  const [photos, setPhotos] = useState<DraftPhoto[]>([{ url: '', caption: '' }])
  const [error, setError] = useState('')
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const updatePhoto = (index: number, nextValue: Partial<DraftPhoto>) => {
    setPhotos((current) => current.map((photo, photoIndex) => (
      photoIndex === index
        ? { ...photo, ...nextValue }
        : photo
    )))
  }

  const handlePhotoUpload = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있어요.')
      event.target.value = ''
      return
    }

    try {
      setUploadingIndex(index)
      setError('')
      const compressed = await compressImageFile(file)
      updatePhoto(index, { url: compressed })
    } catch {
      setError('사진을 처리하지 못했어요. 다른 이미지로 다시 시도해주세요.')
    } finally {
      setUploadingIndex(null)
      event.target.value = ''
    }
  }

  const handleSubmit = () => {
    if (!name || (!destLat && !destLng)) {
      setError('도착지 검색 또는 장소 이름을 먼저 확인해주세요.')
      return
    }

    const spot: TravelSpot = {
      id: `${name}-${Date.now()}`,
      name,
      country,
      lat: destLat,
      lng: destLng,
      departureName: depName || '출발지',
      departureLat: depLat,
      departureLng: depLng,
      date,
      photos: photos.filter((p) => p.url.trim()),
    }
    setError('')
    onSubmit(spot)
  }

  return (
    <div className={styles.formOverlay} onClick={onClose}>
      <div className={styles.formPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.formHeader}>
          <h3>여행 추가</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.formBody}>
          {/* 출발지 검색 */}
          <PlaceSearch
            label="출발지"
            onSelect={(city, _country, lat, lng) => {
              setDepName(city)
              setDepLat(lat)
              setDepLng(lng)
            }}
          />

          {/* 도착지 검색 */}
          <PlaceSearch
            label="도착지"
            onSelect={(city, ctry, lat, lng) => {
              if (!name) setName(city)
              if (!country) setCountry(ctry)
              setDestLat(lat)
              setDestLng(lng)
            }}
          />

          {/* 기본 정보 */}
          <label className={styles.label}>장소 이름</label>
          <input className={styles.input} placeholder="예: 도쿄" value={name} onChange={(e) => setName(e.target.value)} />

          <label className={styles.label}>나라</label>
          <input className={styles.input} placeholder="예: 일본" value={country} onChange={(e) => setCountry(e.target.value)} />

          <label className={styles.label}>날짜</label>
          <input className={styles.input} placeholder="예: 2024.03" value={date} onChange={(e) => setDate(e.target.value)} />

          {/* 사진 */}
          <label className={styles.label}>사진</label>
          {photos.map((p, i) => (
            <div key={i} className={styles.photoInput}>
              <input
                className={styles.input}
                placeholder="이미지 URL 또는 아래에서 로컬 사진 업로드"
                value={p.url}
                onChange={(e) => {
                  updatePhoto(i, { url: e.target.value })
                }}
              />
              <div className={styles.photoActions}>
                <label htmlFor={`travel-photo-upload-${i}`} className={styles.uploadBtn}>
                  {uploadingIndex === i ? '업로드 중...' : '로컬 사진 업로드'}
                </label>
                <input
                  id={`travel-photo-upload-${i}`}
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(event) => void handlePhotoUpload(i, event)}
                />
                {p.url && (
                  <span className={styles.photoStatus}>
                    {p.url.startsWith('data:image') ? '로컬 사진 선택됨' : 'URL 연결됨'}
                  </span>
                )}
              </div>
              <input
                className={styles.input}
                placeholder="설명 (선택)"
                value={p.caption}
                onChange={(e) => {
                  updatePhoto(i, { caption: e.target.value })
                }}
              />
              {p.url && (
                <img
                  src={p.url}
                  alt={p.caption || `여행 사진 ${i + 1}`}
                  className={styles.photoPreview}
                />
              )}
              {photos.length > 1 && (
                <button type="button" className={styles.removeBtn} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>
                  &times;
                </button>
              )}
            </div>
          ))}
          <p className={styles.helperText}>로컬 사진은 브라우저 저장용으로 자동 압축됩니다.</p>
          {error && <p className={styles.errorText}>{error}</p>}
          <button type="button" className={styles.linkBtn} onClick={() => setPhotos([...photos, { url: '', caption: '' }])}>
            + 사진 추가
          </button>
        </div>

        <button type="button" className={styles.submitBtn} onClick={handleSubmit}>저장</button>
      </div>
    </div>
  )
}

// ─── 메인 컴포넌트 ───
export default function TravelGlobe() {
  const { isAdmin } = useAdminAuth()
  const { isBlogLight } = useBlogTheme()
  const globeRef = useRef<any>(null)
  const [spots, setSpots] = useState(getSpots)
  const [selectedSpot, setSelectedSpot] = useState<TravelSpot | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const updateSize = () => {
      const w = Math.min(window.innerWidth - 40, 900)
      const h = Math.min(window.innerHeight - 200, 650)
      setDimensions({ width: w, height: h })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls()
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.4
      controls.enableZoom = true
      controls.minDistance = 150
      globeRef.current.pointOfView({ lat: 36, lng: 128, altitude: 2.2 }, 1000)
    }
  }, [])

  const selectSpot = useCallback((spot: TravelSpot) => {
    setSelectedSpot(spot)
    setPhotoIndex(0)
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: spot.lat, lng: spot.lng, altitude: 1.5 }, 800)
      globeRef.current.controls().autoRotate = false
    }
  }, [])

  const closePanel = () => {
    setSelectedSpot(null)
    if (globeRef.current) globeRef.current.controls().autoRotate = true
  }

  const handleAddSpot = (spot: TravelSpot) => {
    if (!isAdmin) return

    const next = [...spots, spot]
    try {
      saveSpots(next)
      setSpots(next)
      setShowForm(false)
    } catch {
      alert('브라우저 저장 공간이 부족해요. 사진 수를 줄이거나 더 작은 사진으로 다시 시도해주세요.')
    }
  }

  const handleDeleteSpot = (id: string) => {
    if (!isAdmin) return
    if (!confirm('이 여행을 삭제할까요?')) return
    const next = spots.filter((s) => s.id !== id)
    setSpots(next)
    saveSpots(next)
    if (selectedSpot?.id === id) closePanel()
  }

  // 핀 마커 데이터 — 출발지 + 도착지 모두 표시 (중복 제거)
  const pinMap = new Map<string, { lat: number; lng: number; name: string; isHome: boolean }>()
  spots.forEach((s) => {
    const depKey = `${s.departureLat},${s.departureLng}`
    if (!pinMap.has(depKey)) {
      pinMap.set(depKey, { lat: s.departureLat, lng: s.departureLng, name: s.departureName, isHome: true })
    }
    pinMap.set(s.id, { lat: s.lat, lng: s.lng, name: s.name, isHome: false })
  })
  const htmlData = Array.from(pinMap.entries()).map(([key, v]) => ({ ...v, id: key }))

  const arcs = buildArcs(spots)

  return (
    <div className={`${styles.container} ${isBlogLight ? styles.light : ''}`}>
      <div className={styles.topBar}>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{spots.length}</span>
            <span className={styles.statLabel}>도시</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>
              {new Set(spots.map((s) => s.country)).size}
            </span>
            <span className={styles.statLabel}>나라</span>
          </div>
        </div>
        {isAdmin && (
          <button className={styles.addBtn} onClick={() => setShowForm(true)}>+ 여행 추가</button>
        )}
      </div>

      <p className={styles.hint}>지구본을 돌려보세요 — 핀을 클릭하면 사진을 볼 수 있어요</p>

      <div className={styles.globeArea}>
        {/* 왼쪽 사이드 패널 */}
        {selectedSpot && (
          <div className={styles.sidePanel}>
            <div className={styles.panelHeader}>
              <div>
                <h3 className={styles.panelTitle}>{selectedSpot.name}</h3>
                <span className={styles.panelCountry}>{selectedSpot.country}</span>
                {selectedSpot.date && <span className={styles.panelDate}>{selectedSpot.date}</span>}
              </div>
              <button className={styles.closeBtn} onClick={closePanel}>&times;</button>
            </div>

            <div className={styles.panelRoute}>
              {selectedSpot.departureName} → {selectedSpot.name}
            </div>

            <div className={styles.panelPhotos}>
              {selectedSpot.photos.length > 0 ? (
                <>
                  <img
                    src={selectedSpot.photos[photoIndex].url}
                    alt={selectedSpot.photos[photoIndex].caption || selectedSpot.name}
                    className={styles.panelPhoto}
                  />
                  {selectedSpot.photos[photoIndex].caption && (
                    <p className={styles.panelCaption}>{selectedSpot.photos[photoIndex].caption}</p>
                  )}
                  {selectedSpot.photos.length > 1 && (
                    <div className={styles.photoNav}>
                      <button
                        className={styles.navBtn}
                        onClick={() => setPhotoIndex((i) => (i - 1 + selectedSpot.photos.length) % selectedSpot.photos.length)}
                      >
                        &larr;
                      </button>
                      <span className={styles.photoCount}>
                        {photoIndex + 1} / {selectedSpot.photos.length}
                      </span>
                      <button
                        className={styles.navBtn}
                        onClick={() => setPhotoIndex((i) => (i + 1) % selectedSpot.photos.length)}
                      >
                        &rarr;
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className={styles.noPhotos}>사진이 없어요</p>
              )}
            </div>
            {isAdmin && (
              <button className={styles.deleteBtn} onClick={() => handleDeleteSpot(selectedSpot.id)}>
                이 여행 삭제
              </button>
            )}
          </div>
        )}

        {/* 지구본 */}
        <div className={styles.globeWrap}>
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="//eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            htmlElementsData={htmlData}
            htmlElement={(d: any) => {
              const el = createPinElement(d.name, d.isHome ? '#ff6b9d' : '#4fc3f7', d.isHome)
              el.addEventListener('click', () => {
                const spot = spots.find((s) => s.id === d.id)
                if (spot) selectSpot(spot)
              })
              return el
            }}
            htmlAltitude={0.01}
            arcsData={arcs}
            arcColor={() => ['#ff6b9d', '#4fc3f7']}
            arcStroke={0.7}
            arcDashLength={0.5}
            arcDashGap={0.3}
            arcDashAnimateTime={2000}
            arcAltitudeAutoScale={0.4}
            arcLabel={(d: any) =>
              `<div style="color:#fff;font-size:12px;background:rgba(0,0,0,0.7);padding:4px 8px;border-radius:4px;">${d.fromName} → ${d.toName}</div>`
            }
            atmosphereColor="#4a90d9"
            atmosphereAltitude={0.2}
          />
        </div>
      </div>

      {/* 방문 장소 목록 */}
      <div className={styles.spotList}>
        <h3 className={styles.spotListTitle}>방문한 곳</h3>
        <div className={styles.spotTags}>
          {spots.map((spot) => (
            <button key={spot.id} className={styles.spotTag} onClick={() => selectSpot(spot)}>
              {spot.name}
              {spot.date && <span className={styles.spotDate}>{spot.date}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 여행 추가 폼 */}
      {isAdmin && showForm && (
        <AddTravelForm
          onSubmit={handleAddSpot}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
