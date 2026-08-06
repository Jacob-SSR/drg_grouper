// ─────────────────────────────────────────────────────────────────────────────
// DRG Grouper — Express server
// ระบบ auth ยกแบบมาจาก ppc-hos-10667 (Next.js) ทั้งชุด:
//   - login ตรวจกับตาราง ppchos.users (คอลัมน์ user / passweb / name / role)
//   - รองรับรหัสเก่าแบบ md5 → ตรวจผ่านแล้วอัปเกรดเป็น bcrypt อัตโนมัติ
//   - JWT ใส่ httpOnly cookie อายุ 8 ชั่วโมง
//   - rate limit สองชั้น (ตาม IP และตาม username)
//   - DENY BY DEFAULT: ทุกหน้า/ทุก API ต้อง login ยกเว้นที่ระบุไว้เท่านั้น
// ข้อมูลผู้ป่วยดึงจริงจากฐาน HOSxP (ipt / iptdiag / iptoprt / an_stat / patient)
// ─────────────────────────────────────────────────────────────────────────────
require("dotenv").config();

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const md5 = require("md5");
const mysql = require("mysql2/promise");

const { rateLimit, getClientIp, tooManyRequests } = require("./lib/rateLimit");

// ── ตรวจ env ให้ครบก่อนสตาร์ท (ยกแบบจาก lib/db.ts ของ ppc-hos-10667) ─────────
const requiredEnv = [
  "DB_HOST", // ฐาน HOSxP (ข้อมูลผู้ป่วย)
  "DB_HOST2", // ฐานที่มี ppchos.users (บัญชีผู้ใช้)
  "DB_PORT",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
  "JWT_SECRET",
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

// ── config ร่วมของทั้งสอง pool (db / db2) ────────────────────────────────────
const sharedConfig = {
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  charset: "tis620", // HOSxP ใช้ tis620 — อย่าเปลี่ยน

  // ⚠️ ความปลอดภัย: ห้ามตั้งเป็น true เด็ดขาด
  //    multipleStatements: true เปิดทาง stacked-query SQL injection
  multipleStatements: false,
};

const db = mysql.createPool({ host: process.env.DB_HOST, ...sharedConfig }); // HOSxP
const db2 = mysql.createPool({ host: process.env.DB_HOST2, ...sharedConfig }); // ppchos.users

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = Number(process.env.PORT || 3100);
const MINUTE = 60_000;

const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────────────
// Auth middleware — DENY BY DEFAULT (หลักการเดียวกับ proxy.ts ของ ppc-hos-10667)
// เปิด public เฉพาะ /login, /api/login, /api/logout, /api/me เท่านั้น
// route ใหม่ที่เพิ่มทีหลังจะถูกล็อกให้อัตโนมัติ ไม่ต้องมาแก้ไฟล์นี้
// ─────────────────────────────────────────────────────────────────────────────
const PUBLIC_PATHS = ["/api/login", "/api/logout", "/api/me", "/login", "/favicon.ico"];

function matchesAny(pathname, list) {
  return list.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function clearTokenCookie(res) {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0), path: "/" });
}

/** ปฏิเสธ: API ตอบ 401 JSON, หน้าเว็บ redirect ไป login */
function deny(req, res, hadBadToken) {
  if (hadBadToken) clearTokenCookie(res);
  if (req.path.startsWith("/api")) {
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบ" });
  }
  return res.redirect("/login");
}

