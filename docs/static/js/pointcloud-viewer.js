import * as THREE from "three";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";

const viewers = document.querySelectorAll(".pointcloud-viewer");
const defaultCameraOffset = new THREE.Vector3(0.15, 0.08, 2.3);
const defaultViewState = {
  direction: defaultCameraOffset.clone().normalize(),
  distanceFactor: defaultCameraOffset.length(),
  up: new THREE.Vector3(0, 1, 0),
};

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

  const controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noRotate = false;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = false;
  controls.dynamicDampingFactor = 0.12;

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    controls.handleResize();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const loader = new PLYLoader();
  let activePoints = null;
  let loadToken = 0;
  let currentRadius = 1;

  const clearPoints = () => {
    if (!activePoints) {
      return;
    }

    scene.remove(activePoints);
    activePoints.geometry.dispose();
    activePoints.material.dispose();
    activePoints = null;
  };

  const setStatus = (message) => {
    status.textContent = message;
    status.hidden = false;
  };

  const getViewState = () => {
    const direction = camera.position.clone().sub(controls.target);
    const distance = direction.length();

    if (distance === 0) {
      direction.copy(defaultViewState.direction);
    } else {
      direction.normalize();
    }

    return {
      direction,
      distanceFactor: distance / Math.max(currentRadius, 0.001),
      up: camera.up.clone(),
    };
  };

  const applyViewState = (state) => {
    const distance = Math.max(currentRadius, 0.001) * state.distanceFactor;
    controls.target.set(0, 0, 0);
    camera.position.copy(state.direction).multiplyScalar(distance).add(controls.target);
    camera.up.copy(state.up);
    camera.lookAt(controls.target);
    controls.update();
  };

  const loadPly = (url) => {
    const viewState = activePoints ? getViewState() : defaultViewState;
    loadToken += 1;
    const currentToken = loadToken;
    setStatus("Loading 3D scene...");
    clearPoints();

    loader.load(
      url,
      (geometry) => {
        if (currentToken !== loadToken) {
          geometry.dispose();
          return;
        }

        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);
        geometry.computeBoundingSphere();

        const radius = geometry.boundingSphere?.radius || 1;
        currentRadius = radius;
        const material = new THREE.PointsMaterial({
          size: Math.max(radius / 420, 0.004),
          sizeAttenuation: true,
          vertexColors: Boolean(geometry.getAttribute("color")),
        });

        const points = new THREE.Points(geometry, material);
        activePoints = points;
        scene.add(points);

        camera.near = Math.max(radius / 1000, 0.001);
        camera.far = radius * 100;
        camera.updateProjectionMatrix();
        controls.minDistance = radius * 0.18;
        controls.maxDistance = radius * 8;
        applyViewState(viewState);

        status.hidden = true;
      },
      undefined,
      () => {
        if (currentToken === loadToken) {
          setStatus("Unable to load 3D scene.");
        }
      }
    );
  };

  container.__pointCloudViewer = {
    applyViewState,
    getViewState,
    loadPly,
  };
  loadPly(container.dataset.ply);

  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();
});

const modelSceneTabs = document.querySelector("[data-model-scene-tabs]");

if (modelSceneTabs) {
  const tabs = Array.from(modelSceneTabs.querySelectorAll(".scene-tab"));
  const privateViewer = document.querySelector('[data-model-viewer="private"]');
  const recoveredViewer = document.querySelector('[data-model-viewer="recovered"]');

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.classList.contains("is-active")) {
        return;
      }

      tabs.forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      privateViewer?.__pointCloudViewer?.loadPly(tab.dataset.privatePly);
      recoveredViewer?.__pointCloudViewer?.loadPly(tab.dataset.recoveredPly);
    });
  });
}
