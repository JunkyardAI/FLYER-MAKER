class ThreeBackground {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: 1080,
            height: 1920,
            accentColor: '#a855f7',
            ...options
        };
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.objects = {};
        this.frameId = null;
        this.isActive = true;

        this.init();
    }

    init() {
        if (!this.container) return;

        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        const aspect = this.options.width / this.options.height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer (High Performance)
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true, 
            preserveDrawingBuffer: true, // Required for recording
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(this.options.width, this.options.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
        
        // Clear and append
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // --- 3D OBJECTS ---
        const group = new THREE.Group();
        this.scene.add(group);
        this.objects.group = group;

        // 1. Icosahedron (Wireframe)
        const geometry = new THREE.IcosahedronGeometry(2.2, 0);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.options.accentColor, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.15,
            emissive: this.options.accentColor,
            emissiveIntensity: 0.4
        });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        this.objects.mesh = mesh;
        this.objects.meshMat = material;

        // 2. Particles
        const partGeo = new THREE.BufferGeometry();
        const partCount = 400;
        const posArr = new Float32Array(partCount * 3);
        for(let i=0; i<partCount*3; i++) posArr[i] = (Math.random() - 0.5) * 25;
        partGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        const partMat = new THREE.PointsMaterial({
            size: 0.06,
            color: this.options.accentColor,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(partGeo, partMat);
        group.add(particles);
        this.objects.particlesMat = partMat;

        // Lights
        const light = new THREE.PointLight(0xffffff, 2, 50);
        light.position.set(5, 5, 5);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        // Start Loop
        this.handleVisibility = () => { this.isActive = !document.hidden; };
        document.addEventListener('visibilitychange', this.handleVisibility);
        this.animate();
    }

    updateColor(hex) {
        this.options.accentColor = hex;
        if(this.objects.meshMat) {
            this.objects.meshMat.color.set(hex);
            this.objects.meshMat.emissive.set(hex);
        }
        if(this.objects.particlesMat) {
            this.objects.particlesMat.color.set(hex);
        }
    }

    // CRITICAL: Call this to change internal resolution without replacing DOM
    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        
        if (this.camera && this.renderer) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    }

    animate = () => {
        if (this.isActive && this.renderer && this.scene && this.camera) {
            const time = Date.now() * 0.0005;
            const group = this.objects.group;
            
            if (group) {
                group.rotation.y = time * 0.3;
                group.rotation.x = Math.sin(time * 0.5) * 0.1;
                
                // Pulse effect
                const s = 1 + Math.sin(time * 1.5) * 0.03;
                this.objects.mesh.scale.set(s, s, s);
            }

            this.renderer.render(this.scene, this.camera);
        }
        this.frameId = requestAnimationFrame(this.animate);
    }
}
