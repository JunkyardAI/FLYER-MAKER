// --- APP LOGIC (Vanilla JS) ---

// --- 1. Constants & State ---
const PRESETS = {
    'tiktok': { name: 'TikTok', width: 1080, height: 1920, label: '9:16' },
    'instagram': { name: 'Instagram', width: 1080, height: 1080, label: '1:1' },
    'portrait': { name: 'Portrait', width: 1080, height: 1350, label: '4:5' },
};

const store = {
    dim: PRESETS['tiktok'],
    color: '#a855f7',
    title: 'ZAYTOOLIT',
    subtitle: 'SERVICES & PRICING',
    contact: '@zaytoolit',
    sections: [
        { id: 1, title: 'ABLETON LESSONS', price: '$40 / hr', feats: ['Workflow', 'Sound Design'] },
        { id: 2, title: 'BEAT LEASES', price: '$20 - $60', feats: ['Instant DL', 'WAV + Stems'] },
        { id: 3, title: 'MIXING', price: '$80 / track', feats: ['Pro Sound', 'Quick Turnaround'] }
    ],
    isRecording: false
};

let threeBg = null;
let recorder = null;
let animationFrame = null;

// --- 2. Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // Init 3D Background
    threeBg = new ThreeBackground('three-container', {
        width: store.dim.width,
        height: store.dim.height,
        accentColor: store.color
    });

    // Initial Renders
    renderPresets();
    renderSidebarServices();
    renderFlyerContent();
    handleResize();

    // Event Listeners
    setupInputs();
    setupButtons();
    window.addEventListener('resize', handleResize);
});

// --- 3. Viewport & Scaling Logic ---
function handleResize() {
    // This function ensures the flyer fits on your screen (DISPLAY MODE)
    // It does NOT affect the export resolution.
    const workspace = document.getElementById('workspace');
    const scaler = document.getElementById('stage-scaler');
    const flyer = document.getElementById('flyer');

    if(!workspace || !scaler || !flyer) return;

    // Set physical dimensions of the flyer DOM element
    flyer.style.width = `${store.dim.width}px`;
    flyer.style.height = `${store.dim.height}px`;

    // Calculate Scale Factor
    const padding = 60; 
    const availW = workspace.clientWidth - padding;
    const availH = workspace.clientHeight - padding;
    
    const scaleW = availW / store.dim.width;
    const scaleH = availH / store.dim.height;
    const scale = Math.min(scaleW, scaleH);

    // Apply Scale
    scaler.style.transform = `scale(${scale})`;
    
    // Center logic handled by flexbox in parent
    scaler.style.width = `${store.dim.width}px`;
    scaler.style.height = `${store.dim.height}px`;
}

// --- 4. Render Functions ---
function renderPresets() {
    const el = document.getElementById('preset-container');
    el.innerHTML = '';
    Object.values(PRESETS).forEach(p => {
        const btn = document.createElement('button');
        const active = store.dim.name === p.name;
        btn.className = `p-2 rounded border text-xs font-bold transition-colors ${active ? 'bg-purple-600/30 border-purple-500 text-purple-200' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`;
        btn.textContent = p.name;
        btn.onclick = () => {
            store.dim = p;
            renderPresets(); // Update active state
            handleResize();  // Rescale view
            threeBg.resize(p.width, p.height); // Update 3D aspect ratio
        };
        el.appendChild(btn);
    });
}

function renderSidebarServices() {
    const el = document.getElementById('services-list');
    el.innerHTML = '';
    store.sections.forEach(s => {
        const div = document.createElement('div');
        div.className = 'bg-white/5 p-3 rounded-lg border border-white/5 space-y-2 group hover:border-white/20 transition-colors';
        div.innerHTML = `
            <div class="flex gap-2">
                <input class="bg-transparent font-bold text-xs uppercase w-full outline-none text-white/90" value="${s.title}" data-id="${s.id}" data-field="title">
                <button class="text-white/20 hover:text-red-400" onclick="removeService(${s.id})"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
            </div>
            <input class="bg-transparent font-bold text-xs text-purple-400 w-full outline-none" value="${s.price}" data-id="${s.id}" data-field="price">
            <input class="bg-black/20 rounded px-2 py-1 text-[10px] text-white/60 w-full outline-none" value="${s.feats.join(', ')}" data-id="${s.id}" data-field="feats">
        `;
        // Add listeners to inputs
        div.querySelectorAll('input').forEach(inp => {
            inp.oninput = (e) => {
                const field = e.target.dataset.field;
                const val = e.target.value;
                if(field === 'feats') s.feats = val.split(',').map(x=>x.trim());
                else s[field] = val;
                renderFlyerContent();
            };
        });
        el.appendChild(div);
    });
    lucide.createIcons();
}

