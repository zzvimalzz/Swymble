import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const CORE_PLANET_MODEL_URL = '/models/earth.glb';
export const PLANET_COLLECTION_MODEL_URL = '/models/planet_collection.glb';
export const COMET_MODEL_URL = '/models/comet.glb';

export const MOON_MODEL_VARIANTS = [
  { id: 'moon-01', source: 'collection', index: 0 },
  { id: 'moon-02', source: 'collection', index: 1 },
  { id: 'moon-03', source: 'collection', index: 2 },
  { id: 'moon-04', source: 'collection', index: 3 },
  { id: 'moon-05', source: 'collection', index: 4 },
  { id: 'moon-06', source: 'file', url: '/models/planet_1.glb' },
  { id: 'moon-07', source: 'file', url: '/models/planet_3.glb' },
  { id: 'moon-08', source: 'file', url: '/models/planet_4.glb' },
] as const;

type MoonModelId = typeof MOON_MODEL_VARIANTS[number]['id'];
type MoonModelLibrary = Map<MoonModelId, THREE.Object3D>;

type PlanetMaterial = THREE.Material & {
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  map?: THREE.Texture | null;
  metalness?: number;
  roughness?: number;
};

type PreparePlanetModelOptions = {
  targetRadius: number;
  emissiveColor: THREE.ColorRepresentation;
  emissiveIntensity: number;
};

const gltfLoader = new GLTFLoader();
let moonModelLibraryPromise: Promise<MoonModelLibrary> | null = null;

const isRenderableMesh = (sceneObject: THREE.Object3D): sceneObject is THREE.Mesh => {
  return sceneObject instanceof THREE.Mesh;
};

const hasRenderableMesh = (sceneObject: THREE.Object3D) => {
  let hasMesh = false;
  sceneObject.traverse((child) => {
    if (isRenderableMesh(child)) hasMesh = true;
  });
  return hasMesh;
};

const prepareMaterial = (material: THREE.Material, options: PreparePlanetModelOptions) => {
  const prepared = material.clone() as PlanetMaterial;
  prepared.transparent = false;
  prepared.opacity = 1;
  prepared.depthWrite = true;
  prepared.depthTest = true;

  if (prepared.map) prepared.map.colorSpace = THREE.SRGBColorSpace;
  if (prepared.color) prepared.color.offsetHSL(0, 0.08, -0.025);
  if (prepared.emissive) {
    prepared.emissive.offsetHSL(0, 0.06, -0.02);
    prepared.emissiveIntensity = Math.min(prepared.emissiveIntensity ?? 0, options.emissiveIntensity);
  }
  if (typeof prepared.roughness === 'number') prepared.roughness = THREE.MathUtils.clamp(prepared.roughness, 0.42, 0.72);
  if (typeof prepared.metalness === 'number') prepared.metalness = Math.min(prepared.metalness, 0.22);

  prepared.needsUpdate = true;
  return prepared;
};

export const loadGltfScene = (url: string) => {
  return new Promise<THREE.Group>((resolve, reject) => {
    gltfLoader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
};

export const getPlanetCollectionCandidates = (collectionScene: THREE.Group) => {
  let collectionRoot: THREE.Object3D | null = null;

  collectionScene.traverse((child) => {
    if (collectionRoot) return;
    const groupedPlanets = child.children.filter((candidate) => !(candidate instanceof THREE.Mesh) && hasRenderableMesh(candidate));
    if (groupedPlanets.length > 1) collectionRoot = child;
  });

  const resolvedCollectionRoot = collectionRoot as THREE.Object3D | null;
  const rootCandidates = resolvedCollectionRoot?.children.filter(hasRenderableMesh) ?? [];
  const directCandidates = collectionScene.children.filter(hasRenderableMesh);
  const nestedCandidates = directCandidates.length === 1 ? directCandidates[0].children.filter(hasRenderableMesh) : [];

  if (rootCandidates.length > 1) return rootCandidates;
  if (nestedCandidates.length > 1) return nestedCandidates;
  if (directCandidates.length) return directCandidates;
  return [collectionScene];
};

export const getPlanetModelScaleMultiplier = (planetModel: THREE.Object3D) => {
  let hasRingDetails = /ring|hud/i.test(planetModel.name);

  planetModel.traverse((child) => {
    if (/ring|hud/i.test(child.name)) hasRingDetails = true;
  });

  return hasRingDetails ? 1.18 : 1;
};

const getStableVariantIndex = (value: string, total: number) => {
  const seed = [...value].reduce((currentSeed, character) => ((currentSeed << 5) - currentSeed + character.charCodeAt(0)) | 0, 0);
  return Math.abs(seed) % total;
};

export const loadMoonModelLibrary = () => {
  if (moonModelLibraryPromise) return moonModelLibraryPromise;

  moonModelLibraryPromise = Promise.all([
    loadGltfScene(PLANET_COLLECTION_MODEL_URL),
    ...MOON_MODEL_VARIANTS.filter((variant) => variant.source === 'file').map((variant) => loadGltfScene(variant.url)),
  ]).then(([collectionScene, ...fileScenes]) => {
    const library: MoonModelLibrary = new Map();
    const collectionCandidates = getPlanetCollectionCandidates(collectionScene);
    const fileVariants = MOON_MODEL_VARIANTS.filter((variant) => variant.source === 'file');

    MOON_MODEL_VARIANTS.forEach((variant) => {
      if (variant.source === 'collection') {
        const candidate = collectionCandidates[variant.index];
        if (candidate) library.set(variant.id, candidate);
        return;
      }

      const fileScene = fileScenes[fileVariants.findIndex((fileVariant) => fileVariant.id === variant.id)];
      if (fileScene) library.set(variant.id, fileScene);
    });

    return library;
  });

  return moonModelLibraryPromise;
};

export const selectMoonModel = (library: MoonModelLibrary, category: string, itemName: string, moonModelId?: string) => {
  if (moonModelId && library.has(moonModelId as MoonModelId)) return library.get(moonModelId as MoonModelId) ?? null;

  const availableIds = MOON_MODEL_VARIANTS.map((variant) => variant.id).filter((variantId) => library.has(variantId));
  if (!availableIds.length) return null;
  return library.get(availableIds[getStableVariantIndex(`${category}:${itemName}`, availableIds.length)]) ?? null;
};

export const preparePlanetModel = (sourceModel: THREE.Object3D, options: PreparePlanetModelOptions) => {
  const model = sourceModel.clone(true);
  const wrapper = new THREE.Group();
  wrapper.add(model);

  model.traverse((child) => {
    if (!isRenderableMesh(child)) return;
    child.castShadow = false;
    child.receiveShadow = false;
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => prepareMaterial(material, options))
      : prepareMaterial(child.material, options);
  });

  const bounds = new THREE.Box3().setFromObject(wrapper);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);

  model.position.sub(center);
  wrapper.scale.setScalar((options.targetRadius * 2) / maxAxis);
  return wrapper;
};