// ═══ โหมดอ่านง่าย (readable theme) ═══
// ธีมมิ้นต์พาสเทลเดิมมีคอนทราสต์ต่ำมาก ผู้ใช้แจ้งว่า "ตาลาย มองไม่เห็น"
// ไฟล์เครื่องมือใน assets/ เป็น HTML ก้อนใหญ่ (ฝังตาราง ICD ไว้ในตัว) จึงไม่แก้สีในไฟล์
// แต่ทำเป็นชั้น (layer) ทับตอนเสิร์ฟแทน — แก้สีจุดเดียว มีผลทุกหน้า
//
// ทำ 2 อย่าง:
//   1) แทนที่โค้ดสีข้อความที่จางเกินไป (รวมถึงที่ JS สร้าง inline) ด้วยสีเข้มที่ผ่าน WCAG AA ≥ 4.5:1
//   2) แทรก CSS ชั้นอ่านง่าย (ตัวอักษรใหญ่ขึ้น ขอบชัดขึ้น โฟกัสเห็นชัด) ก่อนปิด </head>

import { readFile } from "fs/promises";
import path from "path";

// สีข้อความจาง → สีเข้มที่อ่านออกบนพื้นขาว/พื้นมิ้นต์อ่อน
const TEXT_COLOR_MAP = {
  "#428f87": "#256d65", // มิ้นต์เข้ม (ข้อความรอง)
  "#7fb5ae": "#2f7d75", // มิ้นต์จาง (หมายเหตุท้ายหน้า)
  "#14b8a6": "#0f766e", // teal สด (หัวข้อย่อย)
  "#94a3b8": "#57657a", // เทาอมฟ้าจาง (hint)
  "#a0aec0": "#57657a",
  "#718096": "#55637a",
  "#64748b": "#4b5a6b",
  "#22c55e": "#15803d", // เขียว
  "#16a34a": "#15803d",
  "#ef4444": "#b91c1c", // แดง
  "#dc2626": "#b91c1c",
  "#e53e3e": "#b91c1c",
  "#f59e0b": "#a45309", // เหลือง/ส้ม
  "#d97706": "#a45309",
  "#dd6b20": "#a45309",
  "#7c3aed": "#6d28d9", // ม่วง
};

// จับเฉพาะ *color:#xxxxxx (color / border-color / background-color) ไม่แตะ background: หรือ gradient
const COLOR_RE = /color:\s*(#[0-9a-fA-F]{6})/g;

function recolor(html) {
  return html.replace(COLOR_RE, (match, hex) => {
    const next = TEXT_COLOR_MAP[hex.toLowerCase()];
    return next ? match.replace(hex, next) : match;
  });
}

/**
 * อ่านไฟล์เครื่องมือจาก assets/ แล้วคืน Response ที่ทาธีมอ่านง่ายแล้ว
 * @param {string} htmlFile ชื่อไฟล์ HTML ใน assets/
 * @param {string} cssFile  ชื่อไฟล์ CSS ธีมอ่านง่ายใน assets/
 */
export async function serveReadableTool(htmlFile, cssFile = "readable-theme.css") {
  const assets = path.join(process.cwd(), "assets");
  const [rawHtml, css] = await Promise.all([
    readFile(path.join(assets, htmlFile), "utf8"),
    readFile(path.join(assets, cssFile), "utf8"),
  ]);

  const layer = `<style id="readable-theme">\n${css}\n</style>\n</head>`;
  const html = recolor(rawHtml).replace("</head>", layer);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
