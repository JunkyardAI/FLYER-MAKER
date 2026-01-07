// --- Main Application Logic ---
const { useState, useRef, useEffect, useCallback } = React;

// Retrieve the 3D component from the global window object (set in ThreeBackground.js)
const ThreeBackground = window.ThreeBackground;

// --- Icon Wrapper ---
const LucideIcon = ({ name, size = 24, color = "currentColor", className = "", ...props }) => {
    const iconDef = lucide.icons[name];
    if (!iconDef) return null;
    return React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: className,
        ...props
    }, ...iconDef.map(([tag, attrs], i) => React.createElement(tag, { ...attrs, key: i })));
};

// Icon Components
const Icons = {
    Download: (p) => <LucideIcon name="Download" {...p} />,
    Layout: (p) => <LucideIcon name="Layout" {...p} />,
    Type: (p) => <LucideIcon name="Type" {...p} />,
    Palette: (p) => <LucideIcon name="Palette" {...p} />,
    Video: (p) => <LucideIcon name="Video" {...p} />,
    Maximize2: (p) => <LucideIcon name="Maximize2" {...p} />,
    Plus: (p) => <LucideIcon name="Plus" {...p} />,
    Trash2: (p) => <LucideIcon name="Trash2" {...p} />,
    Settings2: (p) => <LucideIcon name="Settings2" {...p} />,
    GripVertical: (p) => <LucideIcon name="GripVertical" {...p} />,
    Monitor: (p) => <LucideIcon name="Monitor" {...p} />,
    X: (p) => <LucideIcon name="X" {...p} />
};

const PRESETS = {
    'tiktok': { name: 'TikTok / Reels', width: 1080, height: 1920, label: '9:16' },
    'instagram': { name: 'Instagram Square', width: 1080, height: 1080, label: '1:1' },
    'portrait': { name: 'IG Portrait', width: 1080, height: 1350, label: '4:5' },
    'youtube': { name: 'YouTube', width: 1280, height: 720, label: '16:9' },
};

const INITIAL_DATA = {
    title: "ZAYTOOLIT",
    subtitle: "SERVICES & PRICING",
    contact: "@zaytoolit",
    sections: [
        { id: 1, title: "ABLETON LESSONS", price: "$40 / hour", features: ["Workflow", "Sound Design"] },
        { id: 2, title: "BEAT LEASES", price: "$20 - $60", features: ["High Quality", "Instant DL"] },
        { id: 3, title: "MIX & MASTER", price: "$80 / track", features: ["Pro Sound", "Ready to Stream"] }
    ]
};

