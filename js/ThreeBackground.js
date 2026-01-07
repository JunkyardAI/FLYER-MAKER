// --- 3D Engine Component (Vanilla JS Class) ---

class ThreeBackground {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.width = options.width || 1080;
        this.height = options.height || 1920;
        this.accentColor = options.accentColor || '#a855f7';
        
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

        // 1. Scene Setup
        this.scene = new THREE.Scene();
        const aspect = this.width / this.height;
        const fov = aspect < 1 ? 90 : 75; 
        this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        this.camera.position.z = 5;

        // 2. Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true, 
            preserveDrawingBuffer: true, // Needed for recording
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(this.width, this.height);
        // Force high pixel ratio for sharpness
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
        
        this.container.innerHTML = ''; 
        this.container.appendChild(this.renderer.domElement);

        // 3. Objects Group
        const group = new THREE.Group();
        this.scene.add(group);
        this.objects.group = group;

        // 4. Particles
        const particlesGeo = new THREE.BufferGeometry();
        const particleCount = 350;
        const posArr = new Float32Array(particleCount * 3);
        for(let i=0; i<particleCount*3; i++) {
            posArr[i] = (Math.random() - 0.5) * 25;
        }
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        const particlesMat = new THREE.PointsMaterial({ 
            size: 0.05, 
            color: this.accentColor, 
            transparent: true, 
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particlesGeo, particlesMat);
        group.add(particles);
        this.objects.particles = particles;
        this.objects.particlesMat = particlesMat;

        // 5. Main Geometry
        const geometry = new THREE.IcosahedronGeometry(2, 0);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.accentColor, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.15,
            emissive: this.accentColor,
            emissiveIntensity: 0.2,
            roughness: 0.2,
            metalness: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        this.objects.mesh = mesh;
        this.objects.meshMat = material;

        // 6. Inner Core
        const innerGeo = new THREE.IcosahedronGeometry(1, 1);
        const innerMat = new THREE.MeshBasicMaterial({
            color: this.accentColor, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.05
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        group.add(innerMesh);
        this.objects.innerMesh = innerMesh;
        this.objects.innerMat = innerMat;

        // 7. Lighting
        const pointLight = new THREE.PointLight(0xffffff, 2, 50);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        // 8. Start Loop
        this.handleVisibility = () => { this.isActive = !document.hidden; };
        document.addEventListener('visibilitychange', this.handleVisibility);
        this.animate();
    }

    updateColor(hex) {
        this.accentColor = hex;
        if(this.objects.particlesMat) this.objects.particlesMat.color.set(hex);
        if(this.objects.meshMat) {
            this.objects.meshMat.color.set(hex);
            this.objects.meshMat.emissive.set(hex);
        }
        if(this.objects.innerMat) this.objects.innerMat.color.set(hex);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        if (this.camera && this.renderer) {
            this.camera.aspect = width / height;
            this.camera.fov = (width / height) < 1 ? 90 : 75;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    }

    animate = () => {
        if (this.isActive && this.renderer && this.scene && this.camera) {
            const time = Date.now() * 0.0005;
            const group = this.objects.group;
            const mesh = this.objects.mesh;
            const innerMesh = this.objects.innerMesh;

            if (group) {
                group.rotation.y = time * 0.5;
                group.rotation.x = time * 0.2;
            }
            if (mesh) {
                const s = 1 + Math.sin(time * 2) * 0.05;
                mesh.scale.set(s, s, s);
            }
            if (innerMesh) {
                innerMesh.rotation.y = -time;
                innerMesh.rotation.z = time * 0.5;
            }

            this.camera.position.x = Math.sin(time * 0.5) * 0.5;
            this.camera.position.y = Math.cos(time * 0.5) * 0.5;
            this.camera.lookAt(0,0,0);

            this.renderer.render(this.scene, this.camera);
        }
        this.frameId = requestAnimationFrame(this.animate);
    }

    cleanup() {
        this.isActive = false;
        cancelAnimationFrame(this.frameId);
        document.removeEventListener('visibilitychange', this.handleVisibility);
        if (this.renderer) {
            this.renderer.dispose();
            this.container.innerHTML = '';
        }
    }
}
