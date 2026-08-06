// app/api/hosxp/cases/route.js
// ดึงเคสผู้ป่วยในที่จำหน่ายแล้วตามช่วงวันที่ เพื่อตรวจ DENY CODE
// ผลลัพธ์ถูกแตกเป็นคอลัมน์ hn / an / pdx / sdx1..10 / op1..5 / los / dchtype / rw
// ให้เข้ากับ column mapping ของหน้า Deny Code Checker (autoDetect จับได้เลย)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MAX_RANGE_DAYS = 366; // กันดึงข้ามช่วงยาวเกินจน DB หนัก

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const start = String(searchParams.get("start") || "").trim();
    const end = String(searchParams.get("end") || "").trim();
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(start) || !dateRe.test(end)) {
      return NextResponse.json(
        { error: "กรุณาระบุ start / end เป็น YYYY-MM-DD" },
        { status: 400 },
      );
    }
    const days = (new Date(end) - new Date(start)) / 86_400_000;
    if (days < 0) {
      return NextResponse.json(
        { error: "วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด" },
        { status: 400 },
      );
    }
    if (days > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: `ช่วงวันที่ต้องไม่เกิน ${MAX_RANGE_DAYS} วัน` },
        { status: 400 },
      );
    }

    const [rows] = await db.query(
      `SELECT i.an, i.hn, i.regdate, i.dchdate, i.dchtype, i.dchstts,
              i.adjrw AS rw,
              DATEDIFF(i.dchdate, i.regdate) AS los,
              (SELECT dg.icd10 FROM iptdiag dg
                WHERE dg.an = i.an AND dg.diagtype = '1' LIMIT 1)           AS pdx,
              (SELECT GROUP_CONCAT(dg.icd10 ORDER BY dg.diagtype SEPARATOR ',')
                 FROM iptdiag dg
                WHERE dg.an = i.an AND dg.diagtype <> '1')                  AS sdx,
              (SELECT GROUP_CONCAT(op.icd9 SEPARATOR ',')
                 FROM iptoprt op
                WHERE op.an = i.an AND op.icd9 IS NOT NULL AND op.icd9 <> '') AS ops
       FROM ipt i
       WHERE i.dchdate BETWEEN ? AND ?
       ORDER BY i.dchdate, i.an`,
      [start, end],
    );

    // แตก sdx / ops เป็นคอลัมน์แบน sdx1..sdx12, op1..op10
    const cases = rows.map((r) => {
      const sdxArr = (r.sdx ? String(r.sdx).split(",") : []).filter(Boolean);
      const opArr = (r.ops ? String(r.ops).split(",") : []).filter(Boolean);
      const row = { hn: r.hn, an: r.an, pdx: r.pdx || "" };
      for (let i = 0; i < 12; i++) row["sdx" + (i + 1)] = sdxArr[i] || "";
      for (let i = 0; i < 10; i++) row["op" + (i + 1)] = opArr[i] || "";
      row.los = r.los ?? "";
      // dchstts (สถานะจำหน่าย 1 หาย 2 ดีขึ้น 3 ไม่ดีขึ้น 4 ตาย 5 ส่งต่อ ...)
      // คือค่าที่กติกา DENY ใช้ — ส่งเป็นคอลัมน์ dchtype ของ pipeline เดิม
      row.dchtype = r.dchstts != null ? String(parseInt(r.dchstts, 10) || "") : "";
      row.rw = r.rw != null ? Number(r.rw) : "";
      row.dchdate = r.dchdate;
      return row;
    });

    return NextResponse.json({ count: cases.length, start, end, cases });
  } catch (err) {
    console.error("HOSxP cases error:", err);
    return NextResponse.json(
      { error: "ดึงข้อมูลจาก HOSxP ไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
