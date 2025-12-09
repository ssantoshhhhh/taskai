import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { useEffect, useRef } from 'react';

function debounce(func: any, wait: number) {
  let timeout: any;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeout);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: any) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach(key => {
    if (key !== 'constructor' && typeof instance[key] === 'function') {
      instance[key] = instance[key].bind(instance);
    }
  });
}

// Helper to wrap text
function wrapText(context: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  // eslint-disable-next-line no-var
  var currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, currentY);
  return currentY + lineHeight;
}

function createTaskTexture(gl: any, item: any) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return { texture: new Texture(gl), width: 0, height: 0 };

  const width = 600;
  const height = 800; // Portrait aspect ratio for task cards
  canvas.width = width;
  canvas.height = height;

  // Background
  const statusColors: Record<string, string> = {
    'todo': '#1f2937', // gray-800
    'in-progress': '#10b981', // emerald-500 (darker opacity in logic maybe?) - let's use dark bg with colored accent
    'done': '#064e3b' // emerald-900
  };

  // Card Background
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1a1a1a'); // Dark gray top
  gradient.addColorStop(1, '#0f0f0f'); // Blackish bottom
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // Border / Accent based on status
  const accentColor = item.status === 'in-progress' ? '#eab308' : item.status === 'done' ? '#22c55e' : '#6b7280';
  context.lineWidth = 10;
  context.strokeStyle = accentColor;
  context.strokeRect(0, 0, width, height);

  // Padding
  const pad = 40;
  let cursorY = pad + 40;

  // Title
  context.fillStyle = '#ffffff';
  context.font = 'bold 48px Inter, sans-serif'; // Larger font
  context.textAlign = 'left';
  context.textBaseline = 'top';
  cursorY = wrapText(context, item.text || 'Untitled Task', pad, cursorY, width - (pad * 2), 60);

  // Divider
  cursorY += 20;
  context.beginPath();
  context.moveTo(pad, cursorY);
  context.lineTo(width - pad, cursorY);
  context.lineWidth = 2;
  context.strokeStyle = '#333';
  context.stroke();
  cursorY += 40;

  // Description
  context.fillStyle = '#d1d5db'; // gray-300
  context.font = '32px Inter, sans-serif';
  if (item.description) {
    cursorY = wrapText(context, item.description, pad, cursorY, width - (pad * 2), 40);
  } else {
    context.fillStyle = '#6b7280';
    context.fillText("No description provided.", pad, cursorY);
    cursorY += 40;
  }

  // Push to bottom for badges
  const bottomAreaY = height - 150;

  // Status Badge
  context.fillStyle = accentColor;
  context.roundRect(pad, bottomAreaY, 200, 60, 30);
  context.fill();

  context.fillStyle = '#000000';
  context.font = 'bold 24px Inter, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText((item.status || 'TODO').toUpperCase(), pad + 100, bottomAreaY + 30);

  // Priority Badge
  const priorityColor = item.priority === 'high' ? '#ef4444' : item.priority === 'medium' ? '#f59e0b' : '#3b82f6';
  context.fillStyle = '#374151'; // Dark gray bg for secondary badge
  context.fillStyle = priorityColor;

  context.roundRect(pad + 220, bottomAreaY, 180, 60, 30);
  context.fill();

  context.fillStyle = '#ffffff';
  context.fillText((item.priority || 'MEDIUM').toUpperCase(), pad + 220 + 90, bottomAreaY + 30);

  // Date if exists
  if (item.due_date) {
    context.fillStyle = '#9ca3af';
    context.font = '24px Inter, sans-serif';
    context.textAlign = 'right';
    context.fillText(new Date(item.due_date).toLocaleDateString(), width - pad, bottomAreaY + 30);
  }

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class CardItem {
  gl: any;
  plane: any;
  renderer: any;
  item: any;
  textColor: string;
  font: string;
  mesh: any;

  constructor({ gl, plane, renderer, item, textColor = '#545050', font = '30px sans-serif' }: any) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.item = item;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }
  createMesh() {
    const { texture, width, height } = createTaskTexture(this.gl, this.item);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
      cullFace: false, // Show back of card if needed, or keep standard
    });
    this.mesh = new Mesh(this.gl, { geometry, program });

    // Scale the mesh to fit the plane but maintain aspect ratio of canvas
    // Canvas is 600x800 (0.75 aspect)
    // We want this card to effectively BE the visual representation

    // In the original code, 'Title' was a small text float below the image.
    // Here, we want this Texture to REPLACE the main image or OVERLAY it completely?
    // User wants "Full task details... shown". 
    // Best approach: Use this texture as the MAIN visual for the plane, not a sub-mesh.
    // BUT, the 'Media' class creates a 'plane' with a shader that does bending.
    // We should probably apply this texture to that MAIN plane instead of creating a child mesh.

    // HOWEVER, to minimize refactor risk of the shader logic in Media class:
    // Let's make this mesh cover the parent plane completely.

    this.mesh.scale.set(this.plane.scale.x, this.plane.scale.y, 1);
    this.mesh.position.z = 0.01; // Slightly in front to avoid z-fighting if parent has content
    this.mesh.setParent(this.plane);
  }
}

