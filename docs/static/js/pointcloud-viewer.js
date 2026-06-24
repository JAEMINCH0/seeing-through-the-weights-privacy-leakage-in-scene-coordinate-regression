import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";

const viewers = document.querySelectorAll(".pointcloud-viewer");

viewers.forEach((container) => {
  const status = document.createElement("div");
  status.className = "viewer-status";
  status.textContent = "Loading 3D scene...";
  container.appendChild(status);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const loader = new PLYLoader();
  loader.load(
    container.dataset.ply,
    (geometry) => {
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);
      geometry.computeBoundingSphere();

      const radius = geometry.boundingSphere?.radius || 1;
      const material = new THREE.PointsMaterial({
        size: Math.max(radius / 420, 0.004),
        sizeAttenuation: true,
        vertexColors: Boolean(geometry.getAttribute("color")),
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      camera.near = Math.max(radius / 1000, 0.001);
      camera.far = radius * 100;
      camera.position.set(radius * 0.15, radius * 0.08, radius * 2.3);
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.minDistance = radius * 0.18;
      controls.maxDistance = radius * 8;
      controls.update();

      status.remove();
    },
    undefined,
    () => {
      status.textContent = "Unable to load 3D scene.";
    }
  );

  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();
});
