import { useState, useEffect } from 'react';
import './App.css';

const ACCURACY_THRESHOLD = 100;   // metres; raise or set to Infinity to disable
const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export default function App() {
  /* ─── state ─────────────────────────────────────────────── */
  const [initial, setInitial]   = useState(null);              // {lat, lng, acc}
  const [fix,     setFix]       = useState(null);              // last GOOD fix
  const [rejected, setRejected] = useState(null);              // last disc. fix
  const [addr,    setAddr]      = useState(null);
 const apikey=import.meta.env.VITE_OPENCAGE_KEY;
  /* ─── geolocation ───────────────────────────────────────── */
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported'); return;
    }
    const geo = navigator.geolocation;

    const oneShot = pos => {
      const {latitude:lat, longitude:lng, accuracy:acc} = pos.coords;
      console.log(`[initial] lat=${lat} lng=${lng} acc≈${acc} m`);
      setInitial({lat, lng, acc});
    };

    const watcher = pos => {
      const {latitude:lat, longitude:lng, accuracy:acc} = pos.coords;
      const stamp = new Date().toLocaleTimeString();
      if (acc <= ACCURACY_THRESHOLD) {
        console.log(`[watch✓] ${stamp} lat=${lat} lng=${lng} acc≈${acc} m`);
        setFix({lat, lng, acc, stamp});
      } else {
        console.log(`[watch✗] ${stamp} REJECT acc≈${acc} m`);
        setRejected({lat, lng, acc, stamp});
      }
    };

    geo.getCurrentPosition(oneShot, console.error, GEO_OPTIONS);
    const id = geo.watchPosition(watcher, console.error, GEO_OPTIONS);
    return () => geo.clearWatch(id);
  }, []);

  
  /* ─── reverse geocode ───────────────────────────────────── */
  async function getAddress() {
    if (!initial) { alert('Location not ready'); return; }
    const {lat, lng} = initial;
    const url = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${lat},${lng}&no_annotations=1`;
    try {
      const res = await fetch(url);
      const js  = await res.json();
      setAddr(js.results[0]?.formatted ?? 'No address');
    } catch (e) { console.error(e); setAddr('Lookup failed'); }
  }

  /* ─── helpers ───────────────────────────────────────────── */
  const fmt = n => (n == null ? '…' : n.toFixed(6));

  /* ─── UI ────────────────────────────────────────────────── */
  return (
    <main style={{fontFamily:'sans-serif',lineHeight:1.4,maxWidth:500,margin:'0 auto'}}>
      <h1>Live Location (≤ {ACCURACY_THRESHOLD} m)</h1>

      <h2>Initial Fix</h2>
      <p>Lat: {fmt(initial?.lat)}<br/>
         Lng: {fmt(initial?.lng)}<br/>
         Acc: {initial?.acc ? `≈${initial.acc} m` : '…'}</p>
      <button onClick={getAddress}>Get Address</button>
      <p>{addr ?? ''}</p>

      <hr/>

      <h2>Latest Accepted Fix</h2>
      {fix
        ? (<p>
            Time: {fix.stamp}<br/>
            Lat: {fmt(fix.lat)}<br/>
            Lng: {fmt(fix.lng)}<br/>
            Acc: ≈{fix.acc} m
          </p>)
        : <p>None yet (move or widen threshold)</p>}

      <h3>Last Discarded Fix</h3>
      {rejected
        ? (<p>
            Time: {rejected.stamp}<br/>
            Acc: ≈{rejected.acc} m ({ACCURACY_THRESHOLD})
          </p>)
        : <p>—</p>}
    </main>
  );
}
