"use client";

import { useEffect, useState } from "react";

const Icon = ({ d, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);
const IC = {
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><path d="M16 14v4"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  steth: '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
};


// ── ธีมมิ้นต์พาสเทล ──
const mint = {
  bg: "#eef4f3",
  ink: "#0f3b37",
  soft: "#67c4bb",
  teal: "#0f766e",
  tealDark: "#0b5750",
  sub: "#35706a",
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
  background: "#ffffff",
  backdropFilter: "blur(6px)",
  color: mint.ink,
  borderRadius: 22,
  border: "2px solid #cfe4e1",
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
      <div style={{ width: 68, height: 68, borderRadius: 20, background: "#d6f2ee", color: "#0b5750", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon d={IC.activity} size={34} /></div>
      <h1 style={{ fontSize: 29, margin: "0 0 6px", fontWeight: 700 }}>
        สวัสดี{user ? ` คุณ${user.name}` : ""}
      </h1>
      <p style={{ color: mint.sub, margin: "0 0 30px", fontSize: 16.5, textAlign: "center" }}>
        วันนี้อยากตรวจอะไรก่อนส่งเบิกดี?
      </p>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <a
          href="/tools/drg"
          style={card}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#d6f2ee", color: "#0b5750", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={IC.calc} size={26} /></div>
          <h2 style={{ fontSize: 20, margin: "12px 0 6px", fontWeight: 700 }}>
            เช็ก DRG และค่า RW
          </h2>
          <p style={{ fontSize: 15, color: mint.sub, lineHeight: 1.75, margin: 0 }}>
            ใส่เลข AN แล้วระบบดึงข้อมูลจาก HOSxP มาให้เอง
            บอกกลุ่ม DRG ค่า RW โดยประมาณ พร้อมชี้จุดที่เสี่ยงถูกตัดยอด
          </p>
          <div style={{ marginTop: 14, color: mint.teal, fontSize: 15, fontWeight: 700 }}>
            เริ่มเช็กเลย →
          </div>
        </a>

        <a
          href="/tools/deny"
          style={card}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#d6f2ee", color: "#0b5750", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={IC.shield} size={26} /></div>
          <h2 style={{ fontSize: 20, margin: "12px 0 6px", fontWeight: 700 }}>
            ตรวจรหัสเสี่ยงโดนปฏิเสธ
          </h2>
          <p style={{ fontSize: 15, color: mint.sub, lineHeight: 1.75, margin: 0 }}>
            เลือกช่วงวันที่จำหน่าย ระบบดึงเคสจาก HOSxP มาตรวจให้ทั้งชุด
            ว่ามีรหัสไหนเสี่ยงโดน สปสช. ปฏิเสธบ้าง
          </p>
          <div style={{ marginTop: 14, color: mint.teal, fontSize: 15, fontWeight: 700 }}>
            เริ่มตรวจเลย →
          </div>
        </a>

        <a
          href="/tools/rw"
          style={card}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#d6f2ee", color: "#0b5750", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon d={IC.steth} size={26} /></div>
          <h2 style={{ fontSize: 20, margin: "12px 0 6px", fontWeight: 700 }}>
            ประเมิน RW โหมดแพทย์
          </h2>
          <p style={{ fontSize: 15, color: mint.sub, lineHeight: 1.75, margin: 0 }}>
            สำหรับแพทย์หน้างาน — พิมพ์ชื่อโรคเป็นไทยหรืออังกฤษได้เลย
            ระบบแปลงเป็น ICD-10 แล้วประเมิน DRG กับ RW ให้ทันที
          </p>
          <div style={{ marginTop: 14, color: mint.teal, fontSize: 15, fontWeight: 700 }}>
            เริ่มประเมินเลย →
          </div>
        </a>
      </div>

      <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 12 }}>
        {user && (
          <>
            <span style={{ fontSize: 14, color: mint.sub }}>
              เข้าใช้งานในชื่อ {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              style={{
                background: "#fff",
                border: `2px solid ${mint.soft}`,
                color: mint.tealDark,
                borderRadius: 999,
                padding: "6px 16px",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            >
              ออกจากระบบ
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: 13.5, color: "#35706a", marginTop: 26, textAlign: "center" }}>
        ตัวเลขทั้งหมดเป็นการประมาณเพื่อช่วยตรวจทานเท่านั้น ผลจริงยึดตามระบบของ สปสช.
      </p>
    </div>
  );
}