function renderFlyerContent() {
    // Branding
    const titleEl = document.getElementById('display-title');
    titleEl.textContent = store.title;
    titleEl.style.color = store.color; // Fallback
    // Advanced Gradient Text
    titleEl.style.backgroundImage = `linear-gradient(to bottom, #ffffff, ${store.color})`;
    titleEl.style.webkitBackgroundClip = 'text';
    titleEl.style.webkitTextFillColor = 'transparent';
    titleEl.style.filter = `drop-shadow(0 0 20px ${store.color}66)`; // Glow

    document.getElementById('display-subtitle').textContent = store.subtitle;
    document.getElementById('display-contact').textContent = store.contact;
    document.getElementById('display-contact').style.color = store.color;

    // Services Grid
    const grid = document.getElementById('display-grid');
    grid.innerHTML = '';
    // Adapt grid columns based on count
    grid.className = `w-full max-w-[80%] mx-auto grid gap-6 ${store.sections.length > 3 ? 'grid-cols-2' : 'grid-cols-1'}`;

    store.sections.forEach((s, idx) => {
        const item = document.createElement('div');
        item.className = 'relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl flex flex-col items-center justify-center overflow-hidden';
        item.innerHTML = `
            <div class="absolute -right-2 -top-4 text-[80px] font-black opacity-[0.03] italic">${idx+1}</div>
            <h3 class="text-2xl font-black uppercase tracking-tight mb-1 text-white">${s.title}</h3>
            <div class="text-3xl font-black italic mb-3" style="color: ${store.color}">${s.price}</div>
            <div class="flex flex-wrap justify-center gap-2">
                ${s.feats.map(f => `<span class="px-2 py-0.5 bg-white/10 rounded text-[10px] uppercase font-bold tracking-wider text-white/60">${f}</span>`).join('')}
            </div>
        `;
        grid.appendChild(item);
    });

    // 3D Color update
    threeBg.updateColor(store.color);
}

// --- 5. Inputs & Actions ---
function setupInputs() {
    const bind = (id, field) => {
        document.getElementById(id).oninput = (e) => {
            store[field] = e.target.value.toUpperCase(); // Force uppercase for style
            if(field === 'color') store.color = e.target.value; // Don't uppercase color hex
            renderFlyerContent();
        };
    };
    bind('input-title', 'title');
    bind('input-subtitle', 'subtitle');
    bind('input-contact', 'contact');
    bind('input-accent', 'color');
}

function setupButtons() {
    document.getElementById('btn-add-service').onclick = () => {
        if(store.sections.length < 6) {
            store.sections.push({ id: Date.now(), title: 'NEW', price: '$0', feats: ['Info'] });
            renderSidebarServices();
            renderFlyerContent();
        }
    };
    document.getElementById('btn-snapshot').onclick = exportSnapshot;
    document.getElementById('btn-record').onclick = exportVideo;
}

window.removeService = (id) => {
    if(store.sections.length > 1) {
        store.sections = store.sections.filter(s => s.id !== id);
        renderSidebarServices();
        renderFlyerContent();
    }
};

// ==========================================
// 6. EXPORT ENGINE (The Solution)
// ==========================================

// A. SNAPSHOT (PNG)
async function exportSnapshot() {
    const btn = document.getElementById('btn-snapshot');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Saving...';

    // 1. Create invisible Sandbox at TARGET RESOLUTION (e.g., 1080x1920)
    const sandbox = document.createElement('div');
    Object.assign(sandbox.style, {
        position: 'fixed', top: '0', left: '-9999px',
        width: `${store.dim.width}px`, height: `${store.dim.height}px`,
        zIndex: '-1', overflow: 'hidden'
    });
    document.body.appendChild(sandbox);

    // 2. Clone Flyer DOM
    const flyer = document.getElementById('flyer');
    const clone = flyer.cloneNode(true);
    
    // 3. Normalize Clone (Remove scaling, set explicit sizes)
    clone.style.transform = 'none'; 
    clone.style.width = '100%'; 
    clone.style.height = '100%';
    
    // 4. Capture 3D Canvas Image
    // (We can't clone a WebGL context, so we take a dataURL snapshot of it)
    const canvas = flyer.querySelector('canvas');
    if(canvas) {
        const img = new Image();
        img.src = canvas.toDataURL('image/png', 1.0);
        img.className = 'absolute inset-0 w-full h-full object-cover';
        const cloneBg = clone.querySelector('#three-container');
        cloneBg.innerHTML = '';
        cloneBg.appendChild(img);
    }

    sandbox.appendChild(clone);

    // 5. Render to Canvas
    try {
        const resultCanvas = await html2canvas(clone, {
            width: store.dim.width,
            height: store.dim.height,
            scale: 1, // 1:1 of the sandbox (which is already 1080p)
            useCORS: true,
            backgroundColor: '#000000',
            logging: false
        });

        // 6. Download
        const link = document.createElement('a');
        link.download = `FlightDeck-${store.title}-${Date.now()}.png`;
        link.href = resultCanvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        console.error(e);
        alert("Snapshot failed");
    } finally {
        document.body.removeChild(sandbox);
        btn.innerHTML = originalText;
    }
}

