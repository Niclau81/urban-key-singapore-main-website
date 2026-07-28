import { Box, Layers3, MousePointer2, Rotate3D } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  getBoundedModelPanOffset,
  getListingFloorIdentity,
  getModelInteractionAfterBlur,
  getModelInteractionAfterKey,
  getModelOrbitDelta,
  getModelPanDelta,
  getNextModelZoomDistance,
  IMMERSIVE_MODEL_VIEW_CONFIG,
  type ImmersiveModelView,
} from "@/lib/immersiveModel";

type ViewerRuntime = {
  applyView: (view: ImmersiveModelView) => void;
};

export function BuildingViewer({
  propertyId,
  propertyType,
  transactionUnit,
  listingFloor,
  listingUnit,
}: {
  propertyId?: string | null;
  propertyType?: string | null;
  transactionUnit?: string | null;
  listingFloor?: number | null;
  listingUnit?: string | null;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef(false);
  const runtimeRef = useRef<ViewerRuntime | null>(null);
  const [view, setView] = useState<ImmersiveModelView>("tower");
  const [interactive, setInteractive] = useState(false);
  const floorIdentity = getListingFloorIdentity({ propertyId, propertyType, transactionUnit, listingFloor, listingUnit });

  const setInteraction = (next: boolean) => {
    interactionRef.current = next;
    setInteractive(next);
    if (next) mountRef.current?.focus({ preventScroll: true });
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
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const concrete = new THREE.MeshStandardMaterial({ color: "#d9d2c3", roughness: 0.7, metalness: 0.05 });
    const glass = new THREE.MeshStandardMaterial({ color: "#476c65", roughness: 0.18, metalness: 0.35 });
    const brass = new THREE.MeshStandardMaterial({ color: "#b68a4c", roughness: 0.42, metalness: 0.45 });
    const selectedFloor = new THREE.MeshStandardMaterial({ color: "#f2c66d", emissive: "#8a5e1e", emissiveIntensity: 0.75, roughness: 0.28, metalness: 0.35 });
    const floorBands: Array<{ object: THREE.Group; floor: number; tower: number }> = [];

    const makeTower = (x: number, z: number, floors: number, width: number, towerIndex: number) => {
      const floorHeight = 0.42;
      const tower = new THREE.Group();
      for (let floor = 0; floor < floors; floor += 1) {
        const floorNumber = floor + 1;
        const band = new THREE.Group();
        const isListedFloor = towerIndex === 1 && floorIdentity?.floor === floorNumber;
        const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.34, 2.15), isListedFloor ? selectedFloor : concrete);
        slab.position.y = floor * floorHeight + 0.55;
        slab.castShadow = true;
        slab.receiveShadow = true;
        band.add(slab);

        const windowBand = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.18, 2.18), isListedFloor ? selectedFloor : glass);
        windowBand.position.y = floor * floorHeight + 0.63;
        band.add(windowBand);

        const balcony = new THREE.Mesh(new THREE.BoxGeometry(width + 0.25, 0.045, 2.42), brass);
        balcony.position.set(0, floor * floorHeight + 0.78, 0);
        band.add(balcony);
        floorBands.push({ object: band, floor: floorNumber, tower: towerIndex });
        tower.add(band);
      }
      tower.position.set(x, 0, z);
      return tower;
    };

    group.add(makeTower(-1.7, 0, 22, 2.4, 0));
    group.add(makeTower(1.45, -0.8, 32, 2.1, 1));
    group.add(makeTower(0.2, 2.3, 16, 2.8, 2));

    const podium = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.6, 6), concrete);
    podium.position.y = 0.2;
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);

    const pool = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.08, 1.3),
      new THREE.MeshStandardMaterial({ color: "#5a9d9b", roughness: 0.15, metalness: 0.2 }),
    );
    pool.position.set(-0.2, 0.55, 0.1);
    group.add(pool);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(15, 64),
      new THREE.MeshStandardMaterial({ color: "#c7d2c6", roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    scene.add(new THREE.HemisphereLight("#fff8e7", "#47635b", 2.2));
    const sun = new THREE.DirectionalLight("#fff0d1", 3.2);
    sun.position.set(8, 12, 5);
    sun.castShadow = true;
    scene.add(sun);

    const target = new THREE.Vector3();
    const frameCenter = new THREE.Vector3();
    let zoomBounds = { min: 4, max: 22 };
    let maxPanDistance = 3;
    let currentView: ImmersiveModelView = "tower";

    const resizeRenderer = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const frameModel = () => {
      group.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(group);
      const size = bounds.getSize(new THREE.Vector3());
      bounds.getCenter(frameCenter);
      target.copy(frameCenter);

      const config = IMMERSIVE_MODEL_VIEW_CONFIG[currentView];
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const heightDistance = size.y / (2 * Math.tan(verticalFov / 2));
      const widthDistance = size.x / (2 * Math.tan(verticalFov / 2) * camera.aspect);
      const distance = Math.max(heightDistance, widthDistance, size.z) * config.framingPadding;
      const direction = new THREE.Vector3(...config.cameraDirection).normalize();

      camera.position.copy(target).add(direction.multiplyScalar(distance));
      camera.near = Math.max(distance / 100, 0.05);
      camera.far = Math.max(distance * 12, 80);
      camera.updateProjectionMatrix();
      camera.lookAt(target);
      zoomBounds = { min: distance * 0.55, max: distance * 1.9 };
      maxPanDistance = Math.max(size.x, size.y, size.z) * config.panLimitRatio;
    };

    const applyView = (nextView: ImmersiveModelView) => {
      currentView = nextView;
      const isolatesListedFloor = nextView === "floor" && Boolean(floorIdentity);
      floorBands.forEach(({ object, floor, tower }) => {
        object.visible = !isolatesListedFloor || (tower === 1 && floor === floorIdentity?.floor);
      });
      group.scale.set(1, isolatesListedFloor ? 1 : IMMERSIVE_MODEL_VIEW_CONFIG[nextView].scaleY, 1);
      group.position.set(0, 0, 0);
      resizeRenderer();
      frameModel();
    };
    runtimeRef.current = { applyView };
    applyView("tower");

    let dragging = false;
    let dragMode: "pan" | "orbit" = "orbit";
    let previousX = 0;
    let previousY = 0;
    const onDown = (event: PointerEvent) => {
      if (!interactionRef.current) return;
      dragging = true;
      dragMode = event.shiftKey || event.altKey || event.button === 1 || event.button === 2 ? "pan" : "orbit";
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging || !interactionRef.current) return;
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;

      if (dragMode === "orbit") {
        const orbitDelta = getModelOrbitDelta({
          active: true,
          deltaX,
          deltaY,
          viewportWidth: renderer.domElement.clientWidth,
          viewportHeight: renderer.domElement.clientHeight,
        });
        const offset = camera.position.clone().sub(target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta += orbitDelta.azimuth;
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + orbitDelta.polar, 0.12, Math.PI - 0.12);
        camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));
        camera.lookAt(target);
      } else {
        const panDelta = getModelPanDelta({
          active: true,
          deltaX,
          deltaY,
          viewportHeight: renderer.domElement.clientHeight,
          cameraDistance: camera.position.distanceTo(target),
          verticalFovDegrees: camera.fov,
        });
        const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        const requestedOffset = cameraRight.multiplyScalar(panDelta.x).add(cameraUp.multiplyScalar(panDelta.y));
        const requestedTarget = target.clone().add(requestedOffset);
        const requestedPan = requestedTarget.sub(frameCenter);
        const boundedPan = getBoundedModelPanOffset({
          x: requestedPan.x,
          y: requestedPan.y,
          z: requestedPan.z,
          maxDistance: maxPanDistance,
        });
        const boundedTarget = frameCenter.clone().add(new THREE.Vector3(boundedPan.x, boundedPan.y, boundedPan.z));
        const appliedOffset = boundedTarget.clone().sub(target);
        camera.position.add(appliedOffset);
        target.copy(boundedTarget);
        camera.lookAt(target);
      }

      previousX = event.clientX;
      previousY = event.clientY;
    };
    const onUp = () => { dragging = false; };
    const onContextMenu = (event: MouseEvent) => {
      if (interactionRef.current) event.preventDefault();
    };
    const onWheel = (event: WheelEvent) => {
      if (!interactionRef.current) return;
      event.preventDefault();
      const currentDistance = camera.position.distanceTo(target);
      const nextDistance = getNextModelZoomDistance({
        active: true,
        currentDistance,
        deltaY: event.deltaY,
        minDistance: zoomBounds.min,
        maxDistance: zoomBounds.max,
      });
      const direction = camera.position.clone().sub(target).normalize();
      camera.position.copy(target).add(direction.multiplyScalar(nextDistance));
      camera.lookAt(target);
    };

    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("contextmenu", onContextMenu);
    mount.addEventListener("wheel", onWheel, { passive: false });

    const resizeObserver = new ResizeObserver(() => {
      resizeRenderer();
      frameModel();
    });
    resizeObserver.observe(mount);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mount.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("contextmenu", onContextMenu);
      runtimeRef.current = null;
      renderer.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [floorIdentity?.floor]);

  useEffect(() => {
    runtimeRef.current?.applyView(view);
  }, [view]);

  return <div className="relative overflow-hidden rounded-[28px] border border-[#17382f]/10 bg-[#e6ece7]">
    <div
      ref={mountRef}
      role="application"
      tabIndex={0}
      data-model-interactive={interactive ? "true" : "false"}
      onPointerDownCapture={() => setInteraction(true)}
      onKeyDown={event => {
        const nextInteraction = getModelInteractionAfterKey(interactionRef.current, event.key);
        if (nextInteraction !== interactionRef.current) {
          event.preventDefault();
          setInteraction(nextInteraction);
        }
      }}
      onBlur={event => {
        const focusStayedWithin = event.currentTarget.contains(event.relatedTarget);
        const nextInteraction = getModelInteractionAfterBlur(interactionRef.current, focusStayedWithin);
        if (nextInteraction !== interactionRef.current) setInteraction(nextInteraction);
      }}
      className={`h-[clamp(260px,50svh,340px)] w-full cursor-grab outline-none transition-shadow active:cursor-grabbing sm:h-[460px] ${interactive ? "ring-2 ring-inset ring-[#b68a4c]" : ""}`}
      aria-label={`Interactive conceptual 3D ${view === "tower" ? "building" : "floor plate"} model. ${interactive ? "Controls active; drag in any direction to orbit around the model, Shift-drag or secondary-drag to pan, use the mouse wheel to zoom, and press Escape to release scrolling." : "Click or press Enter to activate model controls."}`}
    />

    <div className="absolute left-4 top-4 rounded-2xl border border-white/50 bg-white/82 p-2 shadow-lg backdrop-blur-xl">
      <button onClick={() => setView("tower")} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${view === "tower" ? "bg-[#17382f] text-white" : "text-[#49635d]"}`}><Box className="size-4" />Building</button>
      <button onClick={() => setView("floor")} className={`mt-1 flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${view === "floor" ? "bg-[#17382f] text-white" : "text-[#49635d]"}`}><Layers3 className="size-4" />Floor plate</button>
    </div>

    <div className="pointer-events-none absolute bottom-3 left-1/2 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-full bg-[#10231e]/86 px-3 py-2 text-center text-[11px] font-semibold text-white backdrop-blur sm:bottom-4 sm:max-w-none sm:whitespace-nowrap sm:px-4">
      {interactive ? <Rotate3D className="size-4 text-[#d5ae72]" /> : <MousePointer2 className="size-4 text-[#d5ae72]" />}
      <span className="sm:hidden">{interactive ? "Drag to explore · Esc to release" : "Tap to enable 3D controls"}</span>
      <span className="hidden sm:inline">{interactive ? "Drag to orbit · Shift/right-drag to pan · Scroll to zoom · Esc to release" : "Click model to enable orbit, pan and zoom"}</span>
    </div>
    {floorIdentity && <div className="pointer-events-none absolute right-4 top-4 rounded-2xl border border-[#f2c66d]/55 bg-[#10231e]/88 px-4 py-3 text-right text-white shadow-lg backdrop-blur-xl">
      <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#f2c66d]">Listed unit floor</p>
      <p className="mt-1 text-sm font-semibold">{floorIdentity.unitLabel} · Level {floorIdentity.floor}</p>
      <p className="mt-0.5 text-[10px] text-white/68">Gold level highlighted</p>
    </div>}
  </div>;
}
