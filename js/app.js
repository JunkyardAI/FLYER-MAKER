// --- Main Application Logic (Vanilla JS) ---

const PRESETS = {
    'tiktok': { name: 'TikTok / Reels', width: 1080, height: 1920, label: '9:16' },
    'instagram': { name: 'Instagram Square', width: 1080, height: 1080, label: '1:1' },
    'portrait': { name: 'IG Portrait', width: 1080, height: 1350, label: '4:5' },
    'youtube': { name: 'YouTube', width: 1280, height: 720, label: '16:9' },
};

// Global State
const store = {
    dimensions: PRESETS['tiktok'],
    accentColor: '#a855f7',
    title: "ZAYTOOLIT",
    subtitle: "SERVICES & PRICING",
    contact: "@zaytoolit",
    sections: [
        { id: 1, title: "ABLETON LESSONS", price: "$40 / hour", features: ["Basics", "Workflow", "Sound Design"] },
        { id: 2, title: "MP3 LEASE (BEATSTARS)", price: "$19.99", features: ["High Quality", "Instant DL", "MP3 FILE"] },
        { id: 3, title: "WAV LEASE (BEATSTARS)", price: "$39.99", features: ["High Quality", "Instant DL", "MP3 & WAV FILE"] },
        { id: 4, title: "MIX & MASTER", price: "$80 / track", features: ["Pro Sound", "Ready to Stream"] }
    ],
    cinemaMode: false,
    isRecording: false,
    compositorLoop: null
};

// 3D Instance
let threeBgInstance = null;
let mediaRecorder = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initIcons();
    initThreeJS();
    renderPresets();
    renderServicesSidebar();
    renderServicesFlyer();
    updateFlyerText();
    setupEventListeners();
    handleResize();
});

function initIcons() {
    lucide.createIcons();
}

function initThreeJS() {
    threeBgInstance = new ThreeBackground('three-bg', {
        width: store.dimensions.width,
        height: store.dimensions.height,
        accentColor: store.accentColor
    });
}

// --- Rendering Logic (UI) ---

function renderPresets() {
    const container = document.getElementById('preset-container');
    container.innerHTML = '';
    
    Object.entries(PRESETS).forEach(([key, preset]) => {
        const btn = document.createElement('button');
        const isActive = store.dimensions.name === preset.name;
        btn.className = `p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group ${isActive ? 'bg-purple-600/20 border-purple-500/50 text-purple-200' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`;
        
        btn.innerHTML = `
            <div class="text-[10px] font-bold z-10 relative">${preset.name.split(' ')[0]}</div>
            ${isActive ? '<div class="absolute inset-0 bg-purple-500/10 blur-sm"></div>' : ''}
        `;
        
        btn.onclick = () => {
            store.dimensions = preset;
            renderPresets();
            handleResize();
            threeBgInstance.resize(preset.width, preset.height);
            initThreeJS();
        };
        container.appendChild(btn);
    });
}

