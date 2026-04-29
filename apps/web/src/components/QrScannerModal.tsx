import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScannerModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const scannerId = "ogade-qr-reader";
    let div = document.getElementById(scannerId);
    if (!div) {
      div = document.createElement("div");
      div.id = scannerId;
      containerRef.current.appendChild(div);
    }

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanning(false);
          scanner.stop().catch(() => {});
          handleScan(decodedText);
        },
        () => {},
      )
      .catch((err: Error) => {
        setError(
          err.message?.includes("Permission")
            ? "Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur."
            : "Impossible d'accéder à la caméra. Vérifiez qu'elle n'est pas utilisée par une autre application.",
        );
      });

    return () => {
      scanner.stop().catch(() => {});
      scanner.clear();
    };
  }, []);

  function handleScan(text: string) {
    try {
      const url = new URL(text);
      const path = url.pathname;

      const materielMatch = path.match(/\/materiels\/(\d+)/);
      const maquetteMatch = path.match(/\/maquettes\/(\d+)/);

      if (materielMatch) {
        onClose();
        navigate(`/materiels/${materielMatch[1]}`);
        return;
      }
      if (maquetteMatch) {
        onClose();
        navigate(`/maquettes/${maquetteMatch[1]}`);
        return;
      }

      setError(`QR code non reconnu : ${text}`);
      setScanning(true);
      restartScanner();
    } catch {
      const materielMatch = text.match(/materiels\/(\d+)/);
      const maquetteMatch = text.match(/maquettes\/(\d+)/);

      if (materielMatch) {
        onClose();
        navigate(`/materiels/${materielMatch[1]}`);
        return;
      }
      if (maquetteMatch) {
        onClose();
        navigate(`/maquettes/${maquetteMatch[1]}`);
        return;
      }

      setError(`QR code non reconnu : ${text}`);
      setScanning(true);
      restartScanner();
    }
  }

  function restartScanner() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    setTimeout(() => {
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setScanning(false);
            scanner.stop().catch(() => {});
            handleScan(decodedText);
          },
          () => {},
        )
        .catch(() => {});
    }, 1500);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--bg-panel)",
          borderRadius: 16,
          width: "min(420px, 90vw)",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          animation: "modalin 0.2s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Scanner un QR code</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
              Pointez la caméra vers un QR code matériel ou maquette
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              appearance: "none", border: "none", background: "none",
              padding: 6, borderRadius: 8, color: "var(--ink-3)",
              cursor: "pointer", display: "flex",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-sunken)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {/* Scanner area */}
        <div
          ref={containerRef}
          style={{
            padding: "0 20px",
            minHeight: 300,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        />

        {/* Status */}
        <div style={{ padding: "12px 20px 20px", textAlign: "center" }}>
          {error ? (
            <div
              style={{
                background: "var(--rose-soft)",
                border: "1px solid color-mix(in oklch, var(--rose) 30%, transparent)",
                borderRadius: 8, padding: "10px 14px",
              }}
            >
              <p style={{ fontSize: 12.5, color: "var(--rose)", margin: 0 }}>{error}</p>
            </div>
          ) : scanning ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div
                style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid var(--line)", borderTopColor: "var(--accent)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>En attente d'un QR code...</span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--emerald)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.17 10.83l3.33 3.34 8.33-6.67" />
              </svg>
              <span style={{ fontSize: 12.5, color: "var(--emerald)", fontWeight: 500 }}>QR code détecté ! Redirection...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
