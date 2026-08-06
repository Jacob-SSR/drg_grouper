// เสิร์ฟหน้า Deny Code Checker (vanilla HTML+JS ตัวเต็ม) จาก assets/
// ผ่าน route handler เพื่อให้ proxy.js ล็อกด้วย auth ได้
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "assets", "deny_code_checker.html"),
    "utf8",
  );
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
