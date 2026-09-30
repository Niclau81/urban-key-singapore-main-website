import { Box, Layers3, Maximize2, MousePointer2, Rotate3D } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type BuildingView = "tower" | "floor";

type FloorIdentity = { floor: number; unitLabel: string };
type Runtime = { applyView: (view: BuildingView) => void; fit: () => void };

const WHOLE_PROPERTY_TYPES = ["shophouse", "warehouse", "office building", "factory building", "landed", "bungalow", "detached", "semi-detached", "terrace house"];

export function getListingFloorIdentity({ propertyId, propertyType, transactionUnit, listingFloor, listingUnit }: {
  propertyId?: string;
  propertyType?: string;
  transactionUnit?: string;
  listingFloor?: number;
  listingUnit?: string;
}): FloorIdentity | null {
  const normalizedType = propertyType?.trim().toLowerCase() ?? "";
  if (WHOLE_PROPERTY_TYPES.some(type => normalizedType.includes(type))) return null;
  const parseUnit = (unit?: string) => unit?.match(/#\s*(\d{1,3})\s*-\s*(\d{1,4})/);
  const explicitUnit = parseUnit(listingUnit);
  if (Number.isInteger(listingFloor) && (listingFloor ?? 0) > 0) {
    return { floor: listingFloor!, unitLabel: explicitUnit && Number(explicitUnit[1]) === listingFloor ? `#${explicitUnit[1]}-${explicitUnit[2]}` : `Level ${listingFloor}` };
  }
  const unit = explicitUnit ?? parseUnit(transactionUnit);
  if (unit) return { floor: Number(unit[1]), unitLabel: `#${unit[1]}-${unit[2]}` };
  const fallback = propertyId?.trim().match(/-(\d{1,3})(?:-(\d{1,4}))?$/);
  if (!fallback) return null;
  const floor = Number(fallback[1]);
  return floor > 0 ? { floor, unitLabel: fallback[2] ? `#${fallback[1]}-${fallback[2]}` : `Level ${floor}` } : null;
}

export function BuildingViewer({ propertyId, propertyType, transactionUnit, listingFloor, listingUnit }: {
  propertyId?: string;
  propertyType?: string;
  transactionUnit?: string;
  listingFloor?: number;
  listingUnit?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const interactionRef = useRef(false);
  const [view, setView] = useState<BuildingView>("tower");
  const [interactive, setInteractive] = useState(false);
  const floorIdentity = useMemo(() => getListingFloorIdentity({ propertyId, propertyType, transactionUnit, listingFloor, listingUnit }), [propertyId, propertyType, transactionUnit, listingFloor, listingUnit]);

  const activate = () => {
    interactionRef.current = true;
    setInteractive(true);
    mountRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e6ece7");
    scene.fog = new THREE.Fog("#e6ece7", 22, 48);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const concrete = new THREE.MeshStandardMaterial({ color: "#d9d2c3", roughness: 0.7, metalness: 0.05 });
    const glass = new THREE.MeshStandardMaterial({ color: "#476c65", roughness: 0.18, metalness: 0.35 });
    const brass = new THREE.MeshStandardMaterial({ color: "#b68a4c", roughness: 0.42, metalness: 0.45 });
    const selectedFloor = new THREE.MeshStandardMaterial({ color: "#f2c66d", emissive: "#8a5e1e", emissiveIntensity: 0.75, roughness: 0.28, metalness: 0.35 });
    const floorBands: Array<{ object: THREE.Group; floor: number; tower: number }> = [];

    const makeTower = (x: number, z: number, floors: number, width: number, tower: number) => {
      const building = new THREE.Group();
      for (let floor = 0; floor < floors; floor += 1) {
        const floorNumber = floor + 1;
        const band = new THREE.Group();
        const highlighted = tower === 1 && floorIdentity?.floor === floorNumber;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.34, 2.15), highlighted ? selectedFloor : concrete);
        slab.position.y = floor * 0.42 + 0.55;
        slab.castShadow = true;
        slab.receiveShadow = true;
        const windowBand = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.18, 2.18), highlighted ? selectedFloor : glass);
        windowBand.position.y = floor * 0.42 + 0.63;
        const balcony = new THREE.Mesh(new THREE.BoxGeometry(width + 0.25, 0.045, 2.42), brass);
        balcony.position.y = floor * 0.42 + 0.78;
        band.add(slab, windowBand, balcony);
        building.add(band);
        floorBands.push({ object: band, floor: floorNumber, tower });
      }
      building.position.set(x, 0, z);
      return building;
    };

    group.add(makeTower(-1.7, 0, 22, 2.4, 0), makeTower(1.45, -0.8, 32, 2.1, 1), makeTower(0.2, 2.3, 16, 2.8, 2));
    const podium = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.6, 6), concrete);
    podium.position.y = 0.2;
    podium.castShadow = true;
    group.add(podium);
    const pool = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 1.3), new THREE.MeshStandardMaterial({ color: "#5a9d9b", roughness: 0.15, metalness: 0.2 }));
    pool.position.set(-0.2, 0.55, 0.1);
    group.add(pool);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(15, 64), new THREE.MeshStandardMaterial({ color: "#c7d2c6", roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground, new THREE.HemisphereLight("#fff8e7", "#47635b", 2.2));
    const sun = new THREE.DirectionalLight("#fff0d1", 3.2);
    sun.position.set(8, 12, 5);
    sun.castShadow = true;
    scene.add(sun);

    const target = new THREE.Vector3();
    const frameCenter = new THREE.Vector3();
    let currentView: BuildingView = "tower";
    let zoomBounds = { min: 4, max: 22 };
    let maxPanDistance = 3;
    const resize = () => {
      camera.aspect = Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1), false);
    };
    const frame = () => {
      group.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(group);
      const size = bounds.getSize(new THREE.Vector3());
      bounds.getCenter(frameCenter);
      target.copy(frameCenter);
      // MOBILE MODEL FIT: a phone viewport is short and near-square, so use a wider lens
      // and extra headroom. This prevents tall towers from being cropped on first render.
      const compact = mount.clientWidth <= 620;
      camera.fov = compact ? (currentView === "floor" ? 52 : 48) : 38;
      const config = currentView === "floor"
        ? { scaleY: 0.23, direction: [0.82, 1.28, 1] as const, padding: compact ? 1.72 : 1.38, pan: compact ? 0.36 : 0.42 }
        : { scaleY: 1, direction: [0.9, 0.68, 1] as const, padding: compact ? 1.72 : 1.28, pan: compact ? 0.4 : 0.48 };
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const distance = Math.max(size.y / (2 * Math.tan(fov / 2)), size.x / (2 * Math.tan(fov / 2) * camera.aspect), size.z) * config.padding;
      camera.position.copy(target).add(new THREE.Vector3(...config.direction).normalize().multiplyScalar(distance));
      camera.near = Math.max(distance / 100, 0.05);
      camera.far = Math.max(distance * 12, 80);
      camera.updateProjectionMatrix();
      camera.lookAt(target);
      zoomBounds = { min: distance * 0.55, max: distance * 1.9 };
      maxPanDistance = Math.max(size.x, size.y, size.z) * config.pan;
    };
    const applyView = (next: BuildingView) => {
      currentView = next;
      const isolate = next === "floor" && Boolean(floorIdentity);
      floorBands.forEach(({ object, floor, tower }) => { object.visible = !isolate || (tower === 1 && floor === floorIdentity?.floor); });
      group.scale.set(1, isolate ? 1 : (next === "floor" ? 0.23 : 1), 1);
      group.position.set(0, 0, 0);
      resize();
      frame();
    };
    const fit = () => {
      // Restore the calculated bounds after a mobile zoom or pan gesture.
      group.position.set(0, 0, 0);
      resize();
      frame();
    };
    runtimeRef.current = { applyView, fit };
    applyView("tower");

    let dragging = false;
    let mode: "pan" | "orbit" = "orbit";
    let previous = { x: 0, y: 0 };
    const onDown = (event: PointerEvent) => {
      if (!interactionRef.current) return;
      dragging = true;
      mode = event.shiftKey || event.altKey || event.button === 1 || event.button === 2 ? "pan" : "orbit";
      previous = { x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging || !interactionRef.current) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      if (mode === "orbit") {
        const offset = camera.position.clone().sub(target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta -= (dx / Math.max(renderer.domElement.clientWidth, 1)) * Math.PI * 1.7;
        spherical.phi = THREE.MathUtils.clamp(spherical.phi - (dy / Math.max(renderer.domElement.clientHeight, 1)) * Math.PI * 1.2, 0.12, Math.PI - 0.12);
        camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));
        camera.lookAt(target);
      } else {
        const visibleHeight = 2 * camera.position.distanceTo(target) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
        const worldPerPixel = visibleHeight / Math.max(renderer.domElement.clientHeight, 1);
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(-dx * worldPerPixel);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(dy * worldPerPixel);
        const candidate = target.clone().add(right).add(up);
        const offset = candidate.clone().sub(frameCenter);
        if (offset.length() > maxPanDistance) offset.setLength(maxPanDistance);
        const bounded = frameCenter.clone().add(offset);
        const applied = bounded.clone().sub(target);
        camera.position.add(applied);
        target.copy(bounded);
        camera.lookAt(target);
      }
      previous = { x: event.clientX, y: event.clientY };
    };
    const onUp = () => { dragging = false; };
    const onWheel = (event: WheelEvent) => {
      if (!interactionRef.current) return;
      event.preventDefault();
      const distance = THREE.MathUtils.clamp(camera.position.distanceTo(target) + event.deltaY * 0.012, zoomBounds.min, zoomBounds.max);
      camera.position.copy(target).add(camera.position.clone().sub(target).normalize().multiplyScalar(distance));
      camera.lookAt(target);
    };
    const onContext = (event: MouseEvent) => { if (interactionRef.current) event.preventDefault(); };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("contextmenu", onContext);
    mount.addEventListener("wheel", onWheel, { passive: false });
    const observer = new ResizeObserver(() => { resize(); frame(); });
    observer.observe(mount);
    let animation = 0;
    const render = () => { animation = requestAnimationFrame(render); renderer.render(scene, camera); };
    render();
    return () => {
      cancelAnimationFrame(animation);
      observer.disconnect();
      mount.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("contextmenu", onContext);
      runtimeRef.current = null;
      renderer.dispose();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [floorIdentity?.floor]);

  useEffect(() => { runtimeRef.current?.applyView(view); }, [view]);

  return <section className="building-viewer" aria-label="Interactive conceptual building model">
    <div
      ref={mountRef}
      role="application"
      tabIndex={0}
      className={`building-canvas ${interactive ? "interactive" : ""}`}
      data-model-interactive={interactive ? "true" : "false"}
      onPointerDownCapture={activate}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
        if (event.key === "Escape") { interactionRef.current = false; setInteractive(false); }
      }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { interactionRef.current = false; setInteractive(false); } }}
      aria-label={`Interactive conceptual 3D ${view === "tower" ? "building" : "floor plate"} model. ${interactive ? "Controls active; drag to orbit, Shift-drag or right-drag to pan, use the mouse wheel to zoom, and press Escape to release." : "Click or press Enter to activate model controls."}`}
    />
    <div className="building-view-switch" role="group" aria-label="Building model view">
      <button type="button" className={view === "tower" ? "selected" : ""} onClick={() => setView("tower")}><Box size={16} />Building</button>
      <button type="button" className={view === "floor" ? "selected" : ""} onClick={() => setView("floor")}><Layers3 size={16} />Floor plate</button>
      <button type="button" onClick={() => runtimeRef.current?.fit()}><Maximize2 size={16} />Fit model</button>
    </div>
    <p className="building-model-hint">{interactive ? <><Rotate3D size={16} />Drag to orbit · Shift/right-drag to pan · Scroll to zoom · Esc to release</> : <><MousePointer2 size={16} />Click the model to enable orbit, pan and zoom</>}</p>
    {floorIdentity && <div className="building-floor-identity"><p>Listed unit floor</p><b>{floorIdentity.unitLabel} · Level {floorIdentity.floor}</b><span>Gold level highlighted</span></div>}
  </section>;
}
