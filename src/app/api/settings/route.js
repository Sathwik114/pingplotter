import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const body = await request.json();
  const {
    defaultPingInterval,
    defaultFailureThreshold,
    dailyReportTime,
    monitoringEnabled,
  } = body;

  try {
    const settings = await updateSettings({
      ...(defaultPingInterval !== undefined && {
        defaultPingInterval: Number(defaultPingInterval),
      }),
      ...(defaultFailureThreshold !== undefined && {
        defaultFailureThreshold: Number(defaultFailureThreshold),
      }),
      ...(dailyReportTime !== undefined && { dailyReportTime: dailyReportTime || null }),
      ...(monitoringEnabled !== undefined && { monitoringEnabled }),
    });

    return NextResponse.json(settings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
