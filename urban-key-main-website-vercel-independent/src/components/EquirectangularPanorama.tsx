import { MoveHorizontal, Rotate3D, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import * as THREE from "three";

export type PanoramaHotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  direction?: "left" | "right" | "up" | "down";
};

type Props = {
  src: string;
  alt: string;
  hotspots: PanoramaHotspot[];
  onSelectHotspot: (id: string) => void;
  timeOfDay?: "morning" | "noon" | "night";
};

type ProjectedHotspot = PanoramaHotspot & { left: number; top: number; visible: boolean };

type CameraControls = {
  adjustYaw: (amount: number) => void;
  adjustPitch: (amount: number) => void;
  adjustFov: (amount: number) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Local photo-sphere renderer for approved illustrative panorama media. It never
 * labels illustrative media as a real 360° property capture, and keeps a visible
 * flat-preview fallback if WebGL is unavailable.
 */
export function EquirectangularPanorama({ src, alt, hotspots, onSelectHotspot, timeOfDay = "noon" }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<CameraControls | null>(null);
  const [projectedHotspots, setProjectedHotspots] = useState<ProjectedHotspot[]>([]);
  const [rendererFailed, setRendererFailed] = useState(false);
  const [cameraState, setCameraState] = useState({ yaw: 0, pitch: 0, fov: 70 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let texture: THREE.Texture | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let geometry: THREE.SphereGeometry | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let disposed = false;
    let dragging = false;
    let previous = { x: 0, y: 0 };
    let yaw = 0;
    let pitch = 0;
    let fov = 70;

    try {
      setRendererFailed(false);
      setProjectedHotspots([]);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = "panorama-canvas";
      renderer.domElement.setAttribute("aria-label", "Interactive panorama canvas");
      mount.replaceChildren(renderer.domElement);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 110);
      geometry = new THREE.SphereGeometry(50, 64, 40);
      geometry.scale(-1, 1, 1);

      const renderScene = () => {
        const activeRenderer = renderer;
        const activeScene = scene;
        const activeCamera = camera;
        if (!activeRenderer || !activeScene || !activeCamera || disposed) return;
        const phi = THREE.MathUtils.degToRad(90 - pitch);
        const theta = THREE.MathUtils.degToRad(yaw);
        activeCamera.fov = fov;
        activeCamera.updateProjectionMatrix();
        activeCamera.lookAt(new THREE.Vector3().setFromSphericalCoords(1, phi, theta));
        activeRenderer.render(activeScene, activeCamera);
        setCameraState({ yaw: Number(yaw.toFixed(2)), pitch: Number(pitch.toFixed(2)), fov: Number(fov.toFixed(2)) });

        setProjectedHotspots(hotspots.map(hotspot => {
          const hotspotYaw = hotspot.x / 100 * 360 - 180;
          const hotspotPitch = (50 - hotspot.y) * 1.3;
          const vector = new THREE.Vector3().setFromSphericalCoords(45, THREE.MathUtils.degToRad(90 - hotspotPitch), THREE.MathUtils.degToRad(hotspotYaw));
          vector.project(activeCamera);
          return {
            ...hotspot,
            left: (vector.x + 1) * 50,
            top: (-vector.y + 1) * 50,
            visible: vector.z < 1 && vector.x >= -1.12 && vector.x <= 1.12 && vector.y >= -1.12 && vector.y <= 1.12,
          };
        }));
      };

      const resize = () => {
        if (!renderer || !camera) return;
        const width = Math.max(mount.clientWidth, 1);
        const height = Math.max(mount.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        renderScene();
      };

      const loader = new THREE.TextureLoader();
      loader.load(src, loadedTexture => {
        if (disposed || !scene || !geometry) return;
        texture = loadedTexture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        scene.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture })));
        resize();
      }, undefined, () => {
        if (!disposed) setRendererFailed(true);
      });

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      const onPointerDown = (event: PointerEvent) => {
        dragging = true;
        previous = { x: event.clientX, y: event.clientY };
        renderer?.domElement.setPointerCapture?.(event.pointerId);
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!dragging) return;
        yaw -= (event.clientX - previous.x) * 0.16;
        pitch = clamp(pitch + (event.clientY - previous.y) * 0.13, -75, 75);
        previous = { x: event.clientX, y: event.clientY };
        renderScene();
      };
      const onPointerUp = () => { dragging = false; };
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        fov = clamp(fov + event.deltaY * 0.035, 35, 95);
        renderScene();
      };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      renderer.domElement.addEventListener("pointercancel", onPointerUp);
      renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
      controlsRef.current = {
        adjustYaw: amount => { yaw += amount; renderScene(); },
        adjustPitch: amount => { pitch = clamp(pitch + amount, -75, 75); renderScene(); },
        adjustFov: amount => { fov = clamp(fov + amount, 35, 95); renderScene(); },
      };

      return () => {
        disposed = true;
        resizeObserver?.disconnect();
        renderer?.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer?.domElement.removeEventListener("pointermove", onPointerMove);
        renderer?.domElement.removeEventListener("pointerup", onPointerUp);
        renderer?.domElement.removeEventListener("pointercancel", onPointerUp);
        renderer?.domElement.removeEventListener("wheel", onWheel);
        texture?.dispose();
        geometry?.dispose();
        renderer?.dispose();
        if (renderer && mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        controlsRef.current = null;
      };
    } catch {
      setRendererFailed(true);
      return undefined;
    }
  }, [hotspots, src]);

  const keyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!controlsRef.current) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); controlsRef.current.adjustYaw(9); }
    if (event.key === "ArrowRight") { event.preventDefault(); controlsRef.current.adjustYaw(-9); }
    if (event.key === "ArrowUp") { event.preventDefault(); controlsRef.current.adjustPitch(7); }
    if (event.key === "ArrowDown") { event.preventDefault(); controlsRef.current.adjustPitch(-7); }
    if (event.key === "+" || event.key === "=") { event.preventDefault(); controlsRef.current.adjustFov(-6); }
    if (event.key === "-") { event.preventDefault(); controlsRef.current.adjustFov(6); }
  };

  return <div className="equirectangular-panorama" tabIndex={0} onKeyDown={keyDown} aria-label="Interactive panorama. Drag to look around, use arrow keys to move the camera, and choose a blue node to move between rooms." data-equirectangular-panorama data-panorama-yaw={cameraState.yaw} data-panorama-pitch={cameraState.pitch} data-panorama-fov={cameraState.fov} data-panorama-time={timeOfDay}>
    <div ref={mountRef} className={`panorama-mount panorama-${timeOfDay}`} />
    {rendererFailed && <><img src={src} alt={alt} className="panorama-flat-fallback" /><p className="panorama-fallback-notice">Panorama rendering is unavailable in this browser. Showing the approved flat preview instead.</p></>}
    {projectedHotspots.filter(hotspot => hotspot.visible).map(hotspot => <button key={hotspot.id} type="button" onPointerDown={event => event.stopPropagation()} onClick={event => { event.preventDefault(); event.stopPropagation(); onSelectHotspot(hotspot.id); }} style={{ left: `${hotspot.left}%`, top: `${hotspot.top}%` }} aria-label={`Move ${hotspot.direction ?? "forward"} to ${hotspot.label}`} className="panorama-room-arrow" data-panorama-room-arrow={hotspot.id}><MoveHorizontal size={14} />{hotspot.direction === "left" ? "←" : hotspot.direction === "right" ? "→" : hotspot.direction === "up" ? "↑" : hotspot.direction === "down" ? "↓" : "→"} {hotspot.label}</button>)}
    <div className="panorama-zoom-controls"><button type="button" aria-label="Zoom in panorama" onClick={() => controlsRef.current?.adjustFov(-8)}><ZoomIn size={16} /></button><button type="button" aria-label="Zoom out panorama" onClick={() => controlsRef.current?.adjustFov(8)}><ZoomOut size={16} /></button></div>
    <div className="panorama-drag-hint"><Rotate3D size={15} />Drag, swipe, or use arrow keys to look around</div>
  </div>;
}
