import { Box, Layers3, Rotate3D } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function BuildingViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"tower" | "floor">("tower");
  const sceneRef = useRef<{ group: THREE.Group; camera: THREE.PerspectiveCamera } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e6ece7");
    scene.fog = new THREE.Fog("#e6ece7", 17, 35);
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(9, 7.5, 12);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const concrete = new THREE.MeshStandardMaterial({ color: "#d9d2c3", roughness: 0.7, metalness: 0.05 });
    const glass = new THREE.MeshStandardMaterial({ color: "#476c65", roughness: 0.18, metalness: 0.35 });
    const brass = new THREE.MeshStandardMaterial({ color: "#b68a4c", roughness: 0.42, metalness: 0.45 });

    const makeTower = (x: number, z: number, floors: number, width: number) => {
      const floorHeight = 0.42;
      const tower = new THREE.Group();
      for (let floor = 0; floor < floors; floor += 1) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.34, 2.15), concrete);
        slab.position.y = floor * floorHeight + 0.55;
        slab.castShadow = true;
        slab.receiveShadow = true;
        tower.add(slab);
        const windowBand = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.18, 2.18), glass);
        windowBand.position.y = floor * floorHeight + 0.63;
        tower.add(windowBand);
        const balcony = new THREE.Mesh(new THREE.BoxGeometry(width + 0.25, 0.045, 2.42), brass);
        balcony.position.set(0, floor * floorHeight + 0.78, 0);
        tower.add(balcony);
      }
      tower.position.set(x, 0, z);
      return tower;
    };
    group.add(makeTower(-1.7, 0, 13, 2.4));
    group.add(makeTower(1.45, -0.8, 19, 2.1));
    group.add(makeTower(0.2, 2.3, 9, 2.8));
    const podium = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.6, 6), concrete);
    podium.position.y = 0.2;
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);
    const pool = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 1.3), new THREE.MeshStandardMaterial({ color: "#5a9d9b", roughness: 0.15, metalness: 0.2 }));
    pool.position.set(-0.2, 0.55, 0.1);
    group.add(pool);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(15, 64), new THREE.MeshStandardMaterial({ color: "#c7d2c6", roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    scene.add(new THREE.HemisphereLight("#fff8e7", "#47635b", 2.2));
    const sun = new THREE.DirectionalLight("#fff0d1", 3.2);
    sun.position.set(8, 12, 5);
    sun.castShadow = true;
    scene.add(sun);
    sceneRef.current = { group, camera };

    let dragging = false;
    let previousX = 0;
    const onDown = (event: PointerEvent) => { dragging = true; previousX = event.clientX; renderer.domElement.setPointerCapture(event.pointerId); };
    const onMove = (event: PointerEvent) => { if (!dragging) return; group.rotation.y += (event.clientX - previousX) * 0.009; previousX = event.clientX; };
    const onUp = () => { dragging = false; };
    const onWheel = (event: WheelEvent) => { camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.01, 7, 18); };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    const onResize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight); };
    window.addEventListener("resize", onResize);
    let frame = 0;
    const animate = () => { frame = requestAnimationFrame(animate); if (!dragging) group.rotation.y += 0.0012; renderer.render(scene, camera); };
    animate();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); renderer.dispose(); scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); } }); if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { group, camera } = sceneRef.current;
    if (view === "floor") { group.scale.y = 0.23; group.position.y = 1.2; camera.position.set(8, 9, 10); }
    else { group.scale.y = 1; group.position.y = 0; camera.position.set(9, 7.5, 12); }
  }, [view]);

  return <div className="relative overflow-hidden rounded-[28px] border border-[#17382f]/10 bg-[#e6ece7]">
    <div ref={mountRef} role="img" className="h-[460px] w-full cursor-grab active:cursor-grabbing" aria-label="Interactive conceptual 3D building model with three residential towers and a shared pool" />
    <div className="absolute left-4 top-4 rounded-2xl border border-white/50 bg-white/82 p-2 shadow-lg backdrop-blur-xl"><button onClick={() => setView("tower")} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${view === "tower" ? "bg-[#17382f] text-white" : "text-[#49635d]"}`}><Box className="size-4" />Building</button><button onClick={() => setView("floor")} className={`mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${view === "floor" ? "bg-[#17382f] text-white" : "text-[#49635d]"}`}><Layers3 className="size-4" />Floor plate</button></div>
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#10231e]/84 px-4 py-2 text-[11px] font-semibold text-white backdrop-blur"><Rotate3D className="size-4 text-[#d5ae72]" />Drag to rotate · Scroll to zoom</div>
  </div>;
}
