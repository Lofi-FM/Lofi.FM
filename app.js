// Lofi FM — zero-build PWA radio
const streams = {
  main: 'https://stream.zeno.fm/0r0xa792kwzuv',
  metadata: 'https://api.zeno.fm/mounts/metadata/subscribe/0r0xa792kwzuv',
};

const els = {
  radio: document.getElementById('radio'),
  btnPlay: document.getElementById('btnPlay'),
  btnRain: document.getElementById('btnRain'),
  btnVinyl: document.getElementById('btnVinyl'),
  volMain: document.getElementById('volMain'),
  volRain: document.getElementById('volRain'),
  volVinyl: document.getElementById('volVinyl'),
  status: document.getElementById('status'),
  statusDot: document.getElementById('statusDot'),
  track: document.getElementById('track'),
  btnInstall: document.getElementById('btnInstall'),
};

let ctx, mainGain, rainGain, vinylGain;
let sfxBuffers = {};
let rainSource = null;
let vinylSource = null;
let radioSource = null;

// --- Audio Context ---
function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Gains
  mainGain = ctx.createGain();
  rainGain = ctx.createGain();
  vinylGain = ctx.createGain();

  mainGain.connect(ctx.destination);
  rainGain.connect(ctx.destination);
  vinylGain.connect(ctx.destination);

  // Radio through mainGain (only create once)
  if (!radioSource) {
    radioSource = ctx.createMediaElementSource(els.radio);
    radioSource.connect(mainGain);
  }
}

function setStatus(text, color) {
  els.status.textContent = text;
  if (color) els.statusDot.style.background = color;
}

// --- SFX (Rain + Vinyl) ---
async function setupSFX() {
  if (!ctx) initAudio(); // reuse same context

  async function loadSFX(name, url) {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    sfxBuffers[name] = await ctx.decodeAudioData(arr);
  }

  await Promise.all([
    loadSFX("rain", "assets/rain.wav"),
    loadSFX("vinyl", "assets/vinyl.wav"),
  ]);
}

function playLoop(name, gainNode) {
  if (!sfxBuffers[name]) return null;
  const src = ctx.createBufferSource();
  src.buffer = sfxBuffers[name];
  src.loop = true;
  src.connect(gainNode);
  src.start(0);
  return src;
}

function toggleRain() {
  if (rainSource) {
    rainSource.stop();
    rainSource.disconnect();
    rainSource = null;
    els.btnRain.textContent = "Rain: Off";
  } else {
    rainSource = playLoop("rain", rainGain);
    els.btnRain.textContent = "Rain: On";
  }
}

function toggleVinyl() {
  if (vinylSource) {
    vinylSource.stop();
    vinylSource.disconnect();
    vinylSource = null;
    els.btnVinyl.textContent = "Vinyl: Off";
  } else {
    vinylSource = playLoop("vinyl", vinylGain);
    els.btnVinyl.textContent = "Vinyl: On";
  }
}

// --- UI Bindings ---
function bindUI() {
  els.btnPlay.addEventListener('click', async () => {
    initAudio();
    
    // Resume audio context if suspended (required for autoplay policies)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    // Initialize volume controls
    if (mainGain) {
      mainGain.gain.value = parseFloat(els.volMain.value);
    }
    
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

  els.btnRain.addEventListener('click', toggleRain);
  els.btnVinyl.addEventListener('click', toggleVinyl);

  els.volMain.addEventListener('input', e => { if(mainGain) mainGain.gain.value = parseFloat(e.target.value); });
  els.volRain.addEventListener('input', e => { if(rainGain) rainGain.gain.value = parseFloat(e.target.value); });
  els.volVinyl.addEventListener('input', e => { if(vinylGain) vinylGain.gain.value = parseFloat(e.target.value); });
}

// --- Media Session ---
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

// --- Metadata via SSE ---
function startMetadata() {
  try {
    const es = new EventSource(streams.metadata);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const np = data?.now_playing || data?.mount?.now_playing || data;
        const artist = np?.artist || np?.stream_title?.split(' - ')?.[0] || '';
        const title = np?.title || np?.stream_title?.split(' - ')?.[1] || np?.stream_title || '';
        els.track.textContent = (artist && title) ? artist + ' — ' + title : (title || '—');
        mediaSessionUpdate(artist, title);
      } catch {}
    };
  } catch (e) {}
}

// --- PWA Support ---
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

// --- Boot ---
window.addEventListener('DOMContentLoaded', () => {
  bindUI();
  pwa();
  initAudio(); // Initialize audio context on page load
  setupSFX();
  startMetadata();

  els.radio.addEventListener('play', () => setStatus('Playing', '#22c55e'));
  els.radio.addEventListener('pause', () => setStatus('Paused', '#f59e0b'));
  els.radio.addEventListener('stalled', () => setStatus('Buffering…', '#f59e0b'));
  els.radio.addEventListener('waiting', () => setStatus('Buffering…', '#f59e0b'));
  els.radio.addEventListener('error', () => setStatus('Stream error', '#ef4444'));
});
