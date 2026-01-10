// --- OVRLOAD CONTROLLER ---
import { ThreeBackground } from './ThreeBackground.js';

const store = {
    dim: { width: 1080, height: 1920, name: 'TikTok' },
    color: '#06b6d4',
    title: 'OVRLOAD',
    subtitle: 'VISUALIZER',
    isPlaying: false,
    isRecording: false
};

let threeBg;
let audioCtx, analyser, source, dataArray;
let fileBuffer = null;
let startTime = 0;
let recorder, compositorLoop;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    threeBg = new ThreeBackground('three-container', { width: 1080, height: 1920 });
    
    setupDragDrop();
    setupInputs();
    setupAudioContext();
    handleResize();
    requestAnimationFrame(audioLoop);
    
    window.addEventListener('resize', handleResize);
});

// --- AUDIO HANDLING ---
function setupAudioContext() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function loadAudio(file) {
    const reader = new FileReader();
    document.getElementById('drop-zone').classList.add('hidden');
    document.getElementById('status-text').innerText = "LOADING...";
    document.getElementById('track-name-display').innerText = file.name.toUpperCase();
    document.getElementById('track-name-display').style.opacity = 1;

    reader.onload = function(e) {
        audioCtx.decodeAudioData(e.target.result, function(buffer) {
            fileBuffer = buffer;
            document.getElementById('status-text').innerText = "READY";
            playTrack();
        });
    };
    reader.readAsArrayBuffer(file);
}

function playTrack() {
    if(!fileBuffer) return;
    if(source) source.stop();
    
    source = audioCtx.createBufferSource();
    source.buffer = fileBuffer;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    source.start(0);
    store.isPlaying = true;
    document.getElementById('status-text').innerText = "PLAYING";
    document.getElementById('btn-play').innerText = "PAUSE";
    document.getElementById('status-text').classList.add('text-cyan-400', 'animate-pulse');
}

function stopTrack() {
    if(source) source.stop();
    store.isPlaying = false;
    document.getElementById('status-text').innerText = "STOPPED";
    document.getElementById('status-text').classList.remove('text-cyan-400', 'animate-pulse');
    document.getElementById('btn-play').innerText = "PLAY";
}

function audioLoop() {
    if(store.isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);
        threeBg.updateAudio(dataArray);
        
        // Update Time
        const curr = audioCtx.currentTime;
        const mins = Math.floor(curr / 60);
        const secs = Math.floor(curr % 60).toString().padStart(2, '0');
        document.getElementById('time-display').innerText = `${mins}:${secs}`;
    }
    requestAnimationFrame(audioLoop);
}

// --- FILE INPUTS ---
function setupDragDrop() {
    const dz = document.getElementById('drop-zone');
    window.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.remove('hidden'); });
    window.addEventListener('dragleave', (e) => { 
        if(e.relatedTarget === null) dz.classList.add('hidden'); 
    });
    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.add('hidden');
        if(e.dataTransfer.files.length) loadAudio(e.dataTransfer.files[0]);
    });
    
    document.getElementById('audio-file-input').addEventListener('change', (e) => {
        if(e.target.files.length) loadAudio(e.target.files[0]);
    });
}

function setupInputs() {
    // Buttons
    document.getElementById('btn-play').onclick = () => {
        if(store.isPlaying) { audioCtx.suspend(); store.isPlaying = false; document.getElementById('btn-play').innerText = "RESUME"; }
        else { 
            if(audioCtx.state === 'suspended') audioCtx.resume(); 
            else playTrack(); 
            store.isPlaying = true;
            document.getElementById('btn-play').innerText = "PAUSE";
        }
    };
    document.getElementById('btn-stop').onclick = stopTrack;
    
    // Sliders
    const bindSlider = (id, param, target = 'bg') => {
        document.getElementById(id).oninput = (e) => {
            document.getElementById(`val-${param.split('Param')[0]}`).innerText = e.target.value;
            if(target === 'bg') threeBg.params[param] = parseFloat(e.target.value);
        };
    };
    bindSlider('input-sensitivity', 'sensitivity');
    bindSlider('input-debris', 'debrisCount');
    bindSlider('input-bitcrush', 'baseBitcrush');

    // Text & Color
    document.getElementById('input-title').oninput = e => { 
        document.getElementById('display-title').innerText = e.target.value.toUpperCase(); 
    };
    document.getElementById('input-subtitle').oninput = e => { 
        document.getElementById('display-subtitle').innerText = e.target.value.toUpperCase(); 
    };
    document.getElementById('input-accent').oninput = e => {
        threeBg.updateColor(e.target.value);
        document.getElementById('display-title').style.backgroundImage = `linear-gradient(to bottom, #fff, ${e.target.value})`;
    };

    // Exports
    document.getElementById('btn-snapshot').onclick = exportSnapshot;
    document.getElementById('btn-record').onclick = exportVideo;
}

