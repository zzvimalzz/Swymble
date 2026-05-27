import { useEffect } from 'react';
import * as THREE from 'three';
import type { SwymbleSkillCategory, SwymbleSkillItem } from '../../data/types';
import { createGlowTexture, createMoonLabel, createMoonTexture, createOrbitGeometry, createPlanetTexture, createStarGeometry, disposeObject } from './TechUniverseSceneAssets';

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
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  glow: THREE.Sprite;
  label: THREE.Sprite | null;
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
  item: SwymbleSkillItem,
  recordIndex: number,
  angle: number,
  orbitRadius: number,
  category: string,
  glowTexture: THREE.Texture | null,
) => {
  const itemColor = new THREE.Color(item.color);
  const baseScale = 0.18 + (recordIndex % 3) * 0.025;
  const moonTexture = createMoonTexture(item.name, item.color, category);
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(baseScale, 32, 32),
    new THREE.MeshStandardMaterial({
      map: moonTexture ?? undefined,
      color: 0xffffff,
      emissive: itemColor,
      emissiveIntensity: 0.16,
      roughness: 0.52,
      metalness: 0.04,
      transparent: true,
      depthWrite: false,
    }),
  );
  moon.position.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius);
  moon.userData = { kind: 'moon', recordIndex };

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture ?? undefined,
      color: itemColor,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  glow.scale.set(baseScale * 5.4, baseScale * 5.4, 1);
  glow.position.copy(moon.position);

  return { moon, glow, baseScale };
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
    const planetTexture = createPlanetTexture();
    const glowTexture = createGlowTexture();
    const moonRecords: MoonRecord[] = [];
    const orbitRecords: OrbitRecord[] = [];
    const interactiveObjects: THREE.Object3D[] = [];

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    universeGroup.rotation.x = -0.06;
    scene.add(universeGroup);
    scene.add(new THREE.AmbientLight(0x6d7cff, 0.7));

    const keyLight = new THREE.PointLight(0xffffff, 2.6, 30);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x00f0ff, 2.2, 28);
    rimLight.position.set(-5, -1, -3);
    scene.add(rimLight);

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(1.86, 96, 96),
      new THREE.MeshStandardMaterial({
        map: planetTexture ?? undefined,
        color: 0x5d759f,
        roughness: 0.58,
        metalness: 0.1,
        emissive: new THREE.Color('#17386f'),
        emissiveIntensity: 0.46,
        transparent: true,
      }),
    );
    planet.userData = { kind: 'planet' };
    universeGroup.add(planet);
    interactiveObjects.push(planet);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.08, 96, 96),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
    );
    universeGroup.add(atmosphere);

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
        const { moon, glow, baseScale } = createMoon(item, moonRecords.length, angle, orbitRadius, skillCategory.category, glowTexture);
        const label = createMoonLabel(item.name, item.color, item.description);
        if (label) label.visible = false;
        orbitGroup.add(moon, glow, ...(label ? [label] : []));
        moonRecords.push({
          mesh: moon,
          glow,
          label,
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
      atmosphere.rotation.y -= 0.0015;
      starField.rotation.y += 0.00025;
      const focusedCategory = focusedCategoryRef.current;
      const focusedItem = focusedItemRef.current;
      const focusedOrbit = orbitRecords.find((orbitRecord) => orbitRecord.category === focusedCategory);
      const focusedMoon = moonRecords.find((moonRecord) => moonRecord.category === focusedCategory && moonRecord.item.name === focusedItem);
      const hasFocus = Boolean(focusedCategory && focusedOrbit);
      const hasItemFocus = Boolean(hasFocus && focusedMoon);

      desiredCameraTarget.set(0, 0, 0);
      desiredCameraPosition.copy(cameraHomePosition);
      if (hasFocus && focusedOrbit) desiredCameraPosition.set(0, focusedOrbit.radius * 0.1, focusedOrbit.radius * 2.28 + 1.6);
      if (hasItemFocus && focusedMoon) {
        focusedMoon.mesh.getWorldPosition(focusedMoonPosition);
        desiredCameraTarget.copy(focusedMoonPosition);
        desiredCameraPosition.set(focusedMoonPosition.x, focusedMoonPosition.y + 0.32, focusedMoonPosition.z + 1.55);
      }
      camera.position.lerp(desiredCameraPosition, 0.055);
      cameraLookTarget.lerp(desiredCameraTarget, 0.055);
      camera.lookAt(cameraLookTarget);

      const planetOpacity = hasFocus ? (hasItemFocus ? 0 : 0.08) : 1;
      if (!hasItemFocus) {
        planet.visible = true;
        atmosphere.visible = true;
      }
      planet.position.x = THREE.MathUtils.lerp(planet.position.x, 0, 0.08);
      atmosphere.position.copy(planet.position);
      planet.scale.setScalar(THREE.MathUtils.lerp(planet.scale.x, hasFocus ? 0.58 : 1, 0.06));
      atmosphere.scale.copy(planet.scale);
      planet.material.opacity = THREE.MathUtils.lerp(planet.material.opacity, planetOpacity, 0.06);
      atmosphere.material.opacity = THREE.MathUtils.lerp(atmosphere.material.opacity, hasItemFocus ? 0 : hasFocus ? 0.02 : 0.12, 0.06);
      if (hasItemFocus && planet.material.opacity < 0.03) planet.visible = false;
      if (hasItemFocus && atmosphere.material.opacity < 0.03) atmosphere.visible = false;

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
        const moonOpacity = isVisibleOrbit ? 1 : 0;
        if (isVisibleOrbit) {
          moonRecord.mesh.visible = true;
          moonRecord.glow.visible = true;
        }
        moonRecord.mesh.position.set(Math.cos(moonRecord.angle) * moonRecord.orbitRadius, 0, Math.sin(moonRecord.angle) * moonRecord.orbitRadius);
        moonRecord.mesh.rotation.y += isFocusedMoon ? 0.012 : 0.0035;
        moonRecord.mesh.rotation.x += isFocusedMoon ? 0.002 : 0;
        moonRecord.mesh.scale.setScalar(pulse);
        if (moonRecord.mesh.material.transparent === isFocusedMoon) {
          moonRecord.mesh.material.transparent = !isFocusedMoon;
          moonRecord.mesh.material.depthWrite = isFocusedMoon;
          moonRecord.mesh.material.needsUpdate = true;
        }
        moonRecord.mesh.material.opacity = isFocusedMoon ? 1 : THREE.MathUtils.lerp(moonRecord.mesh.material.opacity, moonOpacity, 0.08);
        moonRecord.glow.position.copy(moonRecord.mesh.position);
        moonRecord.glow.material.opacity = THREE.MathUtils.lerp(moonRecord.glow.material.opacity, isVisibleOrbit ? (isHovered ? 0.78 : 0.35) : 0, 0.08);
        moonRecord.glow.scale.setScalar(moonRecord.baseScale * (isHovered ? 7.2 : 5.4));
        if (!isVisibleOrbit && moonRecord.mesh.material.opacity < 0.03) {
          moonRecord.mesh.visible = false;
          moonRecord.glow.visible = false;
        }
        if (moonRecord.label) {
          moonRecord.label.position.set(moonRecord.mesh.position.x, moonRecord.baseScale + 0.36, moonRecord.mesh.position.z);
          moonRecord.label.material.opacity = THREE.MathUtils.lerp(moonRecord.label.material.opacity, hasFocus && isVisibleOrbit && !hasItemFocus ? 0.9 : 0, 0.08);
          moonRecord.label.visible = moonRecord.label.material.opacity > 0.04;
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
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', clearHover);
      setIsHovering(false);
      scene.traverse(disposeObject);
      planetTexture?.dispose();
      glowTexture?.dispose();
      renderer.dispose();
    };
  }, [activeTechRef, canvasRef, focusedCategoryRef, focusedItemRef, setActiveTech, setIsHovering, setTooltip, skills]);
};