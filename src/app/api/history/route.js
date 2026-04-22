import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  // Pastikan cuma user yang login yang bisa ambil datanya
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const history = await prisma.monitoringSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startTime: "desc" }, // Data terbaru paling atas
    });

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}
