#!/usr/bin/env node
// scripts/build-file-intake-op-fixtures.mjs
//
// Emits the seven operator-coverage fixtures into test/fixtures/file-intake/.
// Run: node scripts/build-file-intake-op-fixtures.mjs
//
// ══ WHY A GENERATOR AND NOT SEVEN CHECKED-IN BLOBS ═════════════════════════════
//
// The probe corpus is hand-authored bytes, and these follow the same discipline:
// explicit objects, a computed xref, no producer library anywhere in the path. The
// generator exists because the ground truth for these fixtures is arithmetic, and a
// reader who wants to check that arithmetic needs to see the content stream that
// produced it. The emitted PDFs are committed; this script is how they are re-derived.
//
// ══ WHY EVERY GLYPH IS 500/1000 EM ═════════════════════════════════════════════
//
// The whole point of these fixtures is to widen "advances are exact" past n=1. An
// expected advance computed from the same width table the walker read would be
// circular. So the font declares a uniform 500 width for every code from 32 to 126,
// and every fixture sets 10pt. One glyph is then 5.0pt exactly, and every expected
// advance in the test is a number a person can add up on paper without consulting the
// parser, the font, or the walker.
//
// pdf.js honours the explicit /Widths array on a standard /BaseFont /Helvetica — the
// declared metrics win over the built-in ones — and it still marks byte 32 isSpace,
// which is what makes the Tw fixture meaningful. Both were measured against
// pdfjs-dist 6.2.108 before this font was chosen.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(HERE, "..", "test", "fixtures", "file-intake");

// Every code from 32 (space) to 126 (~) advances 500/1000 em.
const FIRST_CHAR = 32;
const LAST_CHAR = 126;
const UNIFORM_WIDTH = 500;
const WIDTHS = new Array(LAST_CHAR - FIRST_CHAR + 1).fill(UNIFORM_WIDTH).join(" ");

const FONT_OBJ =
  `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding ` +
  `/FirstChar ${FIRST_CHAR} /LastChar ${LAST_CHAR} /Widths [${WIDTHS}] >>`;

/**
 * Assemble a one-page PDF from a content stream. Objects are numbered in order and
 * the xref offsets are computed from the bytes actually written, exactly as the probe
 * corpus does it.
 */
function buildPdf(contentStream) {
  const streamBytes = Buffer.byteLength(contentStream, "latin1");
  const bodies = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] " +
      "/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${streamBytes} >>\nstream\n${contentStream}\nendstream`,
    FONT_OBJ,
  ];

  let out = "%PDF-1.7\n%\xe2\xe3\xcf\xd3\n";
  const offsets = [];
  bodies.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += String(o).padStart(10, "0") + " 00000 n \n";
  out +=
    `trailer\n<< /Size ${bodies.length + 1} /Root 1 0 R ` +
    `/ID [<0F0E0D0C0B0A09080706050403020100> <0F0E0D0C0B0A09080706050403020100>] >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

// Each entry names the operator it exists to cover and carries the content stream
// verbatim. The expected numbers live in the test, not here — a fixture that shipped
// its own answers would be checking the generator, not the walker.
const FIXTURES = [
  {
    file: "op01_tm_setmatrix.pdf",
    covers: "Tm",
    stream: "BT /F1 10 Tf 2 0 0 2 40 150 Tm (ABCD) Tj (EFGH) Tj ET",
  },
  {
    file: "op02_tj_array.pdf",
    covers: "TJ",
    stream: "BT /F1 10 Tf 50 100 Td [(A) -1000 (B) 500 (C)] TJ ET",
  },
  {
    file: "op03_tz_hscale.pdf",
    covers: "Tz",
    stream: "BT /F1 10 Tf 200 Tz 50 100 Td (ABCDE) Tj ET",
  },
  {
    file: "op04_ts_rise.pdf",
    covers: "Ts",
    stream: "BT /F1 10 Tf 50 100 Td (AB) Tj 6 Ts (CD) Tj -4 Ts (EF) Tj ET",
  },
  {
    file: "op05_tc_charspacing.pdf",
    covers: "Tc",
    stream: "BT /F1 10 Tf 3 Tc 50 100 Td (ABC) Tj 0 Tc (DEF) Tj ET",
  },
  {
    file: "op06_tw_wordspacing.pdf",
    covers: "Tw",
    stream: "BT /F1 10 Tf 4 Tw 50 100 Td (A B C) Tj 0 Tw (A B C) Tj ET",
  },
  {
    file: "op07_tstar_nextline.pdf",
    covers: "T* (and TD, which sets the leading T* consumes)",
    stream:
      "BT /F1 10 Tf 14 TL 50 150 Td (AA) Tj T* (BB) Tj T* (CC) Tj ET\n" +
      "BT /F1 10 Tf 50 60 Td 0 -20 TD (DD) Tj T* (EE) Tj ET",
  },
];

for (const { file, covers, stream } of FIXTURES) {
  const bytes = buildPdf(stream);
  fs.writeFileSync(path.join(OUT_DIR, file), bytes);
  process.stdout.write(`${file}  covers ${covers}  ${bytes.length} bytes\n`);
}
