const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export function satelliteMapUrl(data) {
  if (!String(data.lat ?? '').trim() || !String(data.lng ?? '').trim()) return '';
  const lat = Number(data.lat);
  const lng = Number(data.lng);
  if (!apiKey || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return '';
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '18',
    size: '640x360',
    scale: '2',
    maptype: 'satellite',
    markers: `color:red|${lat},${lng}`,
    key: apiKey,
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params}`;
}

export function isSatelliteMapUrl(value) {
  return typeof value === 'string' && value.startsWith('https://maps.googleapis.com/maps/api/staticmap?');
}

export function isSampleSatelliteImage(value) {
  return typeof value === 'string' && (
    value.endsWith('/assets/sample-satellite.jpg') ||
    value.includes('images.unsplash.com/photo-1524661135-423995f22d0b')
  );
}