function renderServicesSidebar() {
    const container = document.getElementById('services-list');
    container.innerHTML = '';
    
    store.sections.forEach(section => {
        const el = document.createElement('div');
        el.className = "p-3 bg-white/5 rounded-xl border border-white/5 group relative hover:border-white/10 transition-colors";
        
        // Title
        const titleRow = document.createElement('div');
        titleRow.className = "flex justify-between items-start mb-2 gap-2";
        const titleInput = document.createElement('input');
        titleInput.value = section.title;
        titleInput.className = "bg-transparent font-black text-[11px] w-full outline-none uppercase tracking-tight text-white/90 placeholder-white/20";
        titleInput.placeholder = "SERVICE NAME";
        titleInput.oninput = (e) => {
            section.title = e.target.value.slice(0, 30);
            renderServicesFlyer();
        };
        const delBtn = document.createElement('button');
        delBtn.innerHTML = '<i data-lucide="trash-2" class="w-2.5 h-2.5"></i>';
        delBtn.className = "text-white/10 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1";
        delBtn.onclick = () => removeSection(section.id);
        titleRow.appendChild(titleInput);
        titleRow.appendChild(delBtn);

        // Price
        const priceInput = document.createElement('input');
        priceInput.value = section.price;
        priceInput.className = "bg-transparent text-[11px] text-purple-400 w-full outline-none font-bold italic mb-2 placeholder-purple-400/30";
        priceInput.placeholder = "PRICE";
        priceInput.oninput = (e) => {
            section.price = e.target.value.slice(0, 20);
            renderServicesFlyer();
        };

        // Features
        const featureContainer = document.createElement('div');
        featureContainer.className = "border-t border-white/5 pt-2";
        const featInput = document.createElement('input');
        featInput.value = section.features.join(', ');
        featInput.className = "bg-black/20 text-[9px] text-white/60 w-full outline-none rounded px-2 py-1 placeholder-white/10";
        featInput.placeholder = "Feature 1, Feature 2";
        featInput.oninput = (e) => {
            section.features = e.target.value.split(',').map(f => f.trim()).filter(f => f.length > 0).slice(0, 3);
            renderServicesFlyer();
        };
        featureContainer.appendChild(featInput);

        el.appendChild(titleRow);
        el.appendChild(priceInput);
        el.appendChild(featureContainer);
        container.appendChild(el);
    });
    lucide.createIcons();
}

function renderServicesFlyer() {
    const container = document.getElementById('flyer-services-grid');
    container.innerHTML = '';
    container.className = `w-full grid gap-6 ${store.sections.length > 3 ? 'grid-cols-2' : 'grid-cols-1 max-w-4xl'}`;

    store.sections.forEach((section, index) => {
        const el = document.createElement('div');
        el.className = "p-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-[40px] relative overflow-hidden flex flex-col items-center justify-center";
        el.style.boxShadow = 'inset 0 0 40px rgba(255,255,255,0.02)';
        el.innerHTML = `
            <div class="absolute right-4 top-2 text-[80px] font-black opacity-[0.03] italic leading-none select-none font-serif">${index + 1}</div>
            <h3 class="text-3xl font-black uppercase mb-2 tracking-tighter text-white/90 drop-shadow-lg">${section.title}</h3>
            <div class="text-5xl font-black italic mb-5 tracking-tight" style="color: ${store.accentColor}; text-shadow: 0 0 20px ${store.accentColor}33">${section.price}</div>
            <div class="flex flex-wrap justify-center gap-3">
                ${section.features.map(f => `<span class="px-3 py-1 bg-white/5 rounded-full text-[12px] font-bold uppercase tracking-wider text-white/40 border border-white/5">${f}</span>`).join('')}
            </div>
        `;
        container.appendChild(el);
    });
}

function updateFlyerText() {
    document.getElementById('flyer-title').style.color = store.accentColor;
    document.getElementById('flyer-title').style.textShadow = `0 0 80px ${store.accentColor}44`;
    document.getElementById('flyer-dot').style.backgroundColor = store.accentColor;
    document.getElementById('flyer-title').textContent = store.title;
    document.getElementById('flyer-subtitle').textContent = store.subtitle;
    document.getElementById('flyer-contact').textContent = store.contact;
}

function addSection() {
    if (store.sections.length >= 6) return;
    store.sections.push({ id: Date.now(), title: "NEW SERVICE", price: "$0.00", features: ["Detail"] });
    renderServicesSidebar();
    renderServicesFlyer();
}

function removeSection(id) {
    if (store.sections.length <= 1) return;
    store.sections = store.sections.filter(s => s.id !== id);
    renderServicesSidebar();
    renderServicesFlyer();
}

