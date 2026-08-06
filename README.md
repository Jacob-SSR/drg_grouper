# DRG Grouper จำลอง + แจ้งเตือน DENY CODE

เว็บแอปประมาณการ MDC · DRG · RW · CC/MCC พร้อมแจ้งเตือนความเสี่ยง DENY CODE
**ดึงข้อมูลผู้ป่วยจริงจากฐาน HOSxP ตาม AN** และมี**ระบบ login แบบเดียวกับ
ppc-hos-10667** (ตาราง `ppchos.users`)

## ฟีเจอร์

- 🔐 **Auth เหมือน ppc-hos-10667**: login ด้วยบัญชี `ppchos.users`
  (รหัส md5 เก่าจะถูกอัปเกรดเป็น bcrypt อัตโนมัติเมื่อ login สำเร็จ),
  JWT httpOnly cookie อายุ 8 ชม., rate limit 2 ชั้น (IP + username),
  ทุกหน้า/API ถูกล็อกแบบ **deny by default**
- 📥 **ข้อมูลจริงจาก HOSxP**: กรอก AN แล้วระบบเติม PDx / SDx / หัตถการ /
  อายุ / LOS / สถานะจำหน่าย ให้อัตโนมัติ (ตาราง `ipt`, `iptdiag`, `iptoprt`,
  `an_stat`, `patient`) พร้อมโชว์ AdjRW จริงในฐานเทียบกับค่าประมาณการ
- 🧮 คำนวณ DRG/RW ประมาณการ + แจ้งเตือน DENY CODE (ยังกรอกมือได้ตามเดิม)

## ติดตั้ง

```bash
npm install
cp .env.example .env   # แก้ค่าเชื่อมต่อ DB + JWT_SECRET
npm start              # เปิด http://localhost:3100
```

## Environment variables

| ตัวแปร | ความหมาย |
|---|---|
| `DB_HOST` | เซิร์ฟเวอร์ HOSxP (ข้อมูลผู้ป่วย) |
| `DB_HOST2` | เซิร์ฟเวอร์ที่มี schema `ppchos` (ตาราง users) — เครื่องเดียวกันได้ |
| `DB_PORT` / `DB_USER` / `DB_PASS` / `DB_NAME` | ค่าเชื่อมต่อ MySQL (charset `tis620`) |
| `JWT_SECRET` | secret สำหรับเซ็น JWT (`openssl rand -hex 32`) |
| `COOKIE_SECURE` | `true` เมื่อเสิร์ฟผ่าน https |
| `PORT` | พอร์ตเว็บ (default 3100) |

SQL ที่ใช้ทั้งหมดดูได้ที่ [`docs/sql/hosxp_queries.sql`](docs/sql/hosxp_queries.sql)

> ⚠️ ค่า RW เป็นประมาณการเพื่อการศึกษาเท่านั้น — ไม่ใช่ผลจาก Thai DRG Grouper อย่างเป็นทางการ
