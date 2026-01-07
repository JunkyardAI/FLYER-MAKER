// --- 3D Engine Component ---
// We attach to 'window' to ensure it's accessible globally to app.js 
// when using Babel Standalone.

const { useRef, useEffect } = React;

window.ThreeBackground = ({ accentColor, width, height }) => {
    const mountRef = useRef(null);
    
    useEffect(() => {
        if (!mountRef.current) return;

        // 1. Scene Setup
        const scene = new THREE.Scene();
        const aspect = width / height;
        const fov = aspect < 1 ? 90 : 75; 
        const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        camera.position.z = 5;

        // 2. Renderer (High Performance Settings)
        const renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true, 
            preserveDrawingBuffer: true, // Required for media capture
            powerPreference: "high-performance"
        });
        
        renderer.setSize(width, height);
        // Cap pixel ratio to save GPU on high-DPI screens during recording
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
        mountRef.current.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        // 3. Particles System
        const particlesGeo = new THREE.BufferGeometry();
        const particleCount = 350;
        const posArr = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount*3; i++) {
            posArr[i] = (Math.random() - 0.5) * 25;
        }
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        const particlesMat = new THREE.PointsMaterial({ 
            size: 0.05, 
            color: accentColor, 
            transparent: true, 
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particlesGeo, particlesMat);
        group.add(particles);

        // 4. Main Geometry
        const geometry = new THREE.IcosahedronGeometry(2, 0);
        const material = new THREE.MeshStandardMaterial({ 
            color: accentColor, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.15,
            emissive: accentColor,
            emissiveIntensity: 0.2,
            roughness: 0.2,
            metalness: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);

        // 5. Inner Core
        const innerGeo = new THREE.IcosahedronGeometry(1, 1);
        const innerMat = new THREE.MeshBasicMaterial({
            color: accentColor,
            wireframe: true, 
            transparent: true, 
            opacity: 0.05
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        group.add(innerMesh);

        // 6. Lighting
        const pointLight = new THREE.PointLight(0xffffff, 2, 50);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        // 7. Optimized Animation Loop
        let frameId;
        let isActive = true;

        // Performance: Stop rendering when tab is hidden
        const handleVisibility = () => { isActive = !document.hidden; };
        document.addEventListener('visibilitychange', handleVisibility);

        const animate = () => {
            if (isActive) {
                const time = Date.now() * 0.0005;
                
                group.rotation.y = time * 0.5;
                group.rotation.x = time * 0.2;
                
                const s = 1 + Math.sin(time * 2) * 0.05;
                mesh.scale.set(s, s, s);
                
                innerMesh.rotation.y = -time;
                innerMesh.rotation.z = time * 0.5;

                camera.position.x = Math.sin(time * 0.5) * 0.5;
                camera.position.y = Math.cos(time * 0.5) * 0.5;
                camera.lookAt(0,0,0);

                renderer.render(scene, camera);
            }
            frameId = requestAnimationFrame(animate);
        };
        animate();

        // 8. Cleanup (Crucial for Memory Management)
        return () => {
            isActive = false;
            cancelAnimationFrame(frameId);
            document.removeEventListener('visibilitychange', handleVisibility);
            
            if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
            
            geometry.dispose(); 
            material.dispose();
            innerGeo.dispose();
            innerMat.dispose();
            particlesGeo.dispose();
            particlesMat.dispose();
            renderer.dispose();
        };
    }, [accentColor, width, height]);

    return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
};