function setupEventListeners() {
    document.getElementById('input-accent').oninput = (e) => {
        store.accentColor = e.target.value;
        document.getElementById('color-preview').style.backgroundColor = store.accentColor;
        threeBgInstance.updateColor(store.accentColor);
        updateFlyerText();
        renderServicesFlyer();
    };
    document.getElementById('input-title').oninput = (e) => { store.title = e.target.value.slice(0, 15).toUpperCase(); updateFlyerText(); };
    document.getElementById('input-subtitle').oninput = (e) => { store.subtitle = e.target.value.slice(0, 30).toUpperCase(); updateFlyerText(); };
    document.getElementById('input-contact').oninput = (e) => { store.contact = e.target.value; updateFlyerText(); };
    document.getElementById('btn-add-service').onclick = addSection;

    // View Modes
    const toggleCinema = (active) => {
        store.cinemaMode = active;
        const h = document.getElementById('app-header');
        const s = document.getElementById('sidebar');
        const e = document.getElementById('cinema-exit-btn');
        const f = document.getElementById('flyer');
        if (active) {
            h.style.transform = 'translateY(-100%)';
            s.classList.add('hidden');
            e.classList.remove('hidden');
            f.style.boxShadow = 'none';
        } else {
            h.style.transform = 'translateY(0)';
            s.classList.remove('hidden');
            e.classList.add('hidden');
            f.style.boxShadow = '0 0 100px rgba(0,0,0,0.8)';
        }
        handleResize();
    };
    document.getElementById('btn-cinema').onclick = () => toggleCinema(true);
    document.getElementById('cinema-exit-btn').querySelector('button').onclick = () => toggleCinema(false);

    // Recording Buttons
    document.getElementById('btn-record').onclick = toggleCompositorRecording; 
    document.getElementById('btn-bg-rec').onclick = toggleBgRecording;
    
    // Snapshot
    document.getElementById('btn-snapshot').onclick = takeSnapshot;

    setupDrag();
}

function handleResize() {
    const container = document.getElementById('main-container');
    const flyer = document.getElementById('flyer');
    const { clientWidth, clientHeight } = container;
    const pad = store.cinemaMode ? 0 : 80;
    const scaleX = (clientWidth - pad) / store.dimensions.width;
    const scaleY = (clientHeight - pad) / store.dimensions.height;
    const scale = Math.max(Math.min(scaleX, scaleY), 0.15);
    
    flyer.style.transform = `scale(${scale})`;
    flyer.style.width = `${store.dimensions.width}px`;
    flyer.style.height = `${store.dimensions.height}px`;
}

window.addEventListener('resize', handleResize);

function setupDrag() {
    const sidebar = document.getElementById('sidebar');
    const handle = document.getElementById('sidebar-drag');
    let isDragging = false;
    let offset = { x: 0, y: 0 };
    let pos = { x: 40, y: 100 };

    const move = (cx, cy) => {
        if (!isDragging) return;
        const newX = Math.max(0, Math.min(cx - offset.x, window.innerWidth - 320));
        const newY = Math.max(60, Math.min(cy - offset.y, window.innerHeight - 100));
        pos = { x: newX, y: newY };
        sidebar.style.transform = `translate(${newX}px, ${newY}px)`;
    };
    const start = (cx, cy) => {
        isDragging = true;
        offset = { x: cx - pos.x, y: cy - pos.y };
        sidebar.classList.add('shadow-[0_0_30px_rgba(168,85,247,0.2)]', 'cursor-grabbing');
    };
    const stop = () => {
        isDragging = false;
        sidebar.classList.remove('shadow-[0_0_30px_rgba(168,85,247,0.2)]', 'cursor-grabbing');
    };

    handle.addEventListener('mousedown', e => start(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', stop);
    handle.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY));
    window.addEventListener('touchmove', e => move(e.touches[0].clientX, e.touches[0].clientY), {passive: false});
    window.addEventListener('touchend', stop);
}

