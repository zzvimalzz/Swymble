import * as THREE from 'three';

export const createGlowTexture = () => {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 128;
  textureCanvas.height = 128;
  const drawingContext = textureCanvas.getContext('2d');
  if (!drawingContext) return null;

  const glowGradient = drawingContext.createRadialGradient(64, 64, 6, 64, 64, 62);
  glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  glowGradient.addColorStop(0.28, 'rgba(255, 255, 255, 0.45)');
  glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  drawingContext.fillStyle = glowGradient;
  drawingContext.fillRect(0, 0, 128, 128);

  const glowTexture = new THREE.CanvasTexture(textureCanvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  glowTexture.flipY = false;
  return glowTexture;
};

export const createPlanetTexture = () => {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 512;
  textureCanvas.height = 256;
  const drawingContext = textureCanvas.getContext('2d');
  if (!drawingContext) return null;

  const baseGradient = drawingContext.createLinearGradient(0, 0, 512, 256);
  ['#071124', '#123b62', '#0a696f', '#142057', '#5d1847', '#bb5b22', '#060714'].forEach((color, index, colors) => {
    baseGradient.addColorStop(index / (colors.length - 1), color);
  });
  drawingContext.fillStyle = baseGradient;
  drawingContext.fillRect(0, 0, 512, 256);

  for (let stripeIndex = 0; stripeIndex < 34; stripeIndex += 1) {
    const yPosition = (stripeIndex / 34) * 256 + Math.sin(stripeIndex * 1.8) * 12;
    drawingContext.beginPath();
    drawingContext.moveTo(0, yPosition);
    for (let xPosition = 0; xPosition <= 512; xPosition += 16) {
      drawingContext.lineTo(xPosition, yPosition + Math.sin(xPosition * 0.024 + stripeIndex) * 9 + Math.cos(xPosition * 0.011) * 5);
    }
    drawingContext.strokeStyle = stripeIndex % 5 === 0 ? 'rgba(239, 255, 4, 0.24)' : stripeIndex % 3 === 0 ? 'rgba(255, 0, 60, 0.2)' : 'rgba(0, 240, 255, 0.12)';
    drawingContext.lineWidth = stripeIndex % 5 === 0 ? 2.6 : 1.2;
    drawingContext.stroke();
  }

  [
    { x: 368, y: 86, radius: 34, color: 'rgba(255, 0, 60, 0.22)' },
    { x: 164, y: 152, radius: 28, color: 'rgba(0, 240, 255, 0.18)' },
    { x: 258, y: 112, radius: 22, color: 'rgba(239, 255, 4, 0.16)' },
  ].forEach((storm) => {
    const stormGradient = drawingContext.createRadialGradient(storm.x, storm.y, 4, storm.x, storm.y, storm.radius);
    stormGradient.addColorStop(0, storm.color);
    stormGradient.addColorStop(0.52, storm.color.replace(/0\.\d+\)/, '0.08)'));
    stormGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    drawingContext.fillStyle = stormGradient;
    drawingContext.beginPath();
    drawingContext.ellipse(storm.x, storm.y, storm.radius * 1.45, storm.radius * 0.58, -0.25, 0, Math.PI * 2);
    drawingContext.fill();
  });

  for (let sparkIndex = 0; sparkIndex < 160; sparkIndex += 1) {
    drawingContext.fillStyle = `rgba(255,255,255,${Math.random() * 0.18})`;
    drawingContext.fillRect(Math.random() * 512, Math.random() * 256, 1.2, 1.2);
  }

  const planetTexture = new THREE.CanvasTexture(textureCanvas);
  planetTexture.colorSpace = THREE.SRGBColorSpace;
  planetTexture.flipY = false;
  return planetTexture;
};

export const createOrbitGeometry = (radius: number) => {
  const points: THREE.Vector3[] = [];
  for (let segmentIndex = 0; segmentIndex <= 160; segmentIndex += 1) {
    const angle = (segmentIndex / 160) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
};

export const createStarGeometry = () => {
  const starCount = 700;
  const positions = new Float32Array(starCount * 3);
  for (let starIndex = 0; starIndex < starCount; starIndex += 1) {
    const positionIndex = starIndex * 3;
    const radius = 10 + Math.random() * 18;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[positionIndex] = radius * Math.sin(phi) * Math.cos(theta);
    positions[positionIndex + 1] = radius * Math.cos(phi) * 0.55;
    positions[positionIndex + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
};

export const createMoonLabel = (name: string, color: string, description?: string) => {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 768;
  textureCanvas.height = 168;
  const drawingContext = textureCanvas.getContext('2d');
  if (!drawingContext) return null;

  drawingContext.fillStyle = 'rgba(3, 5, 10, 0.78)';
  drawingContext.strokeStyle = color;
  drawingContext.lineWidth = 3;
  drawingContext.roundRect(16, 20, 736, 112, 18);
  drawingContext.fill();
  drawingContext.stroke();
  drawingContext.fillStyle = 'rgba(240, 240, 240, 0.94)';
  drawingContext.font = '800 34px sans-serif';
  drawingContext.fillText(name, 42, description ? 72 : 92, 680);

  if (description) {
    drawingContext.fillStyle = 'rgba(240, 240, 240, 0.62)';
    drawingContext.font = '700 20px monospace';
    drawingContext.fillText(description, 42, 106, 660);
  }

  const labelTexture = new THREE.CanvasTexture(textureCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, transparent: true, opacity: 0, depthWrite: false }));
  label.scale.set(2.45, 0.54, 1);
  return label;
};

export const disposeObject = (sceneObject: THREE.Object3D) => {
  if (sceneObject instanceof THREE.Mesh || sceneObject instanceof THREE.Points || sceneObject instanceof THREE.Line) sceneObject.geometry.dispose();

  if (sceneObject instanceof THREE.Mesh || sceneObject instanceof THREE.Points || sceneObject instanceof THREE.Line || sceneObject instanceof THREE.Sprite) {
    const material = sceneObject.material;
    const disposeMaterial = (itemMaterial: THREE.Material) => {
      if ('map' in itemMaterial && itemMaterial.map instanceof THREE.Texture) itemMaterial.map.dispose();
      itemMaterial.dispose();
    };
    Array.isArray(material) ? material.forEach(disposeMaterial) : disposeMaterial(material);
  }
};