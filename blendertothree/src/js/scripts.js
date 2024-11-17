import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as YUKA from "yuka";
const monkeyUrl = new URL("../assets/fish.glb", import.meta.url);

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

renderer.setClearColor(0xa3a3a3);

const orbit = new OrbitControls(camera, renderer.domElement);

camera.position.set(10, 10, 10);
orbit.update();

const grid = new THREE.GridHelper(30, 30);
scene.add(grid);

const vehicleGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
vehicleGeometry.rotateX(Math.PI * 0.5);
const vehicleMaterial = new THREE.MeshNormalMaterial();
const vehicleMesh = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
vehicleMesh.matrixAutoUpdate = false;
scene.add(vehicleMesh);

const vehicle = new YUKA.Vehicle();

vehicle.setRenderComponent(vehicleMesh, sync);

function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix);
}

const path = new YUKA.Path();
path.add(new YUKA.Vector3(-4, 0, 4));
path.add(new YUKA.Vector3(-6, 0, 0));
path.add(new YUKA.Vector3(-4, 0, -4));
path.add(new YUKA.Vector3(0, 0, 0));
path.add(new YUKA.Vector3(4, 0, -4));
path.add(new YUKA.Vector3(6, 0, 0));
path.add(new YUKA.Vector3(4, 0, 4));
path.add(new YUKA.Vector3(0, 0, 6));

path.loop = true;

vehicle.position.copy(path.current());

vehicle.maxSpeed = 3;

const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5);
vehicle.steering.add(followPathBehavior);

const onPathBehavior = new YUKA.OnPathBehavior(path);
onPathBehavior.radius = 3;
vehicle.steering.add(onPathBehavior);

const entityManager = new YUKA.EntityManager();
entityManager.add(vehicle);

const loader = new GLTFLoader();

loader.load(monkeyUrl.href, function (gltf) {
  const model = gltf.scene;
  scene.add(model);
  model.matrixAutoUpdate = false;
  vehicle.scale = new YUKA.Vector3(0.5, 0.5, 0.5);
  vehicle.setRenderComponent(model, sync);
});
const position = [];
for (let i = 0; i < path._waypoints.length; i++) {
  const waypoint = path._waypoints[i];
  position.push(waypoint.x, waypoint.y, waypoint.z);
}

const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(position, 3)
);

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const lines = new THREE.LineLoop(lineGeometry, lineMaterial);
scene.add(lines);

// const assetLoader = new GLTFLoader();

// let mixer;
// assetLoader.load(
//   monkeyUrl.href,
//   function (gltf) {
//     const model = gltf.scene;
//     scene.add(model);
//     mixer = new THREE.AnimationMixer(model);
//     const clips = gltf.animations;

// Play a certain animation
// const clip = THREE.AnimationClip.findByName(clips, 'HeadAction');
// const action = mixer.clipAction(clip);
// action.play();

// Play all animations at the same time
//     clips.forEach(function (clip) {
//       const action = mixer.clipAction(clip);
//       action.play();
//     });
//   },
//   undefined,
//   function (error) {
//     console.error(error);
//   }
// );

const time = new YUKA.Time();

function animate() {
  const delta = time.update().getDelta();
  entityManager.update(delta);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
