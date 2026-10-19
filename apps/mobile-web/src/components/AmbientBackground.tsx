// Soft pastel washes behind every page — one tint per app family color.
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ background: "var(--bg)" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(40% 35% at 85% 8%, rgb(255 122 168 / 0.16), transparent 70%), radial-gradient(35% 30% at 8% 30%, rgb(95 211 165 / 0.12), transparent 70%), radial-gradient(45% 35% at 70% 95%, rgb(255 201 74 / 0.14), transparent 70%)",
        }}
      />
    </div>
  );
}