// --- EXPORT LOGIC (UNCHANGED BUT ADAPTED) ---
async function exportSnapshot() {
    const btn = document.getElementById('btn-snapshot');
    btn.innerHTML = 'Wait...';
    
    const sandbox = document.createElement('div');
    Object.assign(sandbox.style, { position: 'fixed', left: '-9999px', top: '0', width: `${store.dim.width}px`, height: `${store.dim.height}px`, zIndex: '-1' });
    document.body.appendChild(sandbox);

    const clone = document.getElementById('flyer').cloneNode(true);
    clone.style.transform = 'none';
    
    // 3D Canvas Snapshot
    const canvas = document.querySelector('#three-container canvas');
    if(canvas) {
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        img.className = 'absolute inset-0 w-full h-full object-cover';
        clone.querySelector('#three-container').innerHTML = '';
        clone.querySelector('#three-container').appendChild(img);
    }
    
    clone.querySelector('#display-title').style.fontSize = '140px'; 
    sandbox.appendChild(clone);

    try {
        const c = await html2canvas(clone, { width: store.dim.width, height: store.dim.height, scale: 1, useCORS: true, backgroundColor: '#000' });
        const link = document.createElement('a');
        link.download = `OVRLOAD-${Date.now()}.png`;
        link.href = c.toDataURL();
        link.click();
    } catch(e) { console.error(e); } 
    finally { document.body.removeChild(sandbox); btn.innerHTML = 'PNG'; }
}

async function exportVideo() {
    const btn = document.getElementById('btn-record');
    const status = document.getElementById('recording-status');

    if (store.isRecording) {
        store.isRecording = false;
        if(recorder) recorder.stop();
        if(compositorLoop) cancelAnimationFrame(compositorLoop);
        
        btn.innerHTML = `Export Video`;
        btn.classList.remove('bg-red-600', 'text-white', 'border-red-500');
        btn.classList.add('bg-cyan-600/10', 'text-cyan-300', 'border-cyan-500/30');
        status.classList.add('hidden');
        
        document.getElementById('three-container').style.visibility = 'visible';
        threeBg.resize(store.dim.width, store.dim.height);

    } else {
        try {
            if(!store.isPlaying) { alert("Play a track first!"); return; }

            btn.innerHTML = 'Prep...';
            const W = store.dim.width;
            const H = store.dim.height;

            threeBg.resize(W, H);
            document.getElementById('three-container').style.visibility = 'hidden';

            // Generate Overlay
            const sandbox = document.createElement('div');
            Object.assign(sandbox.style, { position: 'fixed', left: '-9999px', width: `${W}px`, height: `${H}px` });
            const clone = document.getElementById('flyer').cloneNode(true);
            clone.style.transform = 'none';
            clone.querySelector('#display-title').style.fontSize = '140px';
            clone.querySelector('#three-container').remove();
            sandbox.appendChild(clone);
            document.body.appendChild(sandbox);

            const overlayCanvas = await html2canvas(clone, { width: W, height: H, scale: 1, backgroundColor: null });
            document.body.removeChild(sandbox);

            // Compositor
            const composite = document.createElement('canvas');
            composite.width = W; composite.height = H;
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

            // Stream Setup
            const videoStream = composite.captureStream(60);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest); // Connect audio to stream destination
            
            const audioTracks = dest.stream.getAudioTracks();
            if (audioTracks.length > 0) videoStream.addTrack(audioTracks[0]);

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
                a.download = `OVRLOAD-${Date.now()}.webm`;
                a.click();
                
                // Reconnect source to speakers if needed (it stays connected via fan-out usually)
            };
            
            recorder.start();

            btn.innerHTML = `Stop Rec`;
            btn.classList.remove('bg-cyan-600/10', 'text-cyan-300', 'border-cyan-500/30');
            btn.classList.add('bg-red-600', 'text-white', 'border-red-500');
            status.classList.remove('hidden');

        } catch(e) {
            console.error(e);
            store.isRecording = false;
        }
    }
}

function handleResize() {
    const workspace = document.getElementById('workspace');
    const scaler = document.getElementById('stage-scaler');
    const flyer = document.getElementById('flyer');
    if(!workspace) return;

    flyer.style.width = `${store.dim.width}px`;
    flyer.style.height = `${store.dim.height}px`;

    const scale = Math.min((workspace.clientWidth - 60) / store.dim.width, (workspace.clientHeight - 60) / store.dim.height);
    scaler.style.transform = `scale(${scale})`;
    scaler.style.width = `${store.dim.width}px`;
    scaler.style.height = `${store.dim.height}px`;
}
