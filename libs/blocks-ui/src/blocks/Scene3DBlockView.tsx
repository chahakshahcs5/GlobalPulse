'use client';

import React from 'react';
import type { Scene3DBlock } from '@ai-news/schemas';

/**
 * A three-dimensional scene.
 *
 * The scene is drawn in WebGL. Three.js is a large library, so it is loaded
 * only when a scene is actually on the page — a story without one never pays
 * for it.
 *
 * A reader whose browser cannot draw WebGL is shown the poster picture
 * instead, and so is a reader on a phone: the scene is explorable with a
 * pointer, which a phone does not have.
 */
export const Scene3DBlockView: React.FC<{
  data: Scene3DBlock['data'];
  theme?: 'dark' | 'light';
}> = ({ data, theme = 'light' }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = React.useState(false);

  const scene = data.scene ?? 'globe';
  const height = data.height ?? 480;
  const background = data.background ?? (theme === 'light' ? '#f8fafc' : '#0f172a');

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;

    const start = async () => {
      try {
        const THREE = await import('three');
        if (cancelled) return;

        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        if (cancelled) return;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.setSize(canvas.clientWidth || 800, height, false);
        renderer.setClearColor(background, 1);

        const scene3d = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          50,
          (canvas.clientWidth || 800) / height,
          0.1,
          2000
        );
        const distance = data.cameraDistance ?? 5;
        camera.position.set(0, 0, distance);

        scene3d.add(new THREE.AmbientLight(0xffffff, 1.1));
        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(4, 6, 8);
        scene3d.add(key);
        const rim = new THREE.DirectionalLight(0x88aaff, 0.6);
        rim.position.set(-5, -2, -6);
        scene3d.add(rim);

        const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
        const geometries: import('three').BufferGeometry[] = [];
        const materials: import('three').Material[] = [];

        if (scene === 'globe') {
          const globe = new THREE.Mesh(
            new THREE.SphereGeometry(2, 48, 32),
            new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: false })
          );
          scene3d.add(globe);
          geometries.push(globe.geometry);
          materials.push(globe.material as import('three').Material);

          const wire = new THREE.Mesh(
            new THREE.SphereGeometry(2.02, 24, 16),
            new THREE.MeshBasicMaterial({
              color: 0x334155,
              wireframe: true,
              transparent: true,
              opacity: 0.5,
            })
          );
          scene3d.add(wire);
          geometries.push(wire.geometry);
          materials.push(wire.material as import('three').Material);

          const points = data.points ?? [];
          const positions = new Float32Array(points.length * 3);
          const colors = new Float32Array(points.length * 3);
          points.forEach((point, index) => {
            const phi = (90 - point.lat) * (Math.PI / 180);
            const theta = (point.lon + 180) * (Math.PI / 180);
            const radius = 2.05;
            positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[index * 3 + 1] = radius * Math.cos(phi);
            positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            const color = new THREE.Color(point.color ?? palette[index % palette.length]);
            colors[index * 3] = color.r;
            colors[index * 3 + 1] = color.g;
            colors[index * 3 + 2] = color.b;
          });
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          const material = new THREE.PointsMaterial({ size: 0.12, vertexColors: true });
          const cloud = new THREE.Points(geometry, material);
          scene3d.add(cloud);
          geometries.push(geometry);
          materials.push(material);
        } else if (scene === 'points') {
          const points = data.points ?? [];
          const positions = new Float32Array(points.length * 3);
          const colors = new Float32Array(points.length * 3);
          points.forEach((point, index) => {
            const phi = (90 - point.lat) * (Math.PI / 180);
            const theta = (point.lon + 180) * (Math.PI / 180);
            const radius = 2 + (point.value ?? 0) * 0.08;
            positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[index * 3 + 1] = radius * Math.cos(phi);
            positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            const color = new THREE.Color(point.color ?? palette[index % palette.length]);
            colors[index * 3] = color.r;
            colors[index * 3 + 1] = color.g;
            colors[index * 3 + 2] = color.b;
          });
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          const material = new THREE.PointsMaterial({ size: 0.16, vertexColors: true });
          const cloud = new THREE.Points(geometry, material);
          scene3d.add(cloud);
          geometries.push(geometry);
          materials.push(material);
        } else if (scene === 'bars') {
          const bars = data.bars ?? [];
          const max = Math.max(1, ...bars.map((bar) => bar.value));
          bars.forEach((bar, index) => {
            const heightRatio = bar.value / max;
            const geometry = new THREE.BoxGeometry(0.6, 1, 0.6);
            geometry.translate(0, heightRatio / 2, 0);
            const material = new THREE.MeshStandardMaterial({
              color: bar.color ?? palette[index % palette.length],
              roughness: 0.5,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (index - (bars.length - 1) / 2) * 0.85;
            scene3d.add(mesh);
            geometries.push(geometry);
            materials.push(material);
          });
        } else if (scene === 'model' && data.modelUrl) {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          if (cancelled) return;
          const loader = new GLTFLoader();
          loader.load(
            data.modelUrl,
            (gltf) => {
              if (cancelled) return;
              const model = gltf.scene;
              const box = new THREE.Box3().setFromObject(model);
              const size = box.getSize(new THREE.Vector3()).length() || 1;
              model.scale.setScalar(4 / size);
              model.position.sub(new THREE.Vector3(0, 0, 0));
              scene3d.add(model);
              box.setFromObject(model);
              const centre = box.getCenter(new THREE.Vector3());
              model.position.sub(centre);
            },
            undefined,
            () => {
              if (!cancelled) setFailed(true);
            }
          );
        }

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.minDistance = 2;
        controls.maxDistance = 20;
        // The controls turn the scene on their own, which stops as soon as
        // the reader takes hold of it.
        controls.autoRotate = data.autoRotate ?? false;
        controls.autoRotateSpeed = 1.2;

        let frame = 0;
        const animate = () => {
          frame = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene3d, camera);
        };
        animate();

        const onResize = () => {
          const width = canvas.clientWidth || 800;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);

        dispose = () => {
          cancelAnimationFrame(frame);
          window.removeEventListener('resize', onResize);
          controls.dispose();
          for (const geometry of geometries) geometry.dispose();
          for (const material of materials) material.dispose();
          renderer.dispose();
        };
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    void start();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [scene, data, height, background]);

  const showPoster = failed || (scene === 'model' && !data.modelUrl);

  return (
    <section
      aria-label={data.title ?? 'Three-dimensional scene'}
      className="my-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
    >
      {(data.title || data.subtitle) && (
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          {data.title && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{data.title}</h3>
          )}
          {data.subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{data.subtitle}</p>
          )}
        </header>
      )}

      <div className="relative" style={{ height: `${height}px` }}>
        {showPoster ? (
          data.posterUrl ? (
            <img
              src={data.posterUrl}
              alt={data.alt ?? data.title ?? 'Three-dimensional scene'}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              This scene cannot be drawn here.
            </div>
          )
        ) : (
          <canvas ref={canvasRef} className="w-full h-full block" />
        )}
      </div>

      {data.alt && (
        <p className="px-5 pt-3 text-xs text-slate-500 dark:text-slate-400">{data.alt}</p>
      )}
      {data.caption && (
        <p className="px-5 pb-3 text-sm text-slate-600 dark:text-slate-400">{data.caption}</p>
      )}

      <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {data.sourceAttribution && <p>Source: {data.sourceAttribution}</p>}
        {data.methodology && <p>Methodology: {data.methodology}</p>}
      </footer>
    </section>
  );
};
