# PPC Coding Tools — DRG Grouper + Deny Code Checker

โปรเจคเดียวรวมเครื่องมือ Coding/เคลม 2 ตัว (ไม่ต้องสลับแอปไปมา):

| หน้า | เครื่องมือ | ทำอะไร |
|---|---|---|
| `/tools/drg` | 🧮 **DRG Grouper จำลอง** | ประมาณการ MDC · DRG · RW · CC/MCC + แจ้งเตือน DENY CODE — กรอก AN แล้วดึง PDx/SDx/หัตถการ/LOS จริงจาก HOSxP มาเติมฟอร์มอัตโนมัติ |
| `/tools/deny` | 🔍 **Deny Code Checker** | ตรวจความเสี่ยง DENY CODE ก่อนส่งเบิก สปสช. — ดึงเคสจำหน่ายตามช่วงวันที่จาก HOSxP ตรวจทันที (หรืออัปโหลด Excel/CSV แบบเดิม) |

สร้างด้วย **Next.js** โครงเดียวกับ ppc-hos-10667 และใช้**ระบบ auth ชุดเดียวกัน**:

- 🔐 login ด้วยบัญชี `ppchos.users` (คอลัมน์ `user`/`passweb`/`name`/`role`) —
  รหัส md5 เก่าถูกอัปเกรดเป็น bcrypt อัตโนมัติเมื่อ login สำเร็จ
- JWT httpOnly cookie อายุ 8 ชม. + rate limit 2 ชั้น (10 ครั้ง/5 นาทีต่อ IP,
  5 ครั้ง/15 นาทีต่อ username)
- `proxy.js` ล็อกทุกหน้า/ทุก API แบบ **deny by default** — route ใหม่ถูกล็อกอัตโนมัติ
- `/api/change-password` เปลี่ยนรหัสผ่านได้เอง

## รันด้วย Docker

```bash
# 1) เตรียม env สำหรับ production (ใส่ IP ฐาน HOSxP + JWT_SECRET จริง)
cp .env.example .env.production

# 2) build + รัน
docker compose up -d --build

# เปิด http://<เครื่องนี้>:3500
```

หมายเหตุ:

- `next build` ใน container อ่านค่าจาก `.env.production` — ไม่มีไฟล์นี้ build จะล้ม
  (ไฟล์นี้ไม่ติดเข้า image สุดท้าย ใช้เป็น `env_file` ตอน runtime ผ่าน compose)
- ถ้า MySQL HOSxP รันบนเครื่องเดียวกับ Docker ให้ใช้ `DB_HOST=host.docker.internal`
  (compose ตั้ง `host-gateway` ให้แล้ว) — ถ้าอยู่คนละเครื่องในวง LAN ใส่ IP จริงได้เลย
- อัปเดตเวอร์ชัน: `git pull` แล้ว `docker compose up -d --build` ซ้ำ (พอร์ตเข้าใช้: 3500)

## ติดตั้งแบบไม่ใช้ Docker

```bash
npm install
cp .env.example .env   # แก้ค่าเชื่อมต่อ DB + JWT_SECRET
npm run build
npm start              # เปิด http://localhost:3000
```

## Environment variables

| ตัวแปร | ความหมาย |
|---|---|
| `DB_HOST` | เซิร์ฟเวอร์ HOSxP (ข้อมูลผู้ป่วย `ipt`, `iptdiag`, `iptoprt`, `an_stat`, `patient`) |
| `DB_HOST2` | เซิร์ฟเวอร์ที่มี schema `ppchos` (ตาราง users) — เครื่องเดียวกันได้ |
| `DB_PORT` / `DB_USER` / `DB_PASS` / `DB_NAME` | ค่าเชื่อมต่อ MySQL (charset `tis620`) |
| `JWT_SECRET` | secret สำหรับเซ็น JWT (`openssl rand -hex 32`) |
| `COOKIE_SECURE` | `true` เมื่อเสิร์ฟผ่าน https |

## API ข้อมูลจริงจาก HOSxP

- `GET /api/hosxp/patient?an=680001234` — ข้อมูล admission ราย AN
  (PDx, SDx, หัตถการ ICD-9, อายุ, เพศ, LOS, สถานะจำหน่าย, AdjRW จริงในฐาน)
- `GET /api/hosxp/cases?start=2026-07-01&end=2026-07-31` — เคสจำหน่ายทั้งช่วง
  แตกคอลัมน์พร้อมป้อนเข้าตัวตรวจ DENY CODE

SQL ทั้งหมดดูได้ที่ [`docs/sql/hosxp_queries.sql`](docs/sql/hosxp_queries.sql)

> ⚠️ ค่า RW / ผลตรวจเป็นเครื่องมือช่วยคัดกรองเพื่อการศึกษา/ทบทวนก่อนส่งเบิกเท่านั้น
> ไม่ใช่ผลจาก Thai DRG Grouper อย่างเป็นทางการ
