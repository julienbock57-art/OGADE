/**
 * Maquette3DViewer — Affiche un fichier STL en 3D (orbit + zoom + pan).
 *
 * Le fichier est récupéré via api.fetchBlob (avec auth JWT) à partir
 * de l'id du Fichier. Pour les fichiers STEP/STP, on n'embarque pas
 * de loader CAD (occt-import-js fait ~6 Mo) — on affiche un message
 * + lien de téléchargement.
 *
 * Bouton plein-écran : passe la div en mode fullscreen (API native).
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// STLLoader et OrbitControls sont distribués séparément dans le package
// three (examples). On les importe avec leur chemin "addons".
// eslint-disable-next-line import/no-unresolved
import { STLLoader } from "three/addons/loaders/STLLoader.js";
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Fichier } from "@ogade/shared";
import { api } from "@/lib/api";
import { downloadFichier } from "@/lib/fichiers";

interface Props {
  fichier: Fichier;
  height?: number;
  className?: string;
}

function isStl(f: Fichier): boolean {
  const name = (f.nomOriginal ?? "").toLowerCase();
  return name.endsWith(".stl");
}

function isStep(f: Fichier): boolean {
  const name = (f.nomOriginal ?? "").toLowerCase();
  return name.endsWith(".step") || name.endsWith(".stp");
}

export default function Maquette3DViewer({ fichier, height = 380, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // STEP : pas de loader embarqué pour rester léger côté bundle.
  const stepNotSupported = isStep(fichier);

  useEffect(() => {
    if (stepNotSupported) return;
    if (!isStl(fichier)) {
      setStatus("error");
      setError(`Format non supporté pour la prévisualisation : ${fichier.nomOriginal ?? ""}`);
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    setStatus("loading");

    const width = container.clientWidth;
    const h = container.clientHeight || height;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f5f8);

    const camera = new THREE.PerspectiveCamera(50, width / h, 0.1, 5000);
    camera.position.set(120, 80, 120);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, h);
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(120, 200, 100);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-120, -100, -80);
    scene.add(dir2);

    // Grid floor for reference
    const grid = new THREE.GridHelper(400, 40, 0xd0d4dc, 0xe5e7eb);
    grid.position.y = -0.1;
    scene.add(grid);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    let mesh: THREE.Mesh | null = null;
    let animationId = 0;

    async function load() {
      try {
        const blob = await api.fetchBlob(`/fichiers/${fichier.id}/download`);
        const buffer = await blob.arrayBuffer();
        const loader = new STLLoader();
        const geometry = loader.parse(buffer);
        geometry.computeBoundingBox();
        geometry.center();
        const material = new THREE.MeshStandardMaterial({
          color: 0x4a90e2,
          metalness: 0.15,
          roughness: 0.55,
        });
        mesh = new THREE.Mesh(geometry, material);
        // Auto-fit camera
        const bbox = geometry.boundingBox!;
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        const dist = maxDim * 2.5;
        camera.position.set(dist, dist * 0.7, dist);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
        scene.add(mesh);
        setStatus("ready");
      } catch (e) {
        console.error(e);
        setError((e as Error).message ?? "Erreur de chargement du fichier 3D");
        setStatus("error");
      }
    }

    void load();

    function animate() {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const c = containerRef.current;
      if (!c) return;
      const w = c.clientWidth;
      const hh = c.clientHeight;
      renderer.setSize(w, hh);
      camera.aspect = w / hh;
      camera.updateProjectionMatrix();
    }
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObs.disconnect();
      controls.dispose();
      if (mesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [fichier.id, fichier.nomOriginal, height, stepNotSupported]);

  // Fullscreen handlers
  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
        background: "var(--bg-panel)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
          display: "flex",
          gap: 6,
        }}
      >
        <button
          type="button"
          onClick={() => downloadFichier(fichier.id, fichier.nomOriginal ?? "modele")}
          className="obtn ghost sm"
          title="Télécharger le fichier"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="obtn ghost sm"
          title={fullscreen ? "Quitter le plein-écran" : "Plein écran"}
        >
          {fullscreen ? "⤡" : "⤢"}
        </button>
      </div>

      {/* File label */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 2,
          padding: "2px 8px",
          background: "rgba(255,255,255,0.85)",
          border: "1px solid var(--line)",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ink-2)",
        }}
      >
        {fichier.nomOriginal ?? `Fichier #${fichier.id}`}
      </div>

      {stepNotSupported ? (
        <div
          style={{
            height: fullscreen ? "100vh" : height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
            padding: 24,
            textAlign: "center",
            color: "var(--ink-3)",
          }}
        >
          <div style={{ fontSize: 48 }}>📐</div>
          <p style={{ fontSize: 13, margin: 0, maxWidth: 360 }}>
            La prévisualisation des fichiers STEP nécessite un visualiseur
            CAD externe. Téléchargez le fichier puis ouvrez-le dans votre
            logiciel (FreeCAD, SolidWorks, OnShape…).
          </p>
          <button
            type="button"
            className="obtn"
            onClick={() => downloadFichier(fichier.id, fichier.nomOriginal ?? "modele")}
          >
            ↓ Télécharger {fichier.nomOriginal ?? "le fichier STEP"}
          </button>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: fullscreen ? "100vh" : height,
              background: "#f4f5f8",
            }}
          />
          {status === "loading" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(244,245,248,0.7)",
                fontSize: 13,
                color: "var(--ink-3)",
              }}
            >
              Chargement du modèle 3D…
            </div>
          )}
          {status === "error" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(244,245,248,0.85)",
                fontSize: 13,
                color: "var(--rose)",
                padding: 16,
                textAlign: "center",
              }}
            >
              {error ?? "Erreur de chargement"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
