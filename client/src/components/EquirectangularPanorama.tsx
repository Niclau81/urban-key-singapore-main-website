import { MoveHorizontal, Rotate3D, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type PanoramaHotspot = {
  id: string;
  label: string;
  /** Horizontal and vertical placement expressed as a percentage of the panorama's virtual view. */
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
  className?: string;
};

type ProjectedHotspot = PanoramaHotspot & { left: number; top: number; visible: boolean };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Original equirectangular panorama control. Verified 2:1 captures render as a photo sphere;
 * illustrative media may use the same renderer but are always labelled by the parent as synthetic.
 */
export function EquirectangularPanorama({ src, alt, hotspots, onSelectHotspot, timeOfDay = "noon", className = "" }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<{ adjustYaw: (amount: number) => void; adjustPitch: (amount: number) => void; adjustFov: (amount: number) => void } | null>(null);
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
    let frame = 0;
    let disposed = false;
    let dragging = false;
    let previous = { x: 0, y: 0 };
    let yaw = 0;
    let pitch = 0;
    let fov = 70;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = "h-full w-full cursor-grab touch-none active:cursor-grabbing";
      mount.replaceChildren(renderer.domElement);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 110);
      const geometry = new THREE.SphereGeometry(50, 64, 40);
      geometry.scale(-1, 1, 1);

      const renderScene = () => {
        const activeRenderer = renderer;
        const activeScene = scene;
        const activeCamera = camera;
        if (!activeRenderer || !activeScene || !activeCamera || disposed) return;
        const phi = THREE.MathUtils.degToRad(90 - pitch);
        const theta = THREE.MathUtils.degToRad(yaw);
        const target = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
        activeCamera.fov = fov;
        activeCamera.updateProjectionMatrix();
        activeCamera.lookAt(target);
        activeRenderer.render(activeScene, activeCamera);
        setCameraState({ yaw: Number(yaw.toFixed(2)), pitch: Number(pitch.toFixed(2)), fov: Number(fov.toFixed(2)) });

        const projected = hotspots.map(hotspot => {
          const hotspotYaw = hotspot.x / 100 * 360 - 180;
          const hotspotPitch = (50 - hotspot.y) * 1.3;
          const vector = new THREE.Vector3().setFromSphericalCoords(45, THREE.MathUtils.degToRad(90 - hotspotPitch), THREE.MathUtils.degToRad(hotspotYaw));
          vector.project(activeCamera);
          const visible = vector.z < 1 && vector.x >= -1.12 && vector.x <= 1.12 && vector.y >= -1.12 && vector.y <= 1.12;
          return { ...hotspot, left: (vector.x + 1) * 50, top: (-vector.y + 1) * 50, visible };
        });
        setProjectedHotspots(projected);
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
        if (disposed || !scene) return;
        texture = loadedTexture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        scene.add(new THREE.Mesh(geometry, material));
        resize();
      }, undefined, () => {
        if (!disposed) setRendererFailed(true);
      });

      const resizeObserver = new ResizeObserver(resize);
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
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        renderer?.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer?.domElement.removeEventListener("pointermove", onPointerMove);
        renderer?.domElement.removeEventListener("pointerup", onPointerUp);
        renderer?.domElement.removeEventListener("pointercancel", onPointerUp);
        renderer?.domElement.removeEventListener("wheel", onWheel);
        texture?.dispose();
        geometry.dispose();
        renderer?.dispose();
        if (renderer && mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        controlsRef.current = null;
      };
    } catch {
      setRendererFailed(true);
      return undefined;
    }
  }, [hotspots, src]);

  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!controlsRef.current) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); controlsRef.current.adjustYaw(9); }
    if (event.key === "ArrowRight") { event.preventDefault(); controlsRef.current.adjustYaw(-9); }
    if (event.key === "ArrowUp") { event.preventDefault(); controlsRef.current.adjustPitch(7); }
    if (event.key === "ArrowDown") { event.preventDefault(); controlsRef.current.adjustPitch(-7); }
    if (event.key === "+" || event.key === "=") { event.preventDefault(); controlsRef.current.adjustFov(-6); }
    if (event.key === "-") { event.preventDefault(); controlsRef.current.adjustFov(6); }
  };

  const timeFilter = timeOfDay === "morning" ? "sepia-[.16] saturate-110 brightness-105" : timeOfDay === "night" ? "brightness-[.56] saturate-125 hue-rotate-[8deg]" : "brightness-100";
  return <div className={`relative h-full w-full overflow-hidden bg-[#0d1110] ${className}`} tabIndex={0} onKeyDown={keyDown} aria-label="Interactive panorama. Drag to look around, use arrow keys to move the camera, and select a blue node to jump rooms." data-equirectangular-panorama data-panorama-yaw={cameraState.yaw} data-panorama-pitch={cameraState.pitch} data-panorama-fov={cameraState.fov} data-panorama-time={timeOfDay}>
    <div ref={mountRef} className={`absolute inset-0 transition-[filter] duration-300 ${timeFilter}`} />
    {rendererFailed && <><img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" /><p className="absolute inset-x-4 bottom-20 rounded-lg bg-black/75 px-3 py-2 text-xs text-white">Panorama rendering is unavailable in this browser. Showing the approved flat preview instead.</p></>}
    {projectedHotspots.filter(hotspot => hotspot.visible).map(hotspot => <button key={hotspot.id} type="button" onPointerDown={event => event.stopPropagation()} onClick={event => { event.preventDefault(); event.stopPropagation(); onSelectHotspot(hotspot.id); }} style={{ left: `${hotspot.left}%`, top: `${hotspot.top}%` }} aria-label={`Move ${hotspot.direction ?? "forward"} to ${hotspot.label}`} className="pointer-events-auto absolute z-50 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-white/80 bg-[#087ff5] px-2 py-1.5 text-[10px] font-bold text-white shadow-[0_6px_20px_rgba(0,0,0,.45)] transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/60 motion-reduce:transform-none motion-reduce:transition-none" data-panorama-room-arrow={hotspot.id}><MoveHorizontal className="size-3" />{hotspot.direction === "left" ? "←" : hotspot.direction === "right" ? "→" : hotspot.direction === "up" ? "↑" : hotspot.direction === "down" ? "↓" : "→"} {hotspot.label}</button>)}
    <div className="absolute right-4 top-20 z-20 flex flex-col overflow-hidden rounded-xl border border-white/20 bg-[#17171e]/85 shadow-lg backdrop-blur">
      <button type="button" aria-label="Zoom in panorama" onClick={() => controlsRef.current?.adjustFov(-8)} className="flex size-10 items-center justify-center text-white hover:bg-white/15"><ZoomIn className="size-4" /></button>
      <button type="button" aria-label="Zoom out panorama" onClick={() => controlsRef.current?.adjustFov(8)} className="flex size-10 items-center justify-center border-t border-white/15 text-white hover:bg-white/15"><ZoomOut className="size-4" /></button>
    </div>
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-[#17171e]/85 px-3 py-2 text-[10px] font-semibold text-white/85 shadow-lg backdrop-blur"><Rotate3D className="size-3.5 text-[#5aa8ff]" />Drag, swipe, or use arrow keys to look around</div>
  </div>;
}