// B. VIDEO COMPOSITOR (1080p/60fps)
async function exportVideo() {
    const btn = document.getElementById('btn-record');
    const status = document.getElementById('recording-status');

    if(store.isRecording) {
        // STOP
        store.isRecording = false;
        if(recorder) recorder.stop();
        if(animationFrame) cancelAnimationFrame(animationFrame);
        
        btn.classList.remove('bg-red-600', 'text-white', 'border-red-500');
        btn.classList.add('bg-purple-600/10', 'text-purple-300', 'border-purple-500/30');
        btn.innerHTML = `<i data-lucide="video" class="w-3 h-3"></i> <span>Export Video</span>`;
        status.classList.add('hidden');
        lucide.createIcons();
        
        // Reset 3D Engine to display size
        document.getElementById('three-container').style.visibility = 'visible';
        handleResize(); // Triggers logic to fit screen again
        threeBg.resize(store.dim.width, store.dim.height);

    } else {
        // START
        try {
            btn.innerHTML = 'Preparing...';
            
            const W = store.dim.width;
            const H = store.dim.height;

            // 1. Force 3D Engine to Full Resolution
            threeBg.resize(W, H);
            document.getElementById('three-container').style.visibility = 'hidden'; // Hide from view, we render internally

            // 2. Generate High-Res Overlay Image (UI Text)
            // We use the sandbox technique again to get a clean text layer
            const sandbox = document.createElement('div');
            Object.assign(sandbox.style, { position: 'fixed', left: '-9999px', width: `${W}px`, height: `${H}px` });
            const clone = document.getElementById('flyer').cloneNode(true);
            clone.style.transform = 'none';
            clone.querySelector('#three-container').remove(); // Remove 3D from overlay
            sandbox.appendChild(clone);
            document.body.appendChild(sandbox);

            const overlayCanvas = await html2canvas(clone, { 
                width: W, height: H, scale: 1, backgroundColor: null, logging: false 
            });
            document.body.removeChild(sandbox);

            // 3. Setup Compositor
            const composite = document.createElement('canvas');
            composite.width = W;
            composite.height = H;
            const ctx = composite.getContext('2d');
            const source3D = document.querySelector('#three-container canvas');

            // 4. Render Loop
            store.isRecording = true;
            const draw = () => {
                if(!store.isRecording) return;
                ctx.clearRect(0,0,W,H);
                ctx.drawImage(source3D, 0, 0, W, H); // Draw 3D (already running at 1080p)
                ctx.drawImage(overlayCanvas, 0, 0, W, H); // Draw Text Layer
                animationFrame = requestAnimationFrame(draw);
            };
            draw();

            // 5. Start Stream
            const stream = composite.captureStream(60);
            recorder = new MediaRecorder(stream, { 
                mimeType: 'video/webm;codecs=vp9', 
                videoBitsPerSecond: 25000000 // 25 Mbps
            });
            
            const chunks = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `FlightDeck-Video-${Date.now()}.webm`;
                a.click();
            };
            
            recorder.start();

            // Update UI
            btn.classList.remove('bg-purple-600/10', 'text-purple-300', 'border-purple-500/30');
            btn.classList.add('bg-red-600', 'text-white', 'border-red-500');
            btn.innerHTML = `<i data-lucide="square" class="w-3 h-3"></i> <span>Stop Rec</span>`;
            status.classList.remove('hidden');
            lucide.createIcons();

        } catch(e) {
            console.error(e);
            alert("Recording Error");
            store.isRecording = false;
        }
    }
}