class Media {
  extra: number;
  geometry: any;
  gl: any;
  image: string;
  index: number;
  length: number;
  renderer: any;
  scene: any;
  screen: any;
  text: string;
  viewport: any;
  bend: number;
  textColor: string;
  borderRadius: number;
  font: string;
  program: any;
  plane: any;
  title: any;
  isBefore: boolean = false;
  isAfter: boolean = false;
  speed: number = 0;
  width: number = 0;
  widthTotal: number = 0;
  x: number = 0;
  scale: number = 1;
  padding: number = 2;

  item: any;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0,
    font,
    item // Passed from createMedias
  }: any) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.item = item; // Store full item data
    this.createShader();
    this.createMesh();
    this.createCard();
    this.onResize();
  }
  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          
          // Smooth antialiasing for edges
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          // Make base plane transparent so our CardItem mesh is sole visual?
          // Or keep it as background. Let's make it fully transparent or dark.
          // Since we are overlaying the CardItem, we can reduce its visibility or make it black.
          // For now, let's keep it as is, it acts as a backdrop.
          
          gl_FragColor = vec4(color.rgb * 0.1, alpha); // Dim the background image significantly
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }
  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }
  createCard() {
    this.title = new CardItem({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      item: this.item, // Pass full item
      textColor: this.textColor,
      font: this.font
    });
  }
  update(scroll: any, direction: string) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }
  onResize({ screen, viewport }: any = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  container: any;
  scrollSpeed: number;
  scroll: any;
  onCheckDebounce: any;
  renderer: any;
  gl: any;
  camera: any;
  scene: any;
  planeGeometry: any;
  mediasImages: any[] = [];
  medias: any[] = [];
  isDown: boolean = false;
  start: number = 0;
  clickStart: number = 0;
  raf: any;
  screen: any;
  viewport: any;
  boundOnResize: any;
  boundOnWheel: any;
  boundOnTouchDown: any;
  boundOnTouchMove: any;
  boundOnTouchUp: any;

  onItemClick: ((index: number) => void) | undefined;

  constructor(
    container: any,
    {
      items,
      bend,
      textColor = '#ffffff',
      borderRadius = 0,
      font = 'bold 30px Figtree',
      scrollSpeed = 2,
      scrollEase = 0.05,
      onItemClick
    }: any = {}
  ) {
    document.documentElement.classList.remove('no-js');
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.onItemClick = onItemClick;
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
  }
  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }
  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }
  createScene() {
    this.scene = new Transform();
  }
  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100
    });
  }
  createMedias(items: any[], bend = 1, textColor: string, borderRadius: number, font: string) {
    const defaultItems = [
      { image: `https://picsum.photos/seed/1/800/600?grayscale`, text: 'Bridge', status: 'todo', priority: 'low' },
      { image: `https://picsum.photos/seed/2/800/600?grayscale`, text: 'Desk Setup', status: 'in-progress', priority: 'medium' },
      { image: `https://picsum.photos/seed/3/800/600?grayscale`, text: 'Waterfall', status: 'done', priority: 'high' }
    ];
    const galleryItems = items && items.length ? items : defaultItems;
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font,
        item: data // Pass the full data object
      });
    });
  }
  onTouchDown(e: any) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
    this.clickStart = this.start;
  }
  onTouchMove(e: any) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }
  onTouchUp(e: any) {
    this.isDown = false;
    this.onCheck();

    // Simple click detection (if moved less than 5px)
    const end = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    if (Math.abs(this.clickStart - end) < 5) {
      this.handleItemClick(end);
    }
  }
  handleItemClick(x: number) {
    if (!this.onItemClick) return;
    if (this.medias && this.medias[0]) {
      const width = this.medias[0].width;
      const currentIndex = Math.round(this.scroll.target / width);
      const realLength = this.mediasImages.length / 2;

      let normalizedIndex = currentIndex % realLength;
      if (normalizedIndex < 0) normalizedIndex += realLength;

      this.onItemClick(normalizedIndex);
    }
  }

  onWheel(e: any) {
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }
  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }
  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }
  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('mousewheel', this.boundOnWheel);
    window.addEventListener('wheel', this.boundOnWheel);
    window.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    window.addEventListener('touchstart', this.boundOnTouchDown);
    window.addEventListener('touchmove', this.boundOnTouchMove);
    window.addEventListener('touchend', this.boundOnTouchUp);
  }
  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    window.removeEventListener('mousewheel', this.boundOnWheel);
    window.removeEventListener('wheel', this.boundOnWheel);
    window.removeEventListener('mousedown', this.boundOnTouchDown);
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    window.removeEventListener('touchstart', this.boundOnTouchDown);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchUp);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

interface CircularGalleryProps {
  items?: { image: string; text: string }[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  onItemClick?: (index: number) => void;
}

export default function CircularGallery({
  items,
  bend = 3,
  textColor = '#ffffff',
  borderRadius = 0.05,
  font = 'bold 30px Figtree',
  scrollSpeed = 2,
  scrollEase = 0.05,
  onItemClick
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const app = new App(containerRef.current, { items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase, onItemClick });
    return () => {
      app.destroy();
    };
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase, onItemClick]);
  return <div className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing" ref={containerRef} />;
}