app.use((req, res, next) => {
  if (matchesAny(req.path, PUBLIC_PATHS)) return next();

  const token = req.cookies.token;
  if (!token) return deny(req, res, false);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // role มาตรฐานทั้งระบบใช้ "ตัวพิมพ์ใหญ่" เสมอ (USER, IT, ADMIN, ...)
    req.user = {
      username: payload.username,
      role: String(payload.role || "USER").toUpperCase(),
    };
    return next();
  } catch {
    // token เสีย/หมดอายุ → เคลียร์ cookie แล้วส่งไป login
    return deny(req, res, true);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES (โค้ดตรรกะเดียวกับ app/api/login, logout, me, change-password
// ของ ppc-hos-10667)
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/login", async (req, res) => {
  try {
    const ip = getClientIp(req);

    // ── ชั้นที่ 1: จำกัดตาม IP — 10 ครั้ง / 5 นาที ──
    const ipLimit = rateLimit(`login:ip:${ip}`, 10, 5 * MINUTE);
    if (!ipLimit.ok) {
      return tooManyRequests(res, ipLimit, "พยายาม login บ่อยเกินไป กรุณารอสักครู่");
    }

    const username = req.body?.username?.trim();
    const password = req.body?.password?.trim();
    if (!username || !password) {
      return res.status(400).json({ message: "Invalid" });
    }

    // ── ชั้นที่ 2: จำกัดตาม username — 5 ครั้ง / 15 นาที ──
    const userLimit = rateLimit(`login:user:${username.toLowerCase()}`, 5, 15 * MINUTE);
    if (!userLimit.ok) {
      return tooManyRequests(
        res,
        userLimit,
        "บัญชีนี้ถูกพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่",
      );
    }

    const [rows] = await db2.query(
      "SELECT `user`, passweb, role FROM ppchos.users WHERE `user` = ? LIMIT 1",
      [username],
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid" });

    let isValid = false;
    if (user.passweb.startsWith("$2b$") || user.passweb.startsWith("$2a$")) {
      isValid = await bcrypt.compare(password, user.passweb);
    } else {
      // รหัสเก่าเก็บเป็น md5 → ตรวจผ่านแล้วอัปเกรดเป็น bcrypt ทันที
      isValid = md5(password).toLowerCase() === user.passweb.toLowerCase();
      if (isValid) {
        const newHash = await bcrypt.hash(password, 12);
        await db2.query("UPDATE ppchos.users SET passweb = ? WHERE `user` = ?", [
          newHash,
          username,
        ]);
      }
    }
    if (!isValid) return res.status(401).json({ message: "Invalid" });

    // คนที่ยังไม่ได้ตั้ง role → ถือเป็น "USER" ธรรมดา (ต้อง fallback เสมอ)
    const role = (user.role ?? "USER").toUpperCase();

    const token = jwt.sign({ username: user.user, role }, JWT_SECRET, {
      expiresIn: "8h",
    });

    const secureCookie = process.env.COOKIE_SECURE === "true";
    res.cookie("token", token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8 * 1000, // express ใช้หน่วย ms
    });
    return res.json({ message: "Login success", role });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/logout", (req, res) => {
  clearTokenCookie(res);
  return res.json({ message: "Logged out" });
});

const GUEST = { user: { username: "Guest", role: "GUEST", name: "Guest" } };

app.get("/api/me", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json(GUEST);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // ดึง role และ name จาก DB (เป็นแหล่งความจริง — เผื่อ role เปลี่ยนหลัง login)
    const [rows] = await db2.query(
      "SELECT `user`, name, role FROM ppchos.users WHERE `user` = ? LIMIT 1",
      [decoded.username],
    );
    const user = rows[0];
    return res.json({
      user: {
        username: decoded.username,
        role: (user?.role ?? "USER").toUpperCase(),
        name: user?.name ?? decoded.username,
      },
    });
  } catch {
    return res.json(GUEST);
  }
});

