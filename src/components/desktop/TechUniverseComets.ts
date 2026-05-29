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

const COMET_FORWARD = new THREE.Vector3(0, 0, 1);
const COMET_DIRECTION = new THREE.Vector3(-1, 0.12, 0.12).normalize();
const COMET_FLIGHTS = [
  { cycle: 54, offset: 4.5, y: 0.9, z: -1.2, tilt: -0.18 },
  { cycle: 72, offset: 31.8, y: -0.7, z: 1.6, tilt: 0.12 },
  { cycle: 96, offset: 66.2, y: 1.45, z: 0.7, tilt: -0.06 },
];

export const createCometRecords = (universeGroup: THREE.Group) => {
  return COMET_FLIGHTS.map((flight) => {
    const group = new THREE.Group();
    group.visible = false;
    universeGroup.add(group);
    return { group, ...flight } satisfies CometRecord;
  });
};

export const attachCometModels = (cometRecords: CometRecord[], cometModel: THREE.Object3D) => {
  cometRecords.forEach((cometRecord) => {
    cometRecord.group.clear();
    cometRecord.group.add(preparePlanetModel(cometModel, { targetRadius: 0.24, emissiveColor: '#ffffff', emissiveIntensity: 0.01 }));
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