// Lofi FM — zero-build PWA radio
const streams = {
  main: 'https://stream.zeno.fm/0r0xa792kwzuv',
  metadata: 'https://api.zeno.fm/mounts/metadata/subscribe/0r0xa792kwzuv',
};

const els = {
  radio: document.getElementById('radio'),
  btnPlay: document.getElementById('btnPlay'),
  btnMute: document.getElementById('btnMute'),
  btnRain: document.getElementById('btnRain'),
  btnVinyl: document.getElementById('btnVinyl'),
  volMain: document.getElementById('volMain'),
  volRain: document.getElementById('volRain'),
  volVinyl: document.getElementById('volVinyl'),
  volMaster: document.getElementById('volMaster'),
  status: document.getElementById('status'),
  statusDot: document.getElementById('statusDot'),
  track: document.getElementById('track'),
  metaArtist: document.getElementById('metaArtist'),
  metaTitle: document.getElementById('metaTitle'),
  btnInstall: document.getElementById('btnInstall'),
};

let ctx, mainGain, masterGain, rainGain, vinylGain;
let rainBuffer, vinylBuffer;
let rainNode, vinylNode;

function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = parseFloat(els.volMaster.value);

  mainGain = ctx.createGain();
  mainGain.gain.value = parseFloat(els.volMain.value);

  rainGain = ctx.createGain();
  rainGain.gain.value = parseFloat(els.volRain.value);

  vinylGain = ctx.createGain();
  vinylGain.gain.value = parseFloat(els.volVinyl.value);

  masterGain.connect(ctx.destination);
  mainGain.connect(masterGain);
  rainGain.connect(masterGain);
  vinylGain.connect(masterGain);

  // connect radio element
  const src = ctx.createMediaElementSource(els.radio);
  src.connect(mainGain);
}

function setStatus(text, color) {
  els.status.textContent = text;
  if (color) els.statusDot.style.background = color;
}

async function loadLoop(url) {
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  return await (ctx.decodeAudioData(arr));
}

function startLoop(buffer, gainNode, setter) {
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  node.connect(gainNode);
  node.start();
  setter(node);
}

function stopNode(nodeSetter) {
  const n = nodeSetter();
  if (n) try { n.stop(); } catch {}
  nodeSetter(null);
}
/*
function setupSFX() {
  // preload both buffers
  loadLoop('assets/rain_loop.wav').then(b => { rainBuffer = b; }).catch(()=>{});
  loadLoop('assets/vinyl_loop.wav').then(b => { vinylBuffer = b; }).catch(()=>{});
}
*/
function toggleRain() {
  if (!ctx) initAudio();
  if (rainNode) {
    try { rainNode.stop(); } catch {}
    rainNode = null;
    els.btnRain.textContent = 'Rain: Off';
  } else if (rainBuffer) {
    const n = ctx.createBufferSource();
    n.buffer = rainBuffer;
    n.loop = true;
    n.connect(rainGain);
    n.start();
    rainNode = n;
    els.btnRain.textContent = 'Rain: On';
  }
}

function toggleVinyl() {
  if (!ctx) initAudio();
  if (vinylNode) {
    try { vinylNode.stop(); } catch {}
    vinylNode = null;
    els.btnVinyl.textContent = 'Vinyl: Off';
  } else if (vinylBuffer) {
    const n = ctx.createBufferSource();
    n.buffer = vinylBuffer;
    n.loop = true;
    n.connect(vinylGain);
    n.start();
    vinylNode = n;
    els.btnVinyl.textContent = 'Vinyl: On';
  }
}

function bindUI() {
  els.btnPlay.addEventListener('click', async () => {
    initAudio();
    if (els.radio.src !== streams.main) {
      els.radio.src = streams.main;
    }
    if (els.radio.paused) {
      try {
        await els.radio.play();
        els.btnPlay.textContent = 'Pause';
        setStatus('Playing', '#22c55e');
      } catch (err) {
        setStatus('Tap to start (autoplay blocked)', '#f59e0b');
      }
    } else {
      els.radio.pause();
      els.btnPlay.textContent = 'Play';
      setStatus('Paused', '#f59e0b');
    }
  });

  els.btnMute.addEventListener('click', () => {
    if (!ctx) initAudio();
    const muted = masterGain.gain.value === 0;
    masterGain.gain.value = muted ? parseFloat(els.volMaster.value) : 0;
    els.btnMute.textContent = muted ? 'Mute' : 'Unmute';
  });

  els.btnRain.addEventListener('click', toggleRain);
  els.btnVinyl.addEventListener('click', toggleVinyl);

  els.volMain.addEventListener('input', e => mainGain && (mainGain.gain.value = parseFloat(e.target.value)));
  els.volRain.addEventListener('input', e => rainGain && (rainGain.gain.value = parseFloat(e.target.value)));
  els.volVinyl.addEventListener('input', e => vinylGain && (vinylGain.gain.value = parseFloat(e.target.value)));
  els.volMaster.addEventListener('input', e => masterGain && (masterGain.gain.value = parseFloat(e.target.value)));
}

function mediaSessionUpdate(artist, title) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Lofi FM',
      artist: artist || '',
      artwork: [
        { src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    navigator.mediaSession.setActionHandler('play', () => els.radio.play());
    navigator.mediaSession.setActionHandler('pause', () => els.radio.pause());
  }
}

// Metadata via SSE
function startMetadata() {
  try {
    const es = new EventSource(streams.metadata);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        // shape: { mount: { now_playing: { title, artist } } } or similar
        const np = data?.now_playing || data?.mount?.now_playing || data;
        const artist = np?.artist || np?.stream_title?.split(' - ')?.[0] || '';
        const title = np?.title || np?.stream_title?.split(' - ')?.[1] || np?.stream_title || '';
        els.metaArtist.textContent = artist || 'Unknown';
        els.metaTitle.textContent = title || '—';
        els.track.textContent = (artist && title) ? artist + ' — ' + title : (title || '—');
        mediaSessionUpdate(artist, title);
      } catch {}
    };
    es.onerror = () => {
      // fallback: ping title from audio tag if ICE metadata appears (rare in MSE)
      // Keep UI functional even if metadata endpoint blocks CORS.
    };
  } catch (e) {
    // ignore
  }
}

// PWA: service worker + install prompt
function pwa() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
  let deferred;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    els.btnInstall.style.display = 'inline-block';
    els.btnInstall.onclick = async () => {
      els.btnInstall.style.display = 'none';
      deferred.prompt();
      deferred = null;
    };
  });
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  bindUI();
  pwa();
 /* setupSFX(); */
  startMetadata();

  els.radio.addEventListener('play', () => setStatus('Playing', '#22c55e'));
  els.radio.addEventListener('pause', () => setStatus('Paused', '#f59e0b'));
  els.radio.addEventListener('stalled', () => setStatus('Buffering…', '#f59e0b'));
  els.radio.addEventListener('waiting', () => setStatus('Buffering…', '#f59e0b'));
  els.radio.addEventListener('error', () => setStatus('Stream error', '#ef4444'));
});
