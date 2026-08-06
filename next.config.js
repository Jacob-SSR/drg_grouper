/** @type {import('next').NextConfig} */
const nextConfig = {
  // สร้าง .next/standalone สำหรับรันใน Docker (image เล็ก ไม่ต้องหอบ node_modules ทั้งก้อน)
  output: "standalone",
};

module.exports = nextConfig;
