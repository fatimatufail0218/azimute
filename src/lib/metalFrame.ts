import * as THREE from "three";

/*
 * FRAME SIZE, in real pixels at the zoomed (active) size.
 * On smaller screens everything shrinks together, so the proportions never change.
 *   pad    = width of the frame seen from the front, on each side
 *   depth  = thickness seen from the side
 *   bevel  = size of the angled edge (part of pad, keep it under pad / 2)
 *   recess = how far the photo sits behind the front face
 */
export const FRAME_PX = {
  pad: 13,
  depth: 40,
  bevel: 3,
  recess: 8,
};

/* FRAME LOOK */
export const FRAME_STYLE = {
  face: 0xd6cdb9, // front colour (champagne). Try 0xcfd2d6 for cool silver
  side: 0x7f7667, // side faces (darker)
  metalness: 1,
  roughness: 0.3, // lower = shinier
  sideRoughness: 0.5,
  envIntensity: 0.9, // strength of the reflections
};

export type FrameStyle = typeof FRAME_STYLE;

export type MetalFrame = {
  group: THREE.Group;
  rim: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial[]>;
  photo: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  setOpacity: (opacity: number) => void;
};

/*
 * Ring with rounded outer corners and a rectangular hole, extruded and bevelled.
 * w, h = photo size. P = total width of the rim (front face + bevel). All in world units.
 * The bevel grows the outline by b, so the outline is made b smaller to land exactly on w/2 + P.
 */
function buildRim(w: number, h: number, P: number, b: number, depth: number) {
  const ow = w / 2 + P - b;
  const oh = h / 2 + P - b;
  const iw = w / 2 + b;
  const ih = h / 2 + b;
  const r = Math.max(0.5, Math.min(P * 0.8 - b, ow, oh));

  const shape = new THREE.Shape();
  shape.moveTo(-ow + r, -oh);
  shape.lineTo(ow - r, -oh);
  shape.quadraticCurveTo(ow, -oh, ow, -oh + r);
  shape.lineTo(ow, oh - r);
  shape.quadraticCurveTo(ow, oh, ow - r, oh);
  shape.lineTo(-ow + r, oh);
  shape.quadraticCurveTo(-ow, oh, -ow, oh - r);
  shape.lineTo(-ow, -oh + r);
  shape.quadraticCurveTo(-ow, -oh, -ow + r, -oh);

  const hole = new THREE.Path();
  hole.moveTo(-iw, -ih);
  hole.lineTo(-iw, ih);
  hole.lineTo(iw, ih);
  hole.lineTo(iw, -ih);
  hole.lineTo(-iw, -ih);
  shape.holes.push(hole);

  const run = Math.max(0.5, depth - 2 * b);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: run,
    steps: 1,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: 0,
    bevelSegments: 3,
  });
  geometry.translate(0, 0, -run / 2); // centre the thickness around z = 0
  return geometry;
}

/*
 * One kit builds every frame of the spiral and shares the heavy geometry.
 *   const kit = createFrameKit();
 *   const frame = kit.create();                      // one per photo
 *   kit.resize(photoW, photoH, pad, depth, bevel, recess); // whenever the size changes
 *   frame.setOpacity(0.5);
 *   kit.dispose();
 */
export function createFrameKit(overrides: Partial<FrameStyle> = {}) {
  const s = { ...FRAME_STYLE, ...overrides };
  const plane = new THREE.PlaneGeometry(1, 1);
  const frames: MetalFrame[] = [];
  const materials: THREE.Material[] = [];
  let rimGeometry: THREE.BufferGeometry | null = null;

  const create = (): MetalFrame => {
    const group = new THREE.Group();

    const faceMat = new THREE.MeshStandardMaterial({
      color: s.face,
      metalness: s.metalness,
      roughness: s.roughness,
      envMapIntensity: s.envIntensity,
      transparent: true,
    });
    const sideMat = new THREE.MeshStandardMaterial({
      color: s.side,
      metalness: s.metalness,
      roughness: s.sideRoughness,
      envMapIntensity: s.envIntensity * 0.8,
      transparent: true,
    });
    // Double sided: from behind you see the photo mirrored, not an empty gray box
    const photoMat = new THREE.MeshBasicMaterial({
      color: 0x101313,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    materials.push(faceMat, sideMat, photoMat);

    // material 0 = front/back faces, material 1 = side faces
    const rim = new THREE.Mesh(new THREE.BufferGeometry(), [faceMat, sideMat]);
    const photo = new THREE.Mesh(plane, photoMat);
    group.add(rim, photo);

    const setOpacity = (opacity: number) => {
      [faceMat, sideMat, photoMat].forEach((mat) => {
        mat.opacity = opacity;
        mat.depthWrite = opacity > 0.5; // faded cards must not hide the others
      });
    };

    const frame: MetalFrame = { group, rim, photo, setOpacity };
    frames.push(frame);
    return frame;
  };

  const resize = (
    w: number,
    h: number,
    pad: number,
    depth: number,
    bevel: number,
    recess: number
  ) => {
    const next = buildRim(w, h, pad, bevel, depth);
    frames.forEach((f) => {
      f.rim.geometry = next;
      f.photo.scale.set(w, h, 1);
      f.photo.position.z = depth / 2 - recess;
    });
    rimGeometry?.dispose();
    rimGeometry = next;
  };

  const dispose = () => {
    rimGeometry?.dispose();
    plane.dispose();
    materials.forEach((m) => m.dispose());
  };

  return { create, resize, dispose };
}