const FlyerApp = () => {
    const [dimensions, setDimensions] = useState(PRESETS['tiktok']);
    const [content, setContent] = useState(INITIAL_DATA);
    const [accentColor, setAccentColor] = useState('#a855f7');
    const [scale, setScale] = useState(0.4);
    const [isRecording, setIsRecording] = useState(false);
    const [cinemaMode, setCinemaMode] = useState(false);
    
    // Panel State
    const [panelPos, setPanelPos] = useState({ x: 40, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const flyerRef = useRef(null);
    const containerRef = useRef(null);
    const mediaRecorderRef = useRef(null);

    // Responsive Scaling
    useEffect(() => {
        if (!containerRef.current) return;
        const updateScale = () => {
            if (!containerRef.current) return;
            const { clientWidth, clientHeight } = containerRef.current;
            const hPad = cinemaMode ? 0 : 80; 
            const vPad = cinemaMode ? 0 : 80;
            const scaleX = (clientWidth - hPad) / dimensions.width;
            const scaleY = (clientHeight - vPad) / dimensions.height;
            setScale(Math.max(Math.min(scaleX, scaleY), 0.15));
        };
        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(containerRef.current);
        updateScale();
        return () => resizeObserver.disconnect();
    }, [dimensions, cinemaMode]);

    // Drag Logic
    const startDrag = useCallback((clientX, clientY) => {
        setIsDragging(true);
        dragOffset.current = { x: clientX - panelPos.x, y: clientY - panelPos.y };
    }, [panelPos]);

    const moveDrag = useCallback((clientX, clientY) => {
        if (!isDragging) return;
        const newX = Math.max(0, Math.min(clientX - dragOffset.current.x, window.innerWidth - 320));
        const newY = Math.max(60, Math.min(clientY - dragOffset.current.y, window.innerHeight - 100));
        setPanelPos({ x: newX, y: newY });
    }, [isDragging]);

    useEffect(() => {
        const onMouseMove = (e) => moveDrag(e.clientX, e.clientY);
        const onTouchMove = (e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        const stop = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', stop);
            window.addEventListener('touchmove', onTouchMove, { passive: false });
            window.addEventListener('touchend', stop);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', stop);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', stop);
        };
    }, [isDragging, moveDrag]);

    // Content Updates
    const updateSection = (id, field, value) => {
        const limits = { title: 30, price: 20 };
        const sanitizedValue = limits[field] ? value.slice(0, limits[field]) : value;
        setContent(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === id ? { ...s, [field]: sanitizedValue } : s)
        }));
    };

    const updateFeatures = (id, valueString) => {
        const newFeatures = valueString.split(',').map(f => f.trim()).filter(f => f.length > 0).slice(0, 3);
        setContent(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === id ? { ...s, features: newFeatures } : s)
        }));
    };

    // Recording Logic
    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            setCinemaMode(false);
        } else {
            try {
                setCinemaMode(true);
                await new Promise(r => setTimeout(r, 100)); // UI Settle time

                const stream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: { frameRate: 60, displaySurface: "browser", cursor: "never" },
                    audio: false 
                });

                const chunks = [];
                const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
                mediaRecorderRef.current = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 });
                
                mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
                mediaRecorderRef.current.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `flightdeck-${content.title}-${Date.now()}.webm`;
                    a.click();
                    stream.getTracks().forEach(t => t.stop());
                    setIsRecording(false);
                    setCinemaMode(false);
                };

                stream.getVideoTracks()[0].onended = () => {
                    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop();
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Recording failed", err);
                setCinemaMode(false);
                alert("Could not start recording.");
            }
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#020202] text-white font-sans overflow-hidden select-none">
            {/* Header */}
            <header className={`h-14 border-b border-white/5 bg-black flex items-center justify-between px-6 z-[60] relative transition-transform duration-300 ${cinemaMode ? '-translate-y-full' : 'translate-y-0'}`}>
                <div className="flex items-center gap-2">
                    <div className="bg-purple-600 p-1.5 rounded-md shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        <Icons.Layout size={16} className="text-white" />
                    </div>
                    <span className="font-black text-sm tracking-tighter uppercase italic">
                        FlightDeck <span className="text-purple-500 text-[10px] align-top ml-0.5">PRO</span>
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setCinemaMode(true)} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest border border-white/5 hover:border-white/10 flex items-center gap-2">
                        <Icons.Monitor size={12} /> View
                    </button>
                    <button onClick={toggleRecording} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest border shadow-xl flex items-center gap-2 ${isRecording ? 'bg-red-600 border-red-500 animate-pulse' : 'bg-purple-600/10 border-purple-500/50 text-purple-300 hover:bg-purple-600/20'}`}>
                        <Icons.Video size={12} /> {isRecording ? 'Stop Rec' : 'Export Video'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 relative overflow-hidden bg-[#050505]" ref={containerRef}>
                {/* Properties Panel */}
                {!cinemaMode && (
                    <aside 
                        style={{ transform: `translate(${panelPos.x}px, ${panelPos.y}px)`, width: '320px', zIndex: 100 }}
                        className={`absolute top-0 left-0 bg-black/80 backdrop-blur-xl border border-white/10 flex flex-col rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-shadow duration-200 ${isDragging ? 'shadow-[0_0_30px_rgba(168,85,247,0.2)] cursor-grabbing' : ''}`}
                    >
                        <div 
                            onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
                            onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
                            className="h-10 bg-white/5 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing border-b border-white/5 select-none"
                        >
                            <div className="flex items-center gap-2">
                                <Icons.Settings2 size={12} className="text-purple-400" />
                                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Editor</span>
                            </div>
                            <Icons.GripVertical size={14} className="text-white/20" />
                        </div>
                        <div className="p-4 flex flex-col gap-6 overflow-y-auto max-h-[calc(80vh-40px)] custom-scrollbar">
                            <section>
                                <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Icons.Maximize2 size={10}/> Canvas</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(PRESETS).map(([k, v]) => (
                                        <button key={k} onClick={() => setDimensions(v)} className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group ${dimensions.name === v.name ? 'bg-purple-600/20 border-purple-500/50 text-purple-200' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}>
                                            <div className="text-[10px] font-bold z-10 relative">{v.name.split(' ')[0]}</div>
                                            {dimensions.name === v.name && <div className="absolute inset-0 bg-purple-500/10 blur-sm"/>}
                                        </button>
                                    ))}
                                </div>
                            </section>
                            <section>
                                <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Icons.Palette size={10}/> Branding</h3>
                                <div className="space-y-3">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 relative">
                                            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer opacity-0" />
                                            <div className="w-full h-full" style={{backgroundColor: accentColor}}></div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input value={content.title} onChange={(e) => setContent({...content, title: e.target.value.slice(0, 15).toUpperCase()})} className="w-full bg-white/5 border border-white/5 rounded px-2 py-1.5 text-[11px] font-bold outline-none focus:border-purple-500/50 transition-colors placeholder-white/20" placeholder="MAIN TITLE" />
                                            <input value={content.subtitle} onChange={(e) => setContent({...content, subtitle: e.target.value.slice(0, 30).toUpperCase()})} className="w-full bg-white/5 border border-white/5 rounded px-2 py-1.5 text-[10px] font-medium outline-none focus:border-purple-500/50 transition-colors placeholder-white/20 text-white/60" placeholder="SUBTITLE" />
                                        </div>
                                    </div>
                                    <input value={content.contact} onChange={(e) => setContent({...content, contact: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded px-2 py-1.5 text-[10px] font-mono text-center outline-none focus:border-purple-500/50 transition-colors text-purple-300" placeholder="@social_handle" />
                                </div>
                            </section>
                            <section className="flex flex-col gap-3">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2"><Icons.Type size={10}/> Services</h3>
                                    <button onClick={addSection} disabled={content.sections.length >= 6} className="w-5 h-5 flex items-center justify-center bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded transition-all disabled:opacity-20 disabled:cursor-not-allowed"><Icons.Plus size={12} /></button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {content.sections.map((s, index) => (
                                        <div key={s.id} className="p-3 bg-white/5 rounded-xl border border-white/5 group relative hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <input value={s.title} onChange={e => updateSection(s.id, 'title', e.target.value)} className="bg-transparent font-black text-[11px] w-full outline-none uppercase tracking-tight text-white/90 placeholder-white/20" placeholder="SERVICE NAME" />
                                                <button onClick={() => removeSection(s.id)} className="text-white/10 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1"><Icons.Trash2 size={10}/></button>
                                            </div>
                                            <input value={s.price} onChange={e => updateSection(s.id, 'price', e.target.value)} className="bg-transparent text-[11px] text-purple-400 w-full outline-none font-bold italic mb-2 placeholder-purple-400/30" placeholder="PRICE" />
                                            <div className="border-t border-white/5 pt-2">
                                                <input value={s.features.join(', ')} onChange={e => updateFeatures(s.id, e.target.value)} className="bg-black/20 text-[9px] text-white/60 w-full outline-none rounded px-2 py-1 placeholder-white/10" placeholder="Feature 1, Feature 2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </aside>
                )}

                {/* Main Canvas Area */}
                <main className="flex-1 flex items-center justify-center w-full h-full relative p-0">
                    {cinemaMode && !isRecording && (
                        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] animate-fade-in-down">
                            <button onClick={() => setCinemaMode(false)} className="px-6 py-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 shadow-2xl transition-all hover:scale-105 flex items-center gap-2 group">
                                <Icons.X size={12} className="group-hover:text-red-400 transition-colors" /> Exit View
                            </button>
                        </div>
                    )}

                    {isRecording && (
                        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] pointer-events-none">
                            <div className="flex items-center gap-2 px-5 py-2 bg-red-600/20 border border-red-500/50 backdrop-blur-md rounded-full">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Recording</span>
                            </div>
                        </div>
                    )}
                    
                    <div ref={flyerRef} className="relative shadow-2xl overflow-hidden flex flex-col bg-black origin-center transition-transform duration-300 ease-out" style={{ width: dimensions.width, height: dimensions.height, transform: `scale(${scale})`, boxShadow: cinemaMode ? 'none' : '0 0 100px rgba(0,0,0,0.8)' }}>
                        <ThreeBackground accentColor={accentColor} width={dimensions.width} height={dimensions.height} />
                        <div className="absolute inset-0 z-10 p-20 flex flex-col justify-between items-center text-center">
                            <div className="w-full">
                                <h1 className="text-[min(14vw,140px)] font-black italic tracking-[-0.06em] uppercase leading-[0.75] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: accentColor, textShadow: `0 0 80px ${accentColor}44` }}>{content.title}</h1>
                                <div className="flex items-center justify-center gap-6 mt-10">
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    <p className="text-3xl font-black tracking-[0.5em] text-white opacity-40 uppercase whitespace-nowrap">{content.subtitle}</p>
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                </div>
                            </div>
                            <div className={`w-full grid gap-6 ${content.sections.length > 3 ? 'grid-cols-2' : 'grid-cols-1 max-w-4xl'}`}>
                                {content.sections.map((s, i) => (
                                    <div key={s.id} className="p-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-[40px] relative overflow-hidden flex flex-col items-center justify-center" style={{ boxShadow: 'inset 0 0 40px rgba(255,255,255,0.02)' }}>
                                        <div className="absolute right-4 top-2 text-[80px] font-black opacity-[0.03] italic leading-none select-none font-serif">{i + 1}</div>
                                        <h3 className="text-3xl font-black uppercase mb-2 tracking-tighter text-white/90 drop-shadow-lg">{s.title}</h3>
                                        <div className="text-5xl font-black italic mb-5 tracking-tight" style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}33` }}>{s.price}</div>
                                        <div className="flex flex-wrap justify-center gap-3">
                                            {s.features.map((f, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-white/5 rounded-full text-[12px] font-bold uppercase tracking-wider text-white/40 border border-white/5">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="w-full flex justify-between items-end border-t border-white/10 pt-10 mt-4">
                                <div className="text-left">
                                    <div className="text-[12px] font-bold text-white/20 uppercase tracking-[0.4em] mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Available Now</div>
                                    <div className="text-4xl font-black italic tracking-tighter text-white/90">{content.contact}</div>
                                </div>
                                <div className="text-right flex flex-col items-end opacity-30">
                                    <div className="text-[10px] font-black uppercase tracking-[0.8em] mb-2">FlightDeck</div>
                                    <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-white/50" /><div className="w-2 h-2 rounded-full bg-white/50" /><div className="w-10 h-2 rounded-full" style={{ backgroundColor: accentColor }} /></div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-[30%] pointer-events-none bg-gradient-to-b from-white/5 to-transparent z-20" />
                        <div className="absolute bottom-0 left-0 w-full h-[30%] pointer-events-none bg-gradient-to-t from-black/80 to-transparent z-20" />
                        <div className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay bg-carbon z-0" />
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- Mount Application ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<FlyerApp />);