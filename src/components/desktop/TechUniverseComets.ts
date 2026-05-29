import * as THREE from 'three';
import { preparePlanetModel } from './TechUniverseModelAssets';

type CometRecord = {
  group: THREE.Group;
  cycle: number;
  offset: number;
  y: number;
  z: number;
  tilt: number;
};

type UfoRecord = CometRecord & {
  modelIndex: number;
  drift: number;
};

const COMET_FORWARD = new THREE.Vector3(0, 0, 1);
const COMET_DIRECTION = new THREE.Vector3(-1, 0.12, 0.12).normalize();
const UFO_FORWARD = new THREE.Vector3(0, 0, 1);
const UFO_DIRECTION = new THREE.Vector3(1, -0.02, -0.08).normalize();
export const UFO_MODEL_URLS = ['/models/ufo_1.glb', '/models/ufo_2.glb', '/models/ufo_3.glb'];

const COMET_FLIGHTS = [
  { cycle: 54, offset: 4.5, y: 0.9, z: -1.2, tilt: -0.18 },
  { cycle: 72, offset: 31.8, y: -0.7, z: 1.6, tilt: 0.12 },
  { cycle: 96, offset: 66.2, y: 1.45, z: 0.7, tilt: -0.06 },
];

const UFO_FLIGHTS = [
  { cycle: 180, y: 1.65, z: -2.2, tilt: 0.08, modelIndex: 0 },
  { cycle: 240, y: -1.05, z: 2.3, tilt: -0.06, modelIndex: 1 },
  { cycle: 320, y: 0.45, z: 3.1, tilt: 0.14, modelIndex: 2 },
];

export const createCometRecords = (universeGroup: THREE.Group) => {
  return COMET_FLIGHTS.map((flight) => {
    const group = new THREE.Group();
    group.visible = false;
    universeGroup.add(group);
    return { group, ...flight } satisfies CometRecord;
  });
};

export const createUfoRecords = (universeGroup: THREE.Group) => {
  return UFO_FLIGHTS.map((flight) => {
    const group = new THREE.Group();
    group.visible = false;
    universeGroup.add(group);
    return {
      group,
      ...flight,
      offset: Math.random() * flight.cycle,
      y: flight.y + THREE.MathUtils.randFloatSpread(0.75),
      z: flight.z + THREE.MathUtils.randFloatSpread(0.9),
      drift: THREE.MathUtils.randFloat(0.12, 0.34),
    } satisfies UfoRecord;
  });
};

export const attachCometModels = (cometRecords: CometRecord[], cometModel: THREE.Object3D) => {
  cometRecords.forEach((cometRecord) => {
    cometRecord.group.clear();
    cometRecord.group.add(preparePlanetModel(cometModel, { targetRadius: 0.24, emissiveColor: '#ffffff', emissiveIntensity: 0.01 }));
  });
};

export const attachUfoModels = (ufoRecords: UfoRecord[], ufoModels: THREE.Object3D[]) => {
  ufoRecords.forEach((ufoRecord) => {
    const ufoModel = ufoModels[ufoRecord.modelIndex % ufoModels.length];
    if (!ufoModel) return;
    ufoRecord.group.clear();
    ufoRecord.group.add(preparePlanetModel(ufoModel, { targetRadius: 0.34, emissiveColor: '#ffffff', emissiveIntensity: 0.01 }));
  });
};

export const updateComets = (cometRecords: CometRecord[], elapsedSeconds: number, outerOrbitRadius: number, isFocused: boolean) => {
  const travelDistance = outerOrbitRadius * 2.95;

  cometRecords.forEach((cometRecord) => {
    if (isFocused) {
      cometRecord.group.visible = false;
      return;
    }

    const phase = ((elapsedSeconds + cometRecord.offset) % cometRecord.cycle) / cometRecord.cycle;
    const isPassing = phase > 0.22 && phase < 0.42;
    cometRecord.group.visible = isPassing;
    if (!isPassing) return;

    const travelProgress = (phase - 0.22) / 0.2;
    cometRecord.group.position.set(
      THREE.MathUtils.lerp(travelDistance, -travelDistance, travelProgress),
      cometRecord.y + Math.sin(travelProgress * Math.PI) * 0.35,
      cometRecord.z + THREE.MathUtils.lerp(-0.6, 0.8, travelProgress),
    );
    cometRecord.group.quaternion.setFromUnitVectors(COMET_FORWARD, COMET_DIRECTION);
    cometRecord.group.rotateZ(cometRecord.tilt);
  });
};

export const updateUfos = (ufoRecords: UfoRecord[], elapsedSeconds: number, outerOrbitRadius: number, isFocused: boolean) => {
  const travelDistance = outerOrbitRadius * 3.2;

  ufoRecords.forEach((ufoRecord) => {
    if (isFocused) {
      ufoRecord.group.visible = false;
      return;
    }

    const phase = ((elapsedSeconds + ufoRecord.offset) % ufoRecord.cycle) / ufoRecord.cycle;
    const isPassing = phase > 0.34 && phase < 0.45;
    ufoRecord.group.visible = isPassing;
    if (!isPassing) return;

    const travelProgress = (phase - 0.34) / 0.11;
    ufoRecord.group.position.set(
      THREE.MathUtils.lerp(-travelDistance, travelDistance, travelProgress),
      ufoRecord.y + Math.sin(travelProgress * Math.PI * 2) * ufoRecord.drift,
      ufoRecord.z + THREE.MathUtils.lerp(0.85, -0.65, travelProgress),
    );
    ufoRecord.group.quaternion.setFromUnitVectors(UFO_FORWARD, UFO_DIRECTION);
    ufoRecord.group.rotateZ(ufoRecord.tilt);
    ufoRecord.group.rotateY(elapsedSeconds * 0.18);
  });
};