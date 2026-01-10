// --- FLIGHTDECK VISUALIZER ENGINE ---

const PRESETS = {
    'tiktok': { name: 'TikTok', width: 1080, height: 1920, label: '9:16' },
    'instagram': { name: 'Instagram', width: 1080, height: 1080, label: '1:1' },
    'portrait': { name: 'Portrait', width: 1080, height: 1350, label: '4:5' },
    'youtube': { name: 'YouTube', width: 1920, height: 1080, label: '16:9' }, // Fixed for 16:9
};

const store = {
    dim: PRESETS['tiktok'],
    color: '#06b6d4',
    title: 'ZAYTOOLIT',
    subtitle: 'AUDIO VISUALIZER',
    isRecording: false,
    audioEnabled: false
};

let threeBg = null;
let audioCtx = null;
let analyser = null;
let dataArray = null;
let audioSource = null;
let microphoneStream = null;
let recorder = null;
let compositorLoop = null;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    threeBg = new ThreeBackground('three-container', {
        width: store.dim.width,
        height: store.dim.height,
        accentColor: store.color
    });

    renderPresets();
    updateText();
    handleResize();
    setupControls();
    
    // Animation Loop for Audio Data
    const loop = () => {
        if (store.audioEnabled && analyser) {
            analyser.getByteFrequencyData(dataArray);
            threeBg.updateAudio(dataArray);
        }
        requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener('resize', handleResize);
});

// --- AUDIO ENGINE ---
async function toggleAudio() {
    const btn = document.getElementById('btn-audio-toggle');
    const indicator = document.getElementById('live-indicator');
    
    if (store.audioEnabled) {
        // Disable
        if (microphoneStream) {
            microphoneStream.getTracks().forEach(track => track.stop());
        }
        if (audioCtx) await audioCtx.close();
        
        store.audioEnabled = false;
        btn.innerHTML = `<i data-lucide="mic-off" class="w-3 h-3"></i> Enable Audio`;
        btn.classList.remove('bg-green-500/20', 'border-green-500/50', 'text-green-300');
        btn.classList.add('bg-white/5', 'border-white/10');
        
        indicator.classList.remove('bg-green-500', 'shadow-[0_0_10px_#22c55e]');
        indicator.classList.add('bg-white/20');
        
        lucide.createIcons();
    } else {
        // Enable
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioSource = audioCtx.createMediaStreamSource(microphoneStream);
            analyser = audioCtx.createAnalyser();
            
            analyser.fftSize = 256; // Balance between detail and performance
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            audioSource.connect(analyser);
            // Don't connect to destination (speakers) to avoid feedback loop
            
            store.audioEnabled = true;
            btn.innerHTML = `<i data-lucide="mic" class="w-3 h-3"></i> Mic Active`;
            btn.classList.remove('bg-white/5', 'border-white/10');
            btn.classList.add('bg-green-500/20', 'border-green-500/50', 'text-green-300');
            
            indicator.classList.remove('bg-white/20');
            indicator.classList.add('bg-green-500', 'shadow-[0_0_10px_#22c55e]'); // Glow
            
            lucide.createIcons();
        } catch (err) {
            console.error(err);
            alert("Microphone access denied.");
        }
    }
}

// --- CORE UTILS ---
function handleResize() {
    const workspace = document.getElementById('workspace');
    const scaler = document.getElementById('stage-scaler');
    const flyer = document.getElementById('flyer');

    if(!workspace || !scaler || !flyer) return;

    flyer.style.width = `${store.dim.width}px`;
    flyer.style.height = `${store.dim.height}px`;

    const padding = 60; 
    const availW = workspace.clientWidth - padding;
    const availH = workspace.clientHeight - padding;
    const scale = Math.min(availW / store.dim.width, availH / store.dim.height);

    scaler.style.transform = `scale(${scale})`;
    scaler.style.width = `${store.dim.width}px`;
    scaler.style.height = `${store.dim.height}px`;
}

function updateText() {
    const titleEl = document.getElementById('display-title');
    titleEl.textContent = store.title;
    titleEl.style.backgroundImage = `linear-gradient(to bottom, #ffffff, ${store.color})`;
    titleEl.style.filter = `drop-shadow(0 0 30px ${store.color}66)`;

    document.getElementById('display-subtitle').textContent = store.subtitle;
    threeBg.updateColor(store.color);
}

function renderPresets() {
    const el = document.getElementById('preset-container');
    el.innerHTML = '';
    Object.values(PRESETS).forEach(p => {
        const btn = document.createElement('button');
        const active = store.dim.name === p.name;
        btn.className = `p-2 rounded border text-xs font-bold transition-colors ${active ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`;
        btn.textContent = p.name;
        btn.onclick = () => {
            store.dim = p;
            renderPresets();
            handleResize();
            threeBg.resize(p.width, p.height);
        };
        el.appendChild(btn);
    });
}

function setupControls() {
    // Inputs
    document.getElementById('input-title').oninput = e => { store.title = e.target.value.toUpperCase(); updateText(); };
    document.getElementById('input-subtitle').oninput = e => { store.subtitle = e.target.value.toUpperCase(); updateText(); };
    document.getElementById('input-accent').oninput = e => { store.color = e.target.value; updateText(); };

    // Sliders
    const linkSlider = (id, param) => {
        const el = document.getElementById(id);
        const label = document.getElementById(`val-${param}`);
        el.oninput = (e) => {
            const val = e.target.value;
            threeBg.updateParams(param, val);
            label.textContent = val;
        };
    };
    linkSlider('input-sensitivity', 'sensitivity');
    linkSlider('input-speed', 'speed');
    linkSlider('input-bloom', 'bloom');

    // Buttons
    document.getElementById('btn-audio-toggle').onclick = toggleAudio;
    document.getElementById('btn-snapshot').onclick = exportSnapshot;
    document.getElementById('btn-record').onclick = exportVideo;
}

