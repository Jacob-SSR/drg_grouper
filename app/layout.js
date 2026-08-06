export const metadata = {
  title: "PPC Coding Tools — เช็ก DRG + Deny Code ก่อนส่งเบิก",
  description:
    "เครื่องมือช่วยงานเคลม: เช็ก DRG/RW และรหัสเสี่ยงโดนปฏิเสธ (Deny Code) จากข้อมูลจริงใน HOSxP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'Prompt', sans-serif" }}>{children}</body>
    </html>
  );
}
