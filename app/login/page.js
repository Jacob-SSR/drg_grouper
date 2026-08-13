"use client";

import { useState } from "react";

const Icon = ({ d, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);
const IC = { activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' };


const mint = {
  bg: "#eef4f3",
  ink: "#0f3b37",
  soft: "#67c4bb",
  teal: "#0f766e",
  tealDark: "#0b5750",
  sub: "#35706a",
};

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: mint.bg,
    fontFamily: "'Prompt', sans-serif",
    padding: 16,
  },
  card: {
    background: "#ffffff",
    borderRadius: 22,
    border: "2px solid #cfe4e1",
    boxShadow: "0 12px 40px rgba(13,148,136,.14)",
    padding: "38px 34px",
    width: "100%",
    maxWidth: 400,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "2px solid #a9cfca",
    borderRadius: 12,
    fontSize: 16,
    outline: "none",
    marginBottom: 16,
    fontFamily: "inherit",
    background: "#fdfefe",
    color: mint.ink,
  },
  btn: {
    width: "100%",
    padding: 13,
    border: "none",
    borderRadius: 12,
    background: mint.teal,
    color: "#fff",
    fontSize: 16.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  label: {
    display: "block",
    fontSize: 14.5,
    fontWeight: 600,
    color: mint.tealDark,
    marginBottom: 6,
  },
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        location.href = "/";
        return;
      }
      setError(
        r.status === 429
          ? data.error || "ลองบ่อยไปนิดนึง พักสักครู่แล้วลองใหม่นะ"
          : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง ลองอีกครั้งนะ",
      );
    } catch {
      setError("ต่อเซิร์ฟเวอร์ไม่ติด ลองใหม่อีกครั้งนะ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <form style={styles.card} onSubmit={submit}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><div style={{ width: 60, height: 60, borderRadius: 18, background: "#d6f2ee", color: "#0b5750", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={IC.activity} size={30} /></div></div>
        <h1
          style={{
            textAlign: "center",
            fontSize: 23,
            color: mint.ink,
            margin: "0 0 4px",
            fontWeight: 600,
          }}
        >
          ยินดีต้อนรับกลับมา
        </h1>
        <div style={{ textAlign: "center", fontSize: 15, color: mint.sub, marginBottom: 26 }}>
          เข้าสู่ระบบก่อน แล้วไปเช็ก DRG กับ Deny Code กันเลย
        </div>
        {error && (
          <div
            style={{
              background: "#fff1f2",
              color: "#a4123a",
              border: "1px solid #fecdd3",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14.5,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}
        <label style={styles.label} htmlFor="username">ชื่อผู้ใช้</label>
        <input
          id="username"
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          autoFocus
        />
        <label style={styles.label} htmlFor="password">รหัสผ่าน</label>
        <input
          id="password"
          type="password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button style={{ ...styles.btn, opacity: busy ? 0.6 : 1 }} disabled={busy} type="submit">
          {busy ? "แป๊บนึงนะ กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
        </button>
        <div style={{ textAlign: "center", fontSize: 13.5, color: "#35706a", marginTop: 18 }}>
          ใช้บัญชีเดียวกับระบบรายงานของโรงพยาบาลได้เลย ไม่ต้องสมัครใหม่
        </div>
      </form>
    </div>
  );
}
