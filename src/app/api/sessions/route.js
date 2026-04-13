import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            userId,
            startTime,
            endTime,
            duration,
            goodPostureSeconds,
            badPostureSeconds
        } = body;

        // Logika perhitungan Score (0-100)
        const total = goodPostureSeconds + badPostureSeconds;
        const avgScore = total > 0 ? (goodPostureSeconds / total) * 100 : 0;

        // Logika status berdasarkan score
        let postureStatus = "Bad";
        if (avgScore >= 80) postureStatus = "Good";
        else if (avgScore >= 50) postureStatus = "Average";

        const newSession = await prisma.monitoringSession.create({
            data: {
                userId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration: parseInt(duration),
                goodPostureSeconds: parseInt(goodPostureSeconds),
                badPostureSeconds: parseInt(badPostureSeconds),
                avgScore: parseFloat(avgScore.toFixed(2)),
                postureStatus: postureStatus,
            },
        });

        return NextResponse.json(newSession, { status: 201 });
    } catch (error) {
        console.error("Gagal simpan sesi:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}