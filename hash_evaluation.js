const crypto = require("crypto");
const { createHash } = require("blake3");
const fs = require("fs");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static("public"));

// Fungsi untuk melakukan hashing dengan SHA-512 dan BLAKE3
function gabungkanHash(input) {
  const sha512Hash = crypto.createHash("sha512").update(input).digest("hex");
  const blake3Hash = createHash().update(input).digest("hex");
  return sha512Hash + blake3Hash;
}

// Fungsi untuk menghitung keamanan algoritma
function hitungKeamanan(n) {
  const collisionResistance = 1 / Math.pow(2, n / 2); // Rumus Collision Resistance
  const preImageResistance = 1 / Math.pow(2, n); // Rumus Pre-image Resistance
  return { collisionResistance, preImageResistance };
}

// Fungsi untuk evaluasi performa hashing
async function evaluasiPerformaHash(input, iterasi = 1000, networkSize = 1000, returnResult = false) {
  console.log("=== Evaluasi Performa Hashing ===");

  // Waktu hashing SHA-512
  const startSHA512 = process.hrtime.bigint();
  for (let i = 0; i < iterasi; i++) {
    crypto.createHash("sha512").update(input).digest("hex");
  }
  const endSHA512 = process.hrtime.bigint();
  const waktuSHA512 = Number(endSHA512 - startSHA512) / 1e6 / iterasi; // Rata-rata waktu per iterasi (ms)

  // Waktu hashing BLAKE3
  const startBlake3 = process.hrtime.bigint();
  for (let i = 0; i < iterasi; i++) {
    createHash().update(input).digest("hex");
  }
  const endBlake3 = process.hrtime.bigint();
  const waktuBlake3 = Number(endBlake3 - startBlake3) / 1e6 / iterasi; // Rata-rata waktu per iterasi (ms)

  // Waktu hashing kombinasi
  const startGabungan = process.hrtime.bigint();
  for (let i = 0; i < iterasi; i++) {
    gabungkanHash(input);
  }
  const endGabungan = process.hrtime.bigint();
  const waktuGabungan = Number(endGabungan - startGabungan) / 1e6 / iterasi; // Rata-rata waktu per iterasi (ms)

  // Hitung Latency
  const latencyGabungan = waktuGabungan; // Latency per transaksi (ms)

  // Hitung Scalability Efficiency
  const tpsGabungan = iterasi / ((waktuGabungan * iterasi) / 1000); // Transactions per second (TPS)
  const scalabilityGabungan = tpsGabungan / networkSize; // Scalability berdasarkan ukuran jaringan

  // Hitung keamanan algoritma
  const keamananSHA512 = hitungKeamanan(512); // Panjang output SHA-512 adalah 512 bit
  const keamananBlake3 = hitungKeamanan(256); // Panjang output BLAKE3 adalah 256 bit
  const keamananGabungan = hitungKeamanan(512 + 256); // Panjang output gabungan adalah 768 bit

  if (returnResult) {
    return {
      latencyGabungan: latencyGabungan.toFixed(3),
      scalabilityGabungan: scalabilityGabungan.toFixed(6),
      waktuSHA512: waktuSHA512.toFixed(3),
      waktuBlake3: waktuBlake3.toFixed(3),
      waktuGabungan: waktuGabungan.toFixed(3),
      throughputSHA512: (1 / waktuSHA512).toFixed(3),
      throughputBlake3: (1 / waktuBlake3).toFixed(3),
      throughputGabungan: (1 / waktuGabungan).toFixed(3),
      keamananSHA512,
      keamananBlake3,
      keamananGabungan
    };
  }

  // Tampilkan hasil di terminal
  console.log(`Latency (Gabungan): ${latencyGabungan.toFixed(3)} ms`);
  console.log(
    `Scalability Efficiency (Gabungan): ${scalabilityGabungan.toFixed(
      6
    )} TPS per Node`
  );
  console.log(`Waktu Hashing SHA-512: ${waktuSHA512.toFixed(3)} ms`);
  console.log(`Waktu Hashing BLAKE3: ${waktuBlake3.toFixed(3)} ms`);
  console.log(
    `Waktu Hashing Gabungan (SHA-512 + BLAKE3): ${waktuGabungan.toFixed(3)} ms`
  );
  console.log(`Throughput SHA-512: ${(1 / waktuSHA512).toFixed(3)} MB/s`);
  console.log(`Throughput BLAKE3: ${(1 / waktuBlake3).toFixed(3)} MB/s`);
  console.log(`Throughput Gabungan: ${(1 / waktuGabungan).toFixed(3)} MB/s`);

  console.log("\n=== Keamanan Algoritma ===");
  console.log(
    `SHA-512 Collision Resistance: ${keamananSHA512.collisionResistance}`
  );
  console.log(
    `SHA-512 Pre-image Resistance: ${keamananSHA512.preImageResistance}`
  );
  console.log(
    `BLAKE3 Collision Resistance: ${keamananBlake3.collisionResistance}`
  );
  console.log(
    `BLAKE3 Pre-image Resistance: ${keamananBlake3.preImageResistance}`
  );
  console.log(
    `Gabungan Collision Resistance: ${keamananGabungan.collisionResistance}`
  );
  console.log(
    `Gabungan Pre-image Resistance: ${keamananGabungan.preImageResistance}`
  );
}

// Contoh penggunaan
const inputData = "Ini adalah input untuk hashing.";
evaluasiPerformaHash(inputData, 1000, 1000);

app.post("/api/hash", async (req, res) => {
  const { input, iterasi, networkSize } = req.body;
  const result = await evaluasiPerformaHash(input, iterasi, networkSize, true); // true = return result, not console.log
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
