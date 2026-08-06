-- ═══════════════════════════════════════════════════════════════════════════
-- SQL ที่แอปใช้จริง (อ้างอิง server.js) — ฐาน HOSxP + ฐาน auth (ppchos)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── AUTH: ตารางบัญชีผู้ใช้ (แบบเดียวกับ ppc-hos-10667) ──────────────────────
-- ใช้ตาราง ppchos.users ที่มีอยู่แล้ว: `user` / passweb (md5 หรือ bcrypt) /
-- name / role — ถ้ายังไม่มี ให้สร้างตามนี้
CREATE TABLE IF NOT EXISTS ppchos.users (
  `user`  VARCHAR(50)  NOT NULL PRIMARY KEY,
  passweb VARCHAR(100) NOT NULL COMMENT 'md5 (เก่า) หรือ bcrypt — ระบบอัปเกรดให้อัตโนมัติตอน login สำเร็จ',
  name    VARCHAR(150) NULL,
  role    VARCHAR(30)  NULL COMMENT 'USER / DOCTOR / NURSE / ADMIN / IT ... (NULL = USER)'
);

-- ตัวอย่างตั้ง role (ดู docs/sql/assign_roles.sql ของ ppc-hos-10667 ประกอบ)
-- UPDATE ppchos.users SET role = 'DOCTOR' WHERE `user` IN ('...');

-- ── DATA: ดึงข้อมูล admission ตาม AN (GET /api/hosxp/patient?an=) ───────────
SELECT i.an, i.hn, i.regdate, i.dchdate, i.dchtype, i.dchstts, i.adjrw,
       DATEDIFF(IFNULL(i.dchdate, CURDATE()), i.regdate) AS los,
       s.age_y, p.sex,
       CONCAT(IFNULL(p.pname,''), IFNULL(p.fname,''), ' ', IFNULL(p.lname,'')) AS ptname
FROM ipt i
LEFT JOIN an_stat s ON s.an = i.an
LEFT JOIN patient p ON p.hn = i.hn
WHERE i.an = ?
LIMIT 1;

-- การวินิจฉัย: diagtype '1' = PDx, ที่เหลือ ('2' โรคร่วม, '3' โรคแทรก,
-- '4' อื่นๆ, '5' สาเหตุภายนอก) = SDx
SELECT icd10, diagtype FROM iptdiag WHERE an = ? ORDER BY diagtype, icd10;

-- หัตถการ ICD-9-CM (ทางหลัก)
SELECT icd9 FROM iptoprt WHERE an = ? AND icd9 IS NOT NULL AND icd9 <> '';

-- หัตถการ (ทางสำรอง — บาง site ลงผ่านรายการค่ารักษา เหมือนรายงาน
-- medical-coding ของ ppc-hos-10667)
SELECT DISTINCT c.icd9cm AS icd9
FROM opitemrece o
JOIN ipt_oper_code c ON c.icode = o.icode
WHERE o.an = ? AND c.icd9cm IS NOT NULL AND c.icd9cm <> '';

-- ── PERFORMANCE: index ที่ควรมี (HOSxP มาตรฐานมักมีอยู่แล้ว — เช็คด้วย SHOW INDEX) ──
-- ทำให้ query ช่วงวันที่ของ Deny Code เร็วขึ้นมากถ้ายังไม่มี
-- SHOW INDEX FROM ipt WHERE Column_name = 'dchdate';
-- CREATE INDEX idx_ipt_dchdate ON ipt (dchdate);
-- SHOW INDEX FROM iptdiag WHERE Column_name = 'an';
-- CREATE INDEX idx_iptdiag_an ON iptdiag (an);
-- SHOW INDEX FROM iptoprt WHERE Column_name = 'an';
-- CREATE INDEX idx_iptoprt_an ON iptoprt (an);
