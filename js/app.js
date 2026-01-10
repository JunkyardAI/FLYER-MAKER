// --- OVRLOAD 3D ENGINE ---
// Uses ES Modules for easy Addon imports

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// --- SIMPLEX NOISE IMPLEMENTATION ---
const SimplexNoise=(function(){function t(t){var e,r=new Uint8Array(256),n=new Uint8Array(256);for(e=0;e<256;e++)r[e]=e;for(e=0;e<256;e++){var o=r[e],i=Math.floor(Math.random()*256),a=r[i];r[e]=a,r[i]=o}for(e=0;e<256;e++)n[e]=r[e],n[e+256]=r[e];function s(t){return(t=(t=(t=t>>13^t)*(t*t*15731+789221)+1376312589)&2147483647)/1073741824-1}var h=[1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1],f=Math.sqrt(3),u=.5*(f-1),c=(3-f)/6;return{noise3D:function(t,e,r){var o,i,a,s,l,p,M,d,x,m,y,g=(t+e+r)/3,v=Math.floor(t+g),b=Math.floor(e+g),w=Math.floor(r+g),k=(v+b+w)*c,z=t-(v-k),A=e-(b-k),E=r-(w-k);z>=A?A>=E?(l=1,p=0,M=0,d=1,x=1,m=0):z>=E?(l=1,p=0,M=0,d=1,x=0,m=1):(l=0,p=0,M=1,d=1,x=0,m=1):A<E?(l=0,p=0,M=1,d=0,x=1,m=1):z<E?(l=0,p=1,M=0,d=0,x=1,m=1):(l=0,p=1,M=0,d=1,x=1,m=0);var I=z-l+c,N=A-p+c,P=E-M+c,j=z-d+2*c,q=A-x+2*c,F=E-m+2*c,O=z-1+3*c,R=A-1+3*c,S=E-1+3*c,U=255&v,V=255&b,W=255&w,X=.6-z*z-A*A-E*E;return X<0?o=0:o=(X*=X)*X*((h[y=3*n[U+n[V+n[W]]]]*z)+(h[y+1]*A)+(h[y+2]*E)),X=.6-I*I-N*N-P*P,X<0?i=0:i=(X*=X)*X*((h[y=3*n[U+l+n[V+p+n[W+M]]]]*I)+(h[y+1]*N)+(h[y+2]*P)),X=.6-j*j-q*q-F*F,X<0?a=0:a=(X*=X)*X*((h[y=3*n[U+d+n[V+x+n[W+m]]]]*j)+(h[y+1]*q)+(h[y+2]*F)),X=.6-O*O-R*R-S*S,X<0?s=0:s=(X*=X)*X*((h[y=3*n[U+1+n[V+1+n[W+1]]]]*O)+(h[y+1]*R)+(h[y+2]*S)),32*(o+i+a+s)}}}return t})();

