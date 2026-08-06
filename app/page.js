"use client";

import { useEffect, useState } from "react";

// ── ธีมมิ้นต์พาสเทล ──
const mint = {
  bg: "linear-gradient(160deg,#f0fdfa 0%,#ecfdf5 45%,#f0f9ff 100%)",
  ink: "#134e4a",
  soft: "#5eead4",
  teal: "#0d9488",
  tealDark: "#0f766e",
  sub: "#428f87",
};

const wrap = {
  minHeight: "100vh",
  fontFamily: "'Prompt', sans-serif",
  background: mint.bg,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  color: mint.ink,
};

const card = {
  background: "rgba(255,255,255,.85)",
  backdropFilter: "blur(6px)",
  color: mint.ink,
  borderRadius: 22,
  border: "1.5px solid #ccfbf1",
  padding: "30px 28px",
  width: 330,
  textDecoration: "none",
  boxShadow: "0 12px 32px rgba(13,148,136,.12)",
  display: "block",
  transition: "transform .15s, box-shadow .15s",
};

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role === "GUEST") {
          location.href = "/login";
          return;
        }
        setUser(d.user);
      })
      .catch(() => {});
  }, []);

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    location.href = "/login";
  }

  return (
    <div style={wrap}>
      <div style={{ fontSize: 52, marginBottom: 4 }}>🌿</div>
      <h1 style={{ fontSize: 28, margin: "0 0 6px", fontWeight: 600 }}>
        สวัสดี{user ? ` คุณ${user.name}` : ""} 👋
      </h1>
      <p style={{ color: mint.sub, margin: "0 0 30px", fontSize: 15, textAlign: "center" }}>
        วันนี้อยากตรวจอะไรก่อนส่งเบิกดี?
      </p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <a
          href="/tools/drg"
          style={card}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          <div style={{ fontSize: 38 }}>🧮</div>
          <h2 style={{ fontSize: 19, margin: "12px 0 6px", fontWeight: 600 }}>
            เช็ก DRG และค่า RW
          </h2>
          <p style={{ fontSize: 13.5, color: mint.sub, lineHeight: 1.7, margin: 0 }}>
            ใส่เลข AN แล้วระบบดึงข้อมูลจาก HOSxP มาให้เอง
            บอกกลุ่ม DRG ค่า RW โดยประมาณ พร้อมชี้จุดที่เสี่ยงถูกตัดยอด
          </p>
          <div style={{ marginTop: 14, color: mint.teal, fontSize: 14, fontWeight: 600 }}>
            เริ่มเช็กเลย →
          </div>
        </a>

        <a
          href="/tools/deny"
          style={card}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          <div style={{ fontSize: 38 }}>🔍</div>
          <h2 style={{ fontSize: 19, margin: "12px 0 6px", fontWeight: 600 }}>
            ตรวจรหัสเสี่ยงโดนปฏิเสธ
          </h2>
          <p style={{ fontSize: 13.5, color: mint.sub, lineHeight: 1.7, margin: 0 }}>
            เลือกช่วงวันที่จำหน่าย ระบบดึงเคสจาก HOSxP มาตรวจให้ทั้งชุด
            ว่ามีรหัสไหนเสี่ยงโดน สปสช. ปฏิเสธบ้าง
          </p>
          <div style={{ marginTop: 14, color: mint.teal, fontSize: 14, fontWeight: 600 }}>
            เริ่มตรวจเลย →
          </div>
        </a>
      </div>

      <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 12 }}>
        {user && (
          <>
            <span style={{ fontSize: 13, color: mint.sub }}>
              เข้าใช้งานในชื่อ {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              style={{
                background: "#fff",
                border: `1.5px solid ${mint.soft}`,
                color: mint.tealDark,
                borderRadius: 999,
                padding: "6px 16px",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              ออกจากระบบ
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#7fb5ae", marginTop: 26, textAlign: "center" }}>
        ตัวเลขทั้งหมดเป็นการประมาณเพื่อช่วยตรวจทานเท่านั้น ผลจริงยึดตามระบบของ สปสช.
      </p>
    </div>
  );
}
