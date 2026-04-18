import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET — Ambil semua sesi monitoring milik user yang login
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const latest = searchParams.get("latest");

    if (latest === "true") {
      // Ambil 1 sesi terakhir saja
      const latestSession = await prisma.monitoringSession.findFirst({
        where: { userId: session.user.id },
        orderBy: { startTime: "desc" },
      });

      return NextResponse.json(latestSession);
    }

    // Ambil semua sesi, urutkan dari terbaru
    const sessions = await prisma.monitoringSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Gagal ambil sesi:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST — Simpan sesi monitoring baru
export async function POST(req) {
  try {
    // Ambil user ID dari server session (lebih aman)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      startTime,
      endTime,
      duration,
      goodPostureSeconds,
      badPostureSeconds,
    } = body;

    // Logika perhitungan Score (0-100)
    const total = goodPostureSeconds + badPostureSeconds;
    const avgScore = total > 0 ? (goodPostureSeconds / total) * 100 : 0;

    const newSession = await prisma.monitoringSession.create({
      data: {
        userId: session.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: parseInt(duration),
        goodPostureSeconds: parseInt(goodPostureSeconds),
        badPostureSeconds: parseInt(badPostureSeconds),
        avgScore: parseFloat(avgScore.toFixed(2)),
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Gagal simpan sesi:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}