import { useEffect } from 'react';
import * as THREE from 'three';
import type { SwymbleSkillCategory, SwymbleSkillItem } from '../../data/types';
import { attachCometModels, createCometRecords, updateComets } from './TechUniverseComets';
import { COMET_MODEL_URL, CORE_PLANET_MODEL_URL, getPlanetModelScaleMultiplier, loadGltfScene, loadMoonModelLibrary, preparePlanetModel, selectMoonModel } from './TechUniverseModelAssets';
import { createOrbitGeometry, createStarGeometry, disposeObject } from './TechUniverseSceneAssets';

export type ActiveTech = {
  category: string;
  itemName?: string;
  color?: string;
  source?: 'hover' | 'selected';
};

export type TooltipState = ActiveTech & {
  x: number;
  y: number;
};

type MoonRecord = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  orbitRadius: number;
  angle: number;
  speed: number;
  category: string;
  item: SwymbleSkillItem;
  baseScale: number;
};

type OrbitRecord = {
  group: THREE.Group;
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  category: string;
  radius: number;
};

type UseTechUniverseSceneOptions = {
  skills: SwymbleSkillCategory[];
  activeTechRef: React.MutableRefObject<ActiveTech>;
  focusedCategoryRef: React.MutableRefObject<string>;
  focusedItemRef: React.MutableRefObject<string>;
  setActiveTech: React.Dispatch<React.SetStateAction<ActiveTech>>;
  setTooltip: React.Dispatch<React.SetStateAction<TooltipState | null>>;
  setIsHovering: (val: boolean) => void;
};

const ORBIT_TILTS = [0.18, -0.24, 0.34, -0.36, 0.1];
const ORBIT_SPREAD = 0.78;
const CAMERA_FOV = 42;
const OUTER_ORBIT_PADDING = 1.15;
const CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

const getOuterOrbitRadius = (skills: SwymbleSkillCategory[]) => {
  return 2.55 + Math.max(skills.length - 1, 0) * ORBIT_SPREAD + OUTER_ORBIT_PADDING;
};

const fitCameraToOrbitSystem = (
  camera: THREE.PerspectiveCamera,
  bounds: DOMRect,
  outerOrbitRadius: number,
) => {
  const aspect = Math.max(bounds.width, 1) / Math.max(bounds.height, 1);
  const verticalFov = THREE.MathUtils.degToRad(CAMERA_FOV);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const limitingFov = Math.min(verticalFov, horizontalFov);
  const frameMargin = bounds.height < 760 || bounds.width < 980 ? 1.22 : 1.12;
  const distance = (outerOrbitRadius * frameMargin) / Math.tan(limitingFov / 2);

  camera.position.set(0, outerOrbitRadius * 0.18, distance);
  camera.lookAt(CAMERA_TARGET);
  camera.updateProjectionMatrix();
};

const createMoon = (
  recordIndex: number,
  angle: number,
  orbitRadius: number,
) => {
  const baseScale = 0.18 + (recordIndex % 3) * 0.025;
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(baseScale, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      colorWrite: false,
      depthWrite: false,
    }),
  );
  moon.position.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius);
  moon.userData = { kind: 'moon', recordIndex };

  return { moon, baseScale };
};

