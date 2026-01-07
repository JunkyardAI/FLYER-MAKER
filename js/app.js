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
        { id: 1, title: "ABLETON LESSONS", price: "$40 / hour", features: ["Workflow", "Sound Design"] },
        { id: 2, title: "BEAT LEASES", price: "$20 - $60", features: ["High Quality", "Instant DL"] },
        { id: 3, title: "MIX & MASTER", price: "$80 / track", features: ["Pro Sound", "Ready to Stream"] }
    ],
    cinemaMode: false,
    isRecording: false
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

// --- Rendering Logic ---

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
            handleResize(); // Rescale and re-init 3D
            threeBgInstance.resize(preset.width, preset.height);
            initThreeJS(); // Re-init needed for aspect ratio changes
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
        
        // Title Row
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

        // Price Input
        const priceInput = document.createElement('input');
        priceInput.value = section.price;
        priceInput.className = "bg-transparent text-[11px] text-purple-400 w-full outline-none font-bold italic mb-2 placeholder-purple-400/30";
        priceInput.placeholder = "PRICE";
        priceInput.oninput = (e) => {
            section.price = e.target.value.slice(0, 20);
            renderServicesFlyer();
        };

        // Features Input
        const featureContainer = document.createElement('div');
        featureContainer.className = "border-t border-white/5 pt-2";
        const featInput = document.createElement('input');
        featInput.value = section.features.join(', ');
        featInput.className = "bg-black/20 text-[9px] text-white/60 w-full outline-none rounded px-2 py-1 placeholder-white/10";
        featInput.placeholder = "Feature 1, Feature 2";
        featInput.oninput = (e) => {
            const val = e.target.value;
            section.features = val.split(',').map(f => f.trim()).filter(f => f.length > 0).slice(0, 3);
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
    
    // Update Grid Layout Class based on count
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
    // Colors
    document.getElementById('flyer-title').style.color = store.accentColor;
    document.getElementById('flyer-title').style.textShadow = `0 0 80px ${store.accentColor}44`;
    document.getElementById('flyer-dot').style.backgroundColor = store.accentColor;
    
    // Text Content
    document.getElementById('flyer-title').textContent = store.title;
    document.getElementById('flyer-subtitle').textContent = store.subtitle;
    document.getElementById('flyer-contact').textContent = store.contact;
}

// --- Logic ---

function addSection() {
    if (store.sections.length >= 6) return;
    store.sections.push({
        id: Date.now(), 
        title: "NEW SERVICE", 
        price: "$0.00", 
        features: ["Detail 1", "Detail 2"]
    });
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
    // Branding Inputs
    document.getElementById('input-accent').oninput = (e) => {
        store.accentColor = e.target.value;
        document.getElementById('color-preview').style.backgroundColor = store.accentColor;
        threeBgInstance.updateColor(store.accentColor);
        updateFlyerText();
        renderServicesFlyer(); // Re-render to update price colors
    };

    document.getElementById('input-title').oninput = (e) => {
        store.title = e.target.value.slice(0, 15).toUpperCase();
        updateFlyerText();
    };
    document.getElementById('input-subtitle').oninput = (e) => {
        store.subtitle = e.target.value.slice(0, 30).toUpperCase();
        updateFlyerText();
    };
    document.getElementById('input-contact').oninput = (e) => {
        store.contact = e.target.value;
        updateFlyerText();
    };

    // Add Service Button
    document.getElementById('btn-add-service').onclick = addSection;

    // Cinema Mode
    const header = document.getElementById('app-header');
    const sidebar = document.getElementById('sidebar');
    const exitBtn = document.getElementById('cinema-exit-btn');
    const flyer = document.getElementById('flyer');

    const toggleCinema = (active) => {
        store.cinemaMode = active;
        if (active) {
            header.style.transform = 'translateY(-100%)';
            sidebar.classList.add('hidden');
            exitBtn.classList.remove('hidden');
            flyer.style.boxShadow = 'none';
        } else {
            header.style.transform = 'translateY(0)';
            sidebar.classList.remove('hidden');
            exitBtn.classList.add('hidden');
            flyer.style.boxShadow = '0 0 100px rgba(0,0,0,0.8)';
        }
        handleResize(); // Trigger resize to remove padding calculations
    };

    document.getElementById('btn-cinema').onclick = () => toggleCinema(true);
    exitBtn.querySelector('button').onclick = () => toggleCinema(false);

    // Recording
    document.getElementById('btn-record').onclick = toggleRecording;

    // Drag Logic for Sidebar
    setupDrag();
}

function handleResize() {
    const container = document.getElementById('main-container');
    const flyer = document.getElementById('flyer');
    const { clientWidth, clientHeight } = container;
    
    const hPad = store.cinemaMode ? 0 : 80; 
    const vPad = store.cinemaMode ? 0 : 80;
    
    const scaleX = (clientWidth - hPad) / store.dimensions.width;
    const scaleY = (clientHeight - vPad) / store.dimensions.height;
    const scale = Math.max(Math.min(scaleX, scaleY), 0.15);
    
    flyer.style.transform = `scale(${scale})`;
    flyer.style.width = `${store.dimensions.width}px`;
    flyer.style.height = `${store.dimensions.height}px`;
}

window.addEventListener('resize', handleResize);

// --- Drag Logic ---
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

// --- Recording Logic ---
async function toggleRecording() {
    const btnText = document.getElementById('record-text');
    const btn = document.getElementById('btn-record');
    const indicator = document.getElementById('recording-indicator');

    if (store.isRecording) {
        // STOP
        if(mediaRecorder) mediaRecorder.stop();
        store.isRecording = false;
        btn.classList.remove('bg-red-600', 'border-red-500', 'animate-pulse', 'text-white');
        btn.classList.add('bg-purple-600/10', 'border-purple-500/50', 'text-purple-300');
        btnText.textContent = "Export Video";
        indicator.classList.add('hidden');
        
        // Exit cinema mode automatically
        document.getElementById('cinema-exit-btn').querySelector('button').click();
    } else {
        // START
        try {
            // Enter Cinema Mode
            document.getElementById('btn-cinema').click();
            await new Promise(r => setTimeout(r, 200));

            const stream = await navigator.mediaDevices.getDisplayMedia({ 
                video: { frameRate: 60, displaySurface: "browser", cursor: "never" },
                audio: false 
            });

            const chunks = [];
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
            mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 });
            
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `flightdeck-${store.title}-${Date.now()}.webm`;
                a.click();
                stream.getTracks().forEach(t => t.stop());
                
                // Reset UI if stopped via browser UI
                if (store.isRecording) toggleRecording(); 
            };

            stream.getVideoTracks()[0].onended = () => {
                if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
            };

            mediaRecorder.start();
            store.isRecording = true;
            
            // Update UI
            btn.classList.remove('bg-purple-600/10', 'border-purple-500/50', 'text-purple-300');
            btn.classList.add('bg-red-600', 'border-red-500', 'animate-pulse', 'text-white');
            btnText.textContent = "Stop Rec";
            indicator.classList.remove('hidden');

        } catch (err) {
            console.error("Recording failed", err);
            alert("Could not start recording.");
            // Restore UI
            document.getElementById('cinema-exit-btn').querySelector('button').click();
        }
    }
}