// --- PIXEL SHADER ---
const PixelShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "resolution": { value: new THREE.Vector2() },
        "pixelSize": { value: 1.0 },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float pixelSize;
        varying vec2 vUv;
        void main() {
            vec2 dxy = pixelSize / resolution;
            vec2 coord = dxy * floor( vUv / dxy );
            gl_FragColor = texture2D( tDiffuse, coord );
        }
    `
};

export class ThreeBackground {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: 1080,
            height: 1920,
            accentColor: '#06b6d4',
            ...options
        };
        
        this.params = {
            sensitivity: 2.0,
            debrisCount: 50,
            baseBitcrush: 1.0
        };

        this.noise = new SimplexNoise();
        this.time = 0;
        this.clock = new THREE.Clock();
        
        // Physics State
        this.bassEnergy = 0;
        this.midEnergy = 0;
        this.highEnergy = 0;
        this.prevBass = 0;

        this.init();
    }

    init() {
        if (!this.container) return;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff); // White/Bright BG for heavy contrast
        this.scene.fog = new THREE.Fog(0xffffff, 20, 80);

        // Camera
        const aspect = this.options.width / this.options.height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 18);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(this.options.width, this.options.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(5, 10, 7);
        this.scene.add(mainLight);
        const backLight = new THREE.DirectionalLight(this.options.accentColor, 1.5); // Color Tint
        backLight.position.set(-5, 5, -10);
        this.scene.add(backLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));

        // --- MATERIALS ---
        // Chrome-like material
        this.material = new THREE.MeshPhysicalMaterial({ 
            color: 0x111111, 
            roughness: 0.15,
            metalness: 0.9,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            emissive: 0x000000
        });

        // 1. FLUID SPHERE
        const geo = new THREE.IcosahedronGeometry(5, 30); // High detail for noise
        this.originalPositions = geo.attributes.position.clone();
        this.sphere = new THREE.Mesh(geo, this.material);
        this.scene.add(this.sphere);

        // 2. DEBRIS SYSTEM
        this.createDebris(this.params.debrisCount);

        // --- POST PROCESSING ---
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        // Pixel Shader (Bitcrush)
        this.pixelPass = new ShaderPass(PixelShader);
        this.pixelPass.uniforms["resolution"].value = new THREE.Vector2(this.options.width, this.options.height);
        this.pixelPass.uniforms["pixelSize"].value = 1.0;
        this.composer.addPass(this.pixelPass);

        // Bloom
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.options.width, this.options.height), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = 0.8;
        this.bloomPass.strength = 0.4;
        this.bloomPass.radius = 0.4;
        this.composer.addPass(this.bloomPass);

        this.animate();
    }

    createDebris(count) {
        if(this.debris) this.scene.remove(this.debris);
        
        const geom = new THREE.IcosahedronGeometry(0.3, 0);
        this.debris = new THREE.InstancedMesh(geom, this.material, count);
        this.debrisData = [];
        const dummy = new THREE.Object3D();

        for(let i=0; i<count; i++) {
            const data = {
                x: (Math.random() - 0.5) * 30,
                y: (Math.random() - 0.5) * 30,
                z: (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 0.05,
                vy: (Math.random() - 0.5) * 0.05,
                scale: 0.5 + Math.random()
            };
            this.debrisData.push(data);
            dummy.position.set(data.x, data.y, data.z);
            dummy.scale.setScalar(data.scale);
            dummy.updateMatrix();
            this.debris.setMatrixAt(i, dummy.matrix);
        }
        this.scene.add(this.debris);
    }

    updateDebrisCount(val) {
        this.params.debrisCount = parseInt(val);
        this.createDebris(this.params.debrisCount);
    }

    updateColor(hex) {
        // Update backlight to match branding
        this.scene.children.forEach(c => {
            if(c.isDirectionalLight && c.position.z < 0) c.color.set(hex);
        });
    }

    updateAudio(data) {
        if(!data) return;
        
        // Freq Analysis
        let b = 0, m = 0, h = 0;
        for(let i=0; i<10; i++) b += data[i]; // Bass
        for(let i=10; i<50; i++) m += data[i]; // Mids
        for(let i=50; i<100; i++) h += data[i]; // Highs
        
        b = b / (10 * 255);
        m = m / (40 * 255);
        h = h / (50 * 255);

        // Apply Sensitivity
        const S = this.params.sensitivity;
        this.bassEnergy = THREE.MathUtils.lerp(this.bassEnergy, b * S, 0.2); // Smooth attach
        this.midEnergy = m * S;
        this.highEnergy = h * S;

        // Transient Detection for Bitcrush
        const delta = b - this.prevBass;
        if(delta > 0.1) {
            // Kick hit!
            this.pixelPass.uniforms["pixelSize"].value = this.params.baseBitcrush + (delta * 20.0);
            this.bloomPass.strength = 0.4 + (delta * 2.0);
        } else {
            // Decay
            this.pixelPass.uniforms["pixelSize"].value = THREE.MathUtils.lerp(this.pixelPass.uniforms["pixelSize"].value, this.params.baseBitcrush, 0.1);
            this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength, 0.4, 0.1);
        }
        this.prevBass = b;
    }

    updateGeometry() {
        if(!this.sphere) return;
        const pos = this.sphere.geometry.attributes.position;
        const count = pos.count;
        const orig = this.originalPositions;
        const time = this.time * 0.5;
        
        // Physics Props
        const dispAmp = 0.5 + (this.bassEnergy * 3.0); // Bass explodes the shape
        const freq = 1.0 + (this.midEnergy * 0.5);

        for(let i=0; i<count; i++) {
            const ox = orig.getX(i);
            const oy = orig.getY(i);
            const oz = orig.getZ(i);

            // Normalize
            const len = Math.sqrt(ox*ox + oy*oy + oz*oz);
            const nx = ox/len; const ny = oy/len; const nz = oz/len;

            // Noise
            const n = this.noise.noise3D(ox*freq + time, oy*freq, oz*freq + time);
            
            // Apply Displacement
            const d = 5 + (n * dispAmp);
            pos.setXYZ(i, nx*d, ny*d, nz*d);
        }
        pos.needsUpdate = true;
        this.sphere.geometry.computeVertexNormals();
    }

    updateDebris() {
        if(!this.debris) return;
        const dummy = new THREE.Object3D();
        const impact = 1 + (this.bassEnergy * 0.2); // Expand on bass

        for(let i=0; i<this.params.debrisCount; i++) {
            const d = this.debrisData[i];
            
            // Movement
            d.y += d.vy + (this.bassEnergy * 0.1); // Rise on bass
            d.x += d.vx;
            
            // Reset if out of bounds
            if(d.y > 15) d.y = -15;
            if(d.x > 20) d.x = -20;

            dummy.position.set(d.x * impact, d.y * impact, d.z * impact);
            dummy.scale.setScalar(d.scale * (1 + this.highEnergy)); // Pulse size on highs
            dummy.rotation.set(this.time + i, this.time + i, 0);
            dummy.updateMatrix();
            this.debris.setMatrixAt(i, dummy.matrix);
        }
        this.debris.instanceMatrix.needsUpdate = true;
    }

    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        if(this.camera && this.renderer) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.composer.setSize(width, height);
            this.pixelPass.uniforms["resolution"].value.set(width, height);
        }
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        const dt = this.clock.getDelta();
        this.time += dt;

        this.updateGeometry();
        this.updateDebris();

        // Rotate Main Sphere
        if(this.sphere) {
            this.sphere.rotation.y += 0.002 + (this.midEnergy * 0.01);
            this.sphere.rotation.z = Math.sin(this.time * 0.2) * 0.2;
        }

        this.composer.render();
    }
}
