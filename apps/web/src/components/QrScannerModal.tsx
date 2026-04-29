import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

type FacingMode = "environment" | "user";

export default function QrScannerModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const facingModeRef = useRef<FacingMode>("environment");
  const mountedRef = useRef(true);

  const handleScan = useCallback((text: string) => {
    const tryNavigate = (input: string) => {
      const materielMatch = input.match(/materiels\/(\d+)/);
      const maquetteMatch = input.match(/maquettes\/(\d+)/);
      if (materielMatch) {
        onClose();
        navigate(`/materiels/${materielMatch[1]}`);
        return true;
      }
      if (maquetteMatch) {
        onClose();
        navigate(`/maquettes/${maquetteMatch[1]}`);
        return true;
      }
      return false;
    };

    try {
      const url = new URL(text);
      if (tryNavigate(url.pathname)) return;
    } catch {
      if (tryNavigate(text)) return;
    }

    setError(`QR code non reconnu : ${text}`);
    setScanning(true);
    const scanner = scannerRef.current;
    if (!scanner) return;
    setTimeout(() => {
      if (!mountedRef.current) return;
      scanner
        .start(
          { facingMode: facingModeRef.current },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            setScanning(false);
            scanner.stop().catch(() => {});
            handleScan(decoded);
          },
          () => {},
        )
        .catch(() => {});
    }, 1500);
  }, [navigate, onClose]);

  useEffect(() => {
    mountedRef.current = true;
    const scannerId = "ogade-qr-reader";

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: facingModeRef.current },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanning(false);
          scanner.stop().catch(() => {});
          handleScan(decodedText);
        },
        () => {},
      )
      .catch((err: Error) => {
        if (!mountedRef.current) return;
        setError(
          err.message?.includes("Permission")
            ? "Accès à la caméra refusé. Autorisez l'accès dans les paramètres de votre navigateur."
            : "Impossible d'accéder à la caméra. Vérifiez qu'elle n'est pas utilisée par une autre application.",
        );
      });

    return () => {
      mountedRef.current = false;
      scanner.stop().catch(() => {});
      scanner.clear();
    };
  }, [handleScan]);

  async function switchCamera() {
    const scanner = scannerRef.current;
    if (!scanner) return;

    const newMode: FacingMode = facingModeRef.current === "environment" ? "user" : "environment";
    facingModeRef.current = newMode;
    setFacingMode(newMode);
    setError(null);

    try {
      await scanner.stop();
    } catch {}

    try {
      await scanner.start(
        { facingMode: newMode },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanning(false);
          scanner.stop().catch(() => {});
          handleScan(decodedText);
        },
        () => {},
      );
      setScanning(true);
    } catch {
      setError("Impossible de basculer la caméra.");
    }
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Scanner un QR code</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
              Pointez la caméra vers un QR code matériel ou maquette
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button"
              onClick={switchCamera}
              title={facingMode === "environment" ? "Caméra avant" : "Caméra arrière"}
              style={{
                appearance: "none", border: "none", background: "none",
                padding: 6, borderRadius: 8, color: "var(--ink-3)",
                cursor: "pointer", display: "flex",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-sunken)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h-3l-1.5-2h-3L7 4H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z" />
                <circle cx="10" cy="10" r="3" />
                <path d="M14.5 7.5l1 -1M14.5 7.5l-1 1" />
              </svg>
            </button>
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
        </div>

        {/* Scanner area — html5-qrcode renders video + canvas inside this div */}
        <div
          id="ogade-qr-reader"
          style={{
            width: "100%",
            minHeight: 300,
            background: "#000",
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
