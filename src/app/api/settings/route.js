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

  if (
    dailyReportTime !== undefined &&
    dailyReportTime !== null &&
    dailyReportTime !== "" &&
    !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dailyReportTime)
  ) {
    return NextResponse.json(
      { error: "Daily report time must be in HH:mm format." },
      { status: 400 }
    );
  }

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