// ==========================================
// 1. "SANDBOX" SNAPSHOT (Prevents Cutoff)
// ==========================================
async function takeSnapshot() {
    const btn = document.getElementById('btn-snapshot');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-3 h-3 animate-spin"></i> Saving...`;
    lucide.createIcons();

    // 1. Create a hidden sandbox container with NATIVE dimensions
    // This exists outside the scaled view of the app
    const sandbox = document.createElement('div');
    sandbox.style.position = 'fixed';
    sandbox.style.top = '0';
    sandbox.style.left = '0';
    sandbox.style.zIndex = '-9999';
    sandbox.style.width = `${store.dimensions.width}px`;
    sandbox.style.height = `${store.dimensions.height}px`;
    sandbox.style.overflow = 'hidden'; // Ensure content stays inside
    document.body.appendChild(sandbox);

    // 2. Clone the flyer into the sandbox
    const flyer = document.getElementById('flyer');
    const clonedFlyer = flyer.cloneNode(true);
    
    // 3. Reset all scaling logic on the clone
    clonedFlyer.id = 'flyer-clone';
    clonedFlyer.style.transform = 'none';
    clonedFlyer.style.margin = '0';
    clonedFlyer.style.boxShadow = 'none';
    clonedFlyer.style.width = '100%';
    clonedFlyer.style.height = '100%';
    
    // 4. Handle 3D canvas (Canvas cloning doesn't copy context)
    // We need to re-render the 3D scene momentarily or grab its image data
    const originalCanvas = flyer.querySelector('canvas');
    const clonedCanvasDiv = clonedFlyer.querySelector('#three-bg');
    if (originalCanvas && clonedCanvasDiv) {
        clonedCanvasDiv.innerHTML = ''; // Remove empty clone
        const img = new Image();
        img.src = originalCanvas.toDataURL(); // Snapshot of current 3D state
        img.style.width = '100%';
        img.style.height = '100%';
        clonedCanvasDiv.appendChild(img);
    }

    sandbox.appendChild(clonedFlyer);

    try {
        const canvas = await html2canvas(sandbox, {
            scale: 1, // Native 1:1 (which is already 1080p due to sandbox size)
            useCORS: true,
            backgroundColor: '#000000',
            logging: false,
            width: store.dimensions.width,
            height: store.dimensions.height,
            windowWidth: store.dimensions.width,
            windowHeight: store.dimensions.height
        });

        const link = document.createElement('a');
        link.download = `FlightDeck-Snapshot-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error("Snapshot failed", err);
        alert("Snapshot failed. Check console.");
    } finally {
        // Cleanup
        document.body.removeChild(sandbox);
        btn.innerHTML = originalText;
        lucide.createIcons();
    }
}

// ==========================================
// 2. COMPOSITOR VIDEO (4K Overlay -> 1080p Video)
// ==========================================
async function toggleCompositorRecording() {
    const btn = document.getElementById('btn-record');
    const indicator = document.getElementById('recording-indicator');
    const statusText = document.getElementById('recording-status-text');

    if (store.isRecording) {
        if(mediaRecorder) mediaRecorder.stop();
        if(store.compositorLoop) cancelAnimationFrame(store.compositorLoop);
        
        store.isRecording = false;
        store.compositorLoop = null;

        btn.classList.remove('bg-red-600', 'border-red-500', 'animate-pulse', 'text-white');
        btn.classList.add('bg-purple-600/10', 'border-purple-500/50', 'text-purple-300');
        btn.innerHTML = `<i data-lucide="video" class="w-3 h-3"></i> Screen`;
        indicator.classList.add('hidden');
        lucide.createIcons();
        
        handleResize();
        threeBgInstance.resize(store.dimensions.width, store.dimensions.height);
        document.getElementById('three-bg').style.visibility = 'visible';

    } else {
        try {
            btn.innerHTML = `<i data-lucide="loader" class="w-3 h-3 animate-spin"></i> Prep...`;
            lucide.createIcons();

            const width = store.dimensions.width;
            const height = store.dimensions.height;

            // 1. Resize 3D Engine to Full 1080p
            threeBgInstance.resize(width, height);
            
            // 2. Hide 3D momentarily for UI Capture
            const threeBgDiv = document.getElementById('three-bg');
            threeBgDiv.style.visibility = 'hidden';

            // 3. Capture UI as High-Res Image (Scale 2 = 4K Text)
            // Using the same sandbox technique as snapshot would be safer, 
            // but for video we need transparency, so we rely on html2canvas directly
            // but we reset transforms inside onclone.
            const flyer = document.getElementById('flyer');
            const overlayCanvas = await html2canvas(flyer, {
                scale: 2, // SUPER SHARP TEXT (Antialiasing)
                backgroundColor: null, // Transparent
                logging: false,
                onclone: (clonedDoc) => {
                    const cf = clonedDoc.getElementById('flyer');
                    if (cf) {
                        cf.style.transform = 'none';
                        cf.style.boxShadow = 'none';
                        // Fix for text cutoff in video export:
                        cf.style.width = width + 'px';
                        cf.style.height = height + 'px';
                    }
                }
            });
            
            // 4. Setup Compositing Canvas
            const compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = width;
            compositeCanvas.height = height;
            const ctx = compositeCanvas.getContext('2d');

            const webglCanvas = document.querySelector('#three-bg canvas');
            
            // 5. Render Loop
            const drawFrame = () => {
                if (!store.isRecording) return;
                ctx.clearRect(0, 0, width, height);
                
                // Draw 1080p 3D Background
                ctx.drawImage(webglCanvas, 0, 0, width, height);
                
                // Draw 4K UI Overlay (Downsampled to 1080p = Sharp!)
                ctx.drawImage(overlayCanvas, 0, 0, width, height);
                
                store.compositorLoop = requestAnimationFrame(drawFrame);
            };
            
            store.isRecording = true;
            drawFrame();

            // 6. Record Stream
            const stream = compositeCanvas.captureStream(60);
            
            let mimeType = 'video/webm';
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) mimeType = 'video/webm;codecs=vp9';
            else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) mimeType = 'video/webm;codecs=h264';

            mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 25000000 }); // 25 Mbps
            
            const chunks = [];
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `FlightDeck-HD-${Date.now()}.webm`;
                a.click();
            };

            mediaRecorder.start();

            btn.classList.remove('bg-purple-600/10', 'border-purple-500/50', 'text-purple-300');
            btn.classList.add('bg-red-600', 'border-red-500', 'animate-pulse', 'text-white');
            btn.innerHTML = `<i data-lucide="square" class="w-3 h-3"></i> Stop`;
            statusText.innerText = "Recording HD";
            indicator.classList.remove('hidden');
            lucide.createIcons();

        } catch (err) {
            console.error("HD Recording Error:", err);
            alert("Recording failed. " + err.message);
            store.isRecording = false;
            document.getElementById('three-bg').style.visibility = 'visible';
            btn.innerHTML = `<i data-lucide="video" class="w-3 h-3"></i> Screen`;
            lucide.createIcons();
        }
    }
}

// ==========================================
// 3. BACKGROUND ONLY RECORDER
// ==========================================
function toggleBgRecording() {
    const btn = document.getElementById('btn-bg-rec');
    
    if (store.isRecording) {
        if(mediaRecorder) mediaRecorder.stop();
        store.isRecording = false;
        
        btn.classList.remove('bg-red-600', 'border-red-500', 'animate-pulse', 'text-white');
        btn.classList.add('bg-green-600/10', 'border-green-500/30', 'text-green-300');
        btn.innerHTML = `<i data-lucide="aperture" class="w-3 h-3"></i> 3D Only`;
        
        handleResize();
        threeBgInstance.resize(store.dimensions.width, store.dimensions.height);
        lucide.createIcons();
    } else {
        try {
            threeBgInstance.resize(store.dimensions.width, store.dimensions.height);
            const canvas = document.querySelector('#three-bg canvas');
            const stream = canvas.captureStream(60);
            
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 25000000 });
            const chunks = [];
            mediaRecorder.ondataavailable = e => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `FlightDeck-Clean3D-${Date.now()}.webm`;
                a.click();
            };
            
            mediaRecorder.start();
            store.isRecording = true;
            
            btn.classList.remove('bg-green-600/10', 'border-green-500/30', 'text-green-300');
            btn.classList.add('bg-red-600', 'border-red-500', 'animate-pulse', 'text-white');
            btn.innerHTML = `<i data-lucide="square" class="w-3 h-3"></i> Stop`;
            lucide.createIcons();
        } catch (e) {
            console.error(e);
            alert("Failed to start 3D recording");
        }
    }
}

