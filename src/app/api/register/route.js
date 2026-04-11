import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma"; // Pastikan path ini sesuai dengan file prisma.js kamu

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // 1. Validasi input dasar
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Semua kolom wajib diisi." }, { status: 400 });
    }

    // 2. Cek apakah email sudah terdaftar di database
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email sudah digunakan." }, { status: 409 });
    }

    // 3. Enkripsi (Hash) password menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Simpan user baru ke database beserta UserSettings bawaan
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // (Opsional) Langsung buatkan settings default untuk user ini
        settings: {
          create: {
            soundEnabled: true,
            visualAlertEnabled: true,
            sensitivity: 25,
            alertCooldown: 3
          }
        }
      }
    });

    return NextResponse.json({ message: "Registrasi berhasil!", user: newUser }, { status: 201 });

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}