// --- EXPORT LOGIC ---

async function exportSnapshot() {
    const btn = document.getElementById('btn-snapshot');
    btn.innerHTML = 'Wait...';
    
    // Same Sandbox logic as before for perfect 1080p
    const sandbox = document.createElement('div');
    Object.assign(sandbox.style, { position: 'fixed', left: '-9999px', top: '0', width: `${store.dim.width}px`, height: `${store.dim.height}px`, zIndex: '-1' });
    document.body.appendChild(sandbox);

    const clone = document.getElementById('flyer').cloneNode(true);
    clone.style.transform = 'none';
    
    // Capture 3D Canvas
    const canvas = document.querySelector('#three-container canvas');
    if(canvas) {
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        img.className = 'absolute inset-0 w-full h-full object-cover';
        clone.querySelector('#three-container').innerHTML = '';
        clone.querySelector('#three-container').appendChild(img);
    }
    
    // Fix text for Snapshot (Lock font size)
    const title = clone.querySelector('#display-title');
    if(title) title.style.fontSize = '140px'; // Lock to non-responsive pixel value

    sandbox.appendChild(clone);

    try {
        const c = await html2canvas(clone, { width: store.dim.width, height: store.dim.height, scale: 1, useCORS: true, backgroundColor: '#000' });
        const link = document.createElement('a');
        link.download = `FlightDeck-Vis-${Date.now()}.png`;
        link.href = c.toDataURL();
        link.click();
    } catch(e) { console.error(e); } 
    finally { document.body.removeChild(sandbox); btn.innerHTML = 'PNG'; }
}

async function exportVideo() {
    const btn = document.getElementById('btn-record');
    const status = document.getElementById('recording-status');

    if (store.isRecording) {
        // STOP
        store.isRecording = false;
        if(recorder) recorder.stop();
        if(compositorLoop) cancelAnimationFrame(compositorLoop);
        
        btn.innerHTML = `<i data-lucide="video" class="w-3 h-3"></i> <span>Rec Stream</span>`;
        btn.classList.remove('bg-red-600', 'text-white', 'border-red-500');
        btn.classList.add('bg-cyan-600/10', 'text-cyan-300', 'border-cyan-500/30');
        status.classList.add('hidden');
        lucide.createIcons();
        
        // Restore
        document.getElementById('three-container').style.visibility = 'visible';
        threeBg.resize(store.dim.width, store.dim.height);

    } else {
        // START
        try {
            if(!store.audioEnabled) {
                if(!confirm("Audio is not enabled. Record silent video?")) return;
            }

            btn.innerHTML = 'Prep...';
            const W = store.dim.width;
            const H = store.dim.height;

            // 1. Force 3D to Full Resolution
            threeBg.resize(W, H);
            document.getElementById('three-container').style.visibility = 'hidden';

            // 2. Generate Overlay
            const sandbox = document.createElement('div');
            Object.assign(sandbox.style, { position: 'fixed', left: '-9999px', width: `${W}px`, height: `${H}px` });
            const clone = document.getElementById('flyer').cloneNode(true);
            clone.style.transform = 'none';
            // Lock text size
            const title = clone.querySelector('#display-title');
            if(title) title.style.fontSize = '140px';
            
            clone.querySelector('#three-container').remove();
            sandbox.appendChild(clone);
            document.body.appendChild(sandbox);

            const overlayCanvas = await html2canvas(clone, { width: W, height: H, scale: 1, backgroundColor: null });
            document.body.removeChild(sandbox);

            // 3. Compositor
            const composite = document.createElement('canvas');
            composite.width = W;
            composite.height = H;
            const ctx = composite.getContext('2d');
            const webglCanvas = document.querySelector('#three-container canvas');

            store.isRecording = true;
            const draw = () => {
                if(!store.isRecording) return;
                ctx.clearRect(0,0,W,H);
                ctx.drawImage(webglCanvas, 0, 0, W, H);
                ctx.drawImage(overlayCanvas, 0, 0, W, H);
                compositorLoop = requestAnimationFrame(draw);
            };
            draw();

            // 4. Stream Setup (Video + Audio)
            const videoStream = composite.captureStream(60);
            
            // Add Audio Track if available
            if (microphoneStream && store.audioEnabled) {
                const audioTracks = microphoneStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    videoStream.addTrack(audioTracks[0]);
                }
            }

            recorder = new MediaRecorder(videoStream, { 
                mimeType: 'video/webm;codecs=vp9', 
                videoBitsPerSecond: 25000000 
            });
            
            const chunks = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `FlightDeck-Vis-${Date.now()}.webm`;
                a.click();
            };
            
            recorder.start();

            // UI Update
            btn.innerHTML = `<i data-lucide="square" class="w-3 h-3"></i> <span>Stop</span>`;
            btn.classList.remove('bg-cyan-600/10', 'text-cyan-300', 'border-cyan-500/30');
            btn.classList.add('bg-red-600', 'text-white', 'border-red-500');
            status.classList.remove('hidden');
            lucide.createIcons();

        } catch(e) {
            console.error(e);
            alert("Recording Error");
            store.isRecording = false;
        }
    }
}
