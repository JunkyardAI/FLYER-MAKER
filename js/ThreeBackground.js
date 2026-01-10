class ThreeBackground {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: 1080,
            height: 1920,
            accentColor: '#06b6d4',
            ...options
        };
        
        // Visualizer Params
        this.params = {
            sensitivity: 1.5,
            speed: 0.3,
            bloom: 0.4
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
        this.camera.position.z = 6;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true, 
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.options.width, this.options.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
        
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // --- Objects ---
        const group = new THREE.Group();
        this.scene.add(group);
        this.objects.group = group;

        // 1. Core Sphere (Bass Reactor)
        // More segments for smoother look
        const coreGeo = new THREE.IcosahedronGeometry(1.5, 4); 
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: this.options.accentColor, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.3,
            emissive: this.options.accentColor,
            emissiveIntensity: 0.5
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);
        this.objects.core = core;
        this.objects.coreMat = coreMat;

        // 2. Outer Ring (Mids Reactor)
        const ringGeo = new THREE.TorusGeometry(3.5, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.1
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        this.objects.ring = ring;

        // 3. Particles (Highs Reactor)
        const partCount = 600;
        const partGeo = new THREE.BufferGeometry();
        const posArr = new Float32Array(partCount * 3);
        const randoms = new Float32Array(partCount); // Store random offsets
        
        for(let i=0; i<partCount*3; i+=3) {
            // Spiral distribution
            const r = 3 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;
            
            posArr[i] = r * Math.sin(theta) * Math.cos(phi);
            posArr[i+1] = r * Math.sin(theta) * Math.sin(phi);
            posArr[i+2] = r * Math.cos(theta);
            
            randoms[i/3] = Math.random();
        }
        
        partGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        partGeo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        const partMat = new THREE.PointsMaterial({
            size: 0.08,
            color: this.options.accentColor,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(partGeo, partMat);
        group.add(particles);
        this.objects.particles = particles;
        this.objects.particlesMat = partMat;

        // Lights
        const pLight = new THREE.PointLight(0xffffff, 2, 50);
        pLight.position.set(0, 5, 0);
        this.scene.add(pLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.2));

        // State
        this.handleVisibility = () => { this.isActive = !document.hidden; };
        document.addEventListener('visibilitychange', this.handleVisibility);
        this.animate();
    }

    updateColor(hex) {
        this.options.accentColor = hex;
        if(this.objects.coreMat) {
            this.objects.coreMat.color.set(hex);
            this.objects.coreMat.emissive.set(hex);
        }
        if(this.objects.particlesMat) {
            this.objects.particlesMat.color.set(hex);
        }
    }

    updateParams(key, value) {
        if(this.params.hasOwnProperty(key)) {
            this.params[key] = parseFloat(value);
        }
    }

    // Called every frame with audio data (0-255 array)
    updateAudio(dataArray) {
        if(!dataArray) return;

        // 1. Analyze Frequencies
        // Lows: 0-10, Mids: 10-100, Highs: 100+
        let bass = 0, mids = 0, highs = 0;
        
        for(let i=0; i<dataArray.length; i++) {
            const val = dataArray[i];
            if(i < 10) bass += val;
            else if(i < 50) mids += val;
            else highs += val;
        }
        
        bass /= 10;
        mids /= 40;
        highs /= (dataArray.length - 50);

        // Normalize (0.0 - 1.0) approx
        const bassN = (bass / 255) * this.params.sensitivity;
        const midsN = (mids / 255) * this.params.sensitivity;
        const highsN = (highs / 255) * this.params.sensitivity;

        // Apply visual changes
        if (this.objects.core) {
            const scale = 1 + (bassN * 0.8); // Pulse on bass
            this.objects.core.scale.set(scale, scale, scale);
            this.objects.coreMat.emissiveIntensity = 0.5 + (bassN * this.params.bloom);
            this.objects.core.rotation.y += 0.01 * midsN;
        }

        if (this.objects.particles) {
            this.objects.particles.rotation.y -= (0.002 + (highsN * 0.02)); // Spin faster on highs
            this.objects.particlesMat.size = 0.08 + (midsN * 0.1);
        }

        if (this.objects.ring) {
            this.objects.ring.rotation.z += 0.01 + (bassN * 0.05);
            const s = 1 + (midsN * 0.2);
            this.objects.ring.scale.set(s, s, s);
        }
    }

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
            // Idle Animation (if no audio)
            const time = Date.now() * 0.001;
            const baseSpeed = this.params.speed;

            this.objects.group.rotation.y += 0.002 * (1 + baseSpeed);
            this.objects.group.rotation.z = Math.sin(time * 0.2) * 0.1;

            this.renderer.render(this.scene, this.camera);
        }
        this.frameId = requestAnimationFrame(this.animate);
    }
}