app.post("/api/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    const [rows] = await db2.query(
      "SELECT `user`, passweb FROM ppchos.users WHERE `user` = ? LIMIT 1",
      [req.user.username],
    );
    if (!rows.length) return res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });

    const isValid = await bcrypt.compare(currentPassword, rows[0].passweb);
    if (!isValid) {
      return res.status(400).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db2.query("UPDATE ppchos.users SET passweb = ? WHERE `user` = ?", [
      newHash,
      req.user.username,
    ]);
    return res.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HOSxP DATA — ดึงข้อมูลผู้ป่วยในจริงตาม AN เพื่อเติมฟอร์ม DRG อัตโนมัติ
//   ipt      = ทะเบียน admit (an, hn, regdate, dchdate, dchstts, adjrw)
//   iptdiag  = การวินิจฉัย ICD-10 (diagtype '1' = PDx, ที่เหลือ = SDx)
//   iptoprt  = หัตถการ ICD-9-CM
//   an_stat  = สถิติราย admission (อายุ ฯลฯ)
//   patient  = ข้อมูลผู้ป่วย (เพศ ชื่อ)
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/hosxp/patient", async (req, res) => {
  try {
    const an = String(req.query.an || "").trim();
    if (!an || !/^[0-9]{1,15}$/.test(an)) {
      return res.status(400).json({ error: "กรุณาระบุ AN เป็นตัวเลข" });
    }

    const [iptRows] = await db.query(
      `SELECT i.an, i.hn, i.regdate, i.dchdate, i.dchtype, i.dchstts, i.adjrw,
              DATEDIFF(IFNULL(i.dchdate, CURDATE()), i.regdate) AS los,
              s.age_y, p.sex,
              CONCAT(IFNULL(p.pname,''), IFNULL(p.fname,''), ' ', IFNULL(p.lname,'')) AS ptname
       FROM ipt i
       LEFT JOIN an_stat s ON s.an = i.an
       LEFT JOIN patient p ON p.hn = i.hn
       WHERE i.an = ?
       LIMIT 1`,
      [an],
    );
    if (!iptRows.length) {
      return res.status(404).json({ error: `ไม่พบ AN ${an} ในฐาน HOSxP` });
    }
    const ipt = iptRows[0];

    // การวินิจฉัย — diagtype '1' = โรคหลัก (PDx), นอกนั้นเป็นโรคร่วม/แทรก/สาเหตุภายนอก
    const [diagRows] = await db.query(
      "SELECT icd10, diagtype FROM iptdiag WHERE an = ? ORDER BY diagtype, icd10",
      [an],
    );
    const pdx = diagRows.find((d) => String(d.diagtype) === "1")?.icd10 ?? "";
    const sdx = diagRows
      .filter((d) => String(d.diagtype) !== "1" && d.icd10)
      .map((d) => d.icd10);

    // หัตถการ ICD-9 — หลัก: iptoprt / สำรอง: opitemrece + ipt_oper_code
    // (บาง site ลงหัตถการผ่านรายการค่ารักษาแทน — วิธีเดียวกับรายงาน
    //  medical-coding ใน ppc-hos-10667)
    let ops = [];
    try {
      const [opRows] = await db.query(
        "SELECT icd9 FROM iptoprt WHERE an = ? AND icd9 IS NOT NULL AND icd9 <> ''",
        [an],
      );
      ops = opRows.map((r) => r.icd9);
    } catch {
      /* ตารางไม่มีใน site นี้ → ใช้ทางสำรองข้างล่าง */
    }
    if (!ops.length) {
      try {
        const [opRows2] = await db.query(
          `SELECT DISTINCT c.icd9cm AS icd9
           FROM opitemrece o
           JOIN ipt_oper_code c ON c.icode = o.icode
           WHERE o.an = ? AND c.icd9cm IS NOT NULL AND c.icd9cm <> ''`,
          [an],
        );
        ops = opRows2.map((r) => r.icd9);
      } catch {
        /* ไม่มีทั้งสองทาง → ปล่อยว่างให้กรอกเอง */
      }
    }

    return res.json({
      an: ipt.an,
      hn: ipt.hn,
      ptname: ipt.ptname?.trim() || null,
      sex: String(ipt.sex ?? "") === "1" ? "ชาย" : String(ipt.sex ?? "") === "2" ? "หญิง" : null,
      age: ipt.age_y ?? null,
      los: ipt.los ?? null,
      regdate: ipt.regdate,
      dchdate: ipt.dchdate,
      // dchstts ของ HOSxP ตรงกับตัวเลือกในฟอร์ม (1 หาย 2 ดีขึ้น 3 ไม่ดีขึ้น
      // 4 ตาย 5 ส่งต่อ ...) — ส่งทั้งคู่ให้หน้าเว็บเลือกใช้
      dchstts: ipt.dchstts != null ? String(parseInt(ipt.dchstts, 10) || "") : "",
      dchtype: ipt.dchtype ?? null,
      adjrw: ipt.adjrw != null ? Number(ipt.adjrw) : null,
      pdx,
      sdx,
      ops,
    });
  } catch (err) {
    console.error("HOSxP patient error:", err);
    return res.status(500).json({ error: "ดึงข้อมูลจาก HOSxP ไม่สำเร็จ" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGES
// ─────────────────────────────────────────────────────────────────────────────
app.get("/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`DRG Grouper running at http://localhost:${PORT}`);
});
