// app/api/hosxp/patient/route.js
// ดึงข้อมูล admission จริงจาก HOSxP ตาม AN เพื่อเติมฟอร์ม DRG อัตโนมัติ
//   ipt      = ทะเบียน admit (an, hn, regdate, dchdate, dchstts, adjrw)
//   iptdiag  = การวินิจฉัย ICD-10 (diagtype '1' = PDx, ที่เหลือ = SDx)
//   iptoprt  = หัตถการ ICD-9-CM
//   an_stat  = สถิติราย admission (อายุ ฯลฯ)
//   patient  = ข้อมูลผู้ป่วย (เพศ ชื่อ)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const an = String(searchParams.get("an") || "").trim();
    if (!an || !/^[0-9]{1,15}$/.test(an)) {
      return NextResponse.json(
        { error: "กรุณาระบุ AN เป็นตัวเลข" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: `ไม่พบ AN ${an} ในฐาน HOSxP` },
        { status: 404 },
      );
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

    const sexStr = String(ipt.sex ?? "");
    return NextResponse.json({
      an: ipt.an,
      hn: ipt.hn,
      ptname: ipt.ptname?.trim() || null,
      sex: sexStr === "1" ? "ชาย" : sexStr === "2" ? "หญิง" : null,
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
    return NextResponse.json(
      { error: "ดึงข้อมูลจาก HOSxP ไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
