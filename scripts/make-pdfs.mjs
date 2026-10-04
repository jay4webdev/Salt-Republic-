import { mkdirSync, writeFileSync } from "node:fs";

function buildPdf(lines) {
  const objects = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>"); // 1
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"); // 2

  const leading = 26;
  const startY = 720;
  const textLines = lines
    .map((l, i) => {
      const size = l.size ?? 13;
      const escaped = l.text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      return `BT /F1 ${size} Tf 72 ${startY - i * leading} Td (${escaped}) Tj ET`;
    })
    .join("\n");
  const stream = `${textLines}\n`;
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`
  ); // 3
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"); // 4
  objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}endstream`); // 5

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  const count = objects.length + 1;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `${xref}trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

const common = [
  { text: "SALT REPUBLIC", size: 26 },
  { text: "PRIVATE YACHT EXPERIENCES - MALDIVES", size: 12 },
  { text: " ", size: 13 },
  { text: "PLACEHOLDER DOCUMENT", size: 16 },
  { text: " ", size: 13 },
  { text: "This file is a clearly marked placeholder created so the website download", size: 12 },
  { text: "buttons are fully functional before the official package is supplied.", size: 12 },
  { text: " ", size: 13 },
  { text: "ACTION REQUIRED", size: 14 },
  { text: "Replace this file with the official Salt Republic pricing package PDF.", size: 12 },
  { text: "No pricing is ever displayed or calculated on the website - the official", size: 12 },
  { text: "package document is the only source of pricing.", size: 12 },
];

mkdirSync("public/packages", { recursive: true });
writeFileSync(
  "public/packages/salt-republic-mvr-package.pdf",
  buildPdf([...common, { text: " ", size: 13 }, { text: "Expected file: official MVR pricing package.", size: 12 }]),
  { encoding: "utf8" }
);
writeFileSync(
  "public/packages/salt-republic-usd-package.pdf",
  buildPdf([...common, { text: " ", size: 13 }, { text: "Expected file: official USD pricing package.", size: 12 }]),
  { encoding: "utf8" }
);

console.log("PDF placeholders written to public/packages/");
