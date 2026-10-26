import ping from "ping";

/**
 * Pings a single host once.
 * Returns { alive: boolean, time: number|null } where time is ms (rounded).
 */
export async function pingHost(ipAddress) {
  try {
    const extra = process.platform === "win32" ? ["-n", "1"] : ["-c", "1"];
    const res = await ping.promise.probe(ipAddress, {
      timeout: 5,
      extra,
    });
    
    const time =
      res.alive && res.time !== "unknown" ? Math.round(Number(res.time)) : null;

    return { alive: !!res.alive, time };
  } catch (err) {
    console.error(`[pinger] Error pinging ${ipAddress}:`, err.message);
    return { alive: false, time: null };
  }
}