export const useTechUniverseScene = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { skills, activeTechRef, focusedCategoryRef, focusedItemRef, setActiveTech, setTooltip, setIsHovering }: UseTechUniverseSceneOptions,
) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const universeGroup = new THREE.Group();
    const moonRecords: MoonRecord[] = [];
    const orbitRecords: OrbitRecord[] = [];
    const interactiveObjects: THREE.Object3D[] = [];
    const cometRecords = createCometRecords(universeGroup);
    let isDisposed = false;

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    universeGroup.rotation.x = -0.06;
    scene.add(universeGroup);
    scene.add(new THREE.AmbientLight(0xffffff, 0.52));
    scene.add(new THREE.HemisphereLight(0xf5f8ff, 0x1c2436, 0.64));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.15);
    keyLight.position.set(5, 6, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.38);
    rimLight.position.set(-5, 2, -4);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.42, 32);
    fillLight.position.set(-2, 3, 5);
    scene.add(fillLight);

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(2.28, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        colorWrite: false,
        depthWrite: false,
      }),
    );
    planet.userData = { kind: 'planet' };
    universeGroup.add(planet);
    interactiveObjects.push(planet);

    loadGltfScene(CORE_PLANET_MODEL_URL).then((coreScene) => {
      if (isDisposed) return;
      planet.add(preparePlanetModel(coreScene, { targetRadius: 2.38, emissiveColor: '#ffffff', emissiveIntensity: 0.01 }));
    }).catch(() => undefined);

    loadGltfScene(COMET_MODEL_URL).then((cometScene) => {
      if (isDisposed) return;
      attachCometModels(cometRecords, cometScene);
    }).catch(() => undefined);

    const starField = new THREE.Points(
      createStarGeometry(),
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.028, transparent: true, opacity: 0.68 }),
    );
    scene.add(starField);

    skills.forEach((skillCategory, categoryIndex) => {
      const orbitRadius = 2.55 + categoryIndex * ORBIT_SPREAD;
      const orbitGroup = new THREE.Group();
      orbitGroup.rotation.x = ORBIT_TILTS[categoryIndex % ORBIT_TILTS.length];
      orbitGroup.rotation.z = categoryIndex * 0.24;
      universeGroup.add(orbitGroup);

      const orbitLine = new THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>(
        createOrbitGeometry(orbitRadius),
        new THREE.LineBasicMaterial({ color: new THREE.Color(skillCategory.items[0]?.color ?? '#00f0ff'), transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending }),
      );
      orbitGroup.add(orbitLine);
      orbitRecords.push({ group: orbitGroup, line: orbitLine, category: skillCategory.category, radius: orbitRadius });

      skillCategory.items.forEach((item, itemIndex) => {
        const angle = (itemIndex / skillCategory.items.length) * Math.PI * 2 + categoryIndex * 0.58;
        const { moon, baseScale } = createMoon(moonRecords.length, angle, orbitRadius);
        orbitGroup.add(moon);
        moonRecords.push({
          mesh: moon,
          orbitRadius,
          angle,
          speed: 0.0018 + categoryIndex * 0.00035,
          category: skillCategory.category,
          item,
          baseScale,
        });
        interactiveObjects.push(moon);
      });
    });

    loadMoonModelLibrary().then((moonModelLibrary) => {
      if (isDisposed) return;
      moonRecords.forEach((moonRecord) => {
        const planetModel = selectMoonModel(moonModelLibrary, moonRecord.category, moonRecord.item.name, moonRecord.item.moonModelId);
        if (!planetModel) return;
        moonRecord.mesh.add(preparePlanetModel(planetModel, {
          targetRadius: moonRecord.baseScale * 1.04 * getPlanetModelScaleMultiplier(planetModel),
          emissiveColor: '#ffffff',
          emissiveIntensity: 0.01,
        }));
      });
    }).catch(() => undefined);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let activeHoverKey = '';
    let animationFrame = 0;
    let isDragging = false;
    let previousClientX = 0;
    let previousClientY = 0;
    const outerOrbitRadius = getOuterOrbitRadius(skills);
    const cameraHomePosition = new THREE.Vector3();
    const cameraLookTarget = new THREE.Vector3();
    const desiredCameraPosition = new THREE.Vector3();
    const desiredCameraTarget = new THREE.Vector3();
    const focusedMoonPosition = new THREE.Vector3();

    const resizeRenderer = () => {
      const bounds = canvas.getBoundingClientRect();
      renderer.setSize(Math.max(bounds.width, 1), Math.max(bounds.height, 1), false);
      camera.aspect = Math.max(bounds.width, 1) / Math.max(bounds.height, 1);
      fitCameraToOrbitSystem(camera, bounds, outerOrbitRadius);
      cameraHomePosition.copy(camera.position);
    };

    const setPointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    };

    const clearHover = () => {
      activeHoverKey = '';
      setTooltip(null);
      setIsHovering(false);
      if (activeTechRef.current.source === 'hover') {
        setActiveTech({ category: '' });
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (isDragging) {
        const focusedMoon = moonRecords.find((moonRecord) => moonRecord.category === focusedCategoryRef.current && moonRecord.item.name === focusedItemRef.current);
        if (focusedMoon) {
          focusedMoon.mesh.rotation.y += (event.clientX - previousClientX) * 0.012;
          focusedMoon.mesh.rotation.x += (event.clientY - previousClientY) * 0.008;
        } else {
          universeGroup.rotation.y += (event.clientX - previousClientX) * 0.007;
          universeGroup.rotation.x = clamp(universeGroup.rotation.x + (event.clientY - previousClientY) * 0.004, -0.42, 0.34);
        }
        previousClientX = event.clientX;
        previousClientY = event.clientY;
      }

      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const focusedCategory = focusedCategoryRef.current;
      const focusedItem = focusedItemRef.current;
      const hitObjects = focusedCategory
        ? interactiveObjects.filter((sceneObject) => {
          const moonRecord = moonRecords[sceneObject.userData.recordIndex];
          return sceneObject.userData.kind === 'moon' && moonRecord?.category === focusedCategory && (!focusedItem || moonRecord.item.name === focusedItem);
        })
        : interactiveObjects;
      const hitObject = raycaster.intersectObjects(hitObjects, false)[0]?.object;
      if (!hitObject) return clearHover();

      if (hitObject.userData.kind === 'planet') {
        activeHoverKey = 'planet';
        setIsHovering(true);
        setTooltip({ category: 'SWYMBLE CORE', itemName: 'Interactive system', x: event.clientX, y: event.clientY });
        return;
      }

      const moonRecord = moonRecords[hitObject.userData.recordIndex];
      if (!moonRecord) return clearHover();

      const hoverKey = `${moonRecord.category}:${moonRecord.item.name}`;
      if (activeHoverKey !== hoverKey) {
        activeHoverKey = hoverKey;
        setActiveTech({
          category: moonRecord.category,
          itemName: moonRecord.item.name,
          color: moonRecord.item.color,
          source: 'hover',
        });
      }
      setIsHovering(true);
      setTooltip({ category: moonRecord.category, itemName: moonRecord.item.name, color: moonRecord.item.color, x: event.clientX, y: event.clientY });
    };

    const handlePointerDown = (event: PointerEvent) => {
      isDragging = true;
      previousClientX = event.clientX;
      previousClientY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerUp = (event: PointerEvent) => {
      isDragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      planet.rotation.y += 0.0028;
      starField.rotation.y += 0.00025;
      const focusedCategory = focusedCategoryRef.current;
      const focusedItem = focusedItemRef.current;
      const focusedOrbit = orbitRecords.find((orbitRecord) => orbitRecord.category === focusedCategory);
      const focusedMoon = moonRecords.find((moonRecord) => moonRecord.category === focusedCategory && moonRecord.item.name === focusedItem);
      const hasFocus = Boolean(focusedCategory && focusedOrbit);
      const hasItemFocus = Boolean(hasFocus && focusedMoon);
      updateComets(cometRecords, performance.now() * 0.001, outerOrbitRadius, hasFocus);

      desiredCameraTarget.set(0, 0, 0);
      desiredCameraPosition.copy(cameraHomePosition);
      if (hasFocus && focusedOrbit) desiredCameraPosition.set(0, focusedOrbit.radius * 0.1, focusedOrbit.radius * 2.28 + 1.6);
      if (hasItemFocus && focusedMoon) {
        focusedMoon.mesh.getWorldPosition(focusedMoonPosition);
        desiredCameraTarget.copy(focusedMoonPosition);
        desiredCameraPosition.set(focusedMoonPosition.x, focusedMoonPosition.y + 0.28, focusedMoonPosition.z + 2.28);
      }
      camera.position.lerp(desiredCameraPosition, 0.055);
      cameraLookTarget.lerp(desiredCameraTarget, 0.055);
      camera.lookAt(cameraLookTarget);

      planet.visible = !hasItemFocus;
      planet.position.x = THREE.MathUtils.lerp(planet.position.x, 0, 0.08);
        planet.scale.setScalar(THREE.MathUtils.lerp(planet.scale.x, hasFocus ? 0.84 : 1, 0.06));

      orbitRecords.forEach((orbitRecord) => {
        const isFocusOrbit = !hasFocus || orbitRecord.category === focusedCategory;
        const orbitScale = THREE.MathUtils.lerp(orbitRecord.group.scale.x, hasFocus && isFocusOrbit ? 1.08 : 1, 0.06);
        orbitRecord.group.position.x = THREE.MathUtils.lerp(orbitRecord.group.position.x, hasFocus && isFocusOrbit ? 0.55 : 0, 0.06);
        orbitRecord.group.scale.setScalar(orbitScale);
        const orbitLineOpacity = isFocusOrbit && !hasItemFocus ? (hasFocus ? 0.52 : 0.24) : 0;
        if (orbitLineOpacity > 0) orbitRecord.line.visible = true;
        orbitRecord.line.material.opacity = THREE.MathUtils.lerp(orbitRecord.line.material.opacity, orbitLineOpacity, 0.08);
        if (orbitLineOpacity === 0 && orbitRecord.line.material.opacity < 0.03) orbitRecord.line.visible = false;
      });

      moonRecords.forEach((moonRecord) => {
        const isFocusedMoon = hasItemFocus && moonRecord.category === focusedCategory && moonRecord.item.name === focusedItem;
        if (!hasItemFocus) moonRecord.angle += moonRecord.speed;
        const isHovered = activeTechRef.current.source === 'hover' && activeTechRef.current.category === moonRecord.category && activeTechRef.current.itemName === moonRecord.item.name;
        const isVisibleOrbit = !hasFocus || (moonRecord.category === focusedCategory && (!hasItemFocus || isFocusedMoon));
        const pulse = isHovered ? 1 + Math.sin(performance.now() * 0.006) * 0.08 : 1;
        const moonScale = isVisibleOrbit ? (isFocusedMoon ? 1.08 : pulse) : 0.001;
        if (isVisibleOrbit) {
          moonRecord.mesh.visible = true;
        }
        moonRecord.mesh.position.set(Math.cos(moonRecord.angle) * moonRecord.orbitRadius, 0, Math.sin(moonRecord.angle) * moonRecord.orbitRadius);
        moonRecord.mesh.rotation.y += isFocusedMoon ? 0.012 : 0.0035;
        moonRecord.mesh.rotation.x += isFocusedMoon ? 0.002 : 0;
        moonRecord.mesh.scale.setScalar(THREE.MathUtils.lerp(moonRecord.mesh.scale.x, moonScale, 0.08));
        if (!isVisibleOrbit && moonRecord.mesh.scale.x < 0.03) {
          moonRecord.mesh.visible = false;
        }
      });

      renderer.render(scene, camera);
    };

    resizeRenderer();
    animate();
    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(canvas);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', clearHover);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', clearHover);
      setIsHovering(false);
      scene.traverse(disposeObject);
      renderer.dispose();
    };
  }, [activeTechRef, canvasRef, focusedCategoryRef, focusedItemRef, setActiveTech, setIsHovering, setTooltip, skills]);
};