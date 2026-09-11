"use client";

import { useEffect, useState } from "react";
import styles from "./IpScrollingBar.module.css";

export default function IpScrollingBar({ initialDevices }) {
  const [devices, setDevices] = useState(initialDevices || []);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch("/api/devices");
        if (res.ok) {
          const data = await res.json();
          setDevices(data);
        }
      } catch (err) {
        console.error("Error fetching device status:", err);
      }
    };

    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!devices || devices.length === 0) {
    return null;
  }

  // Duplicate items to ensure a seamless continuous marquee loop.
  let repeated = [...devices];
  while (repeated.length > 0 && repeated.length < 15) {
    repeated = [...repeated, ...devices];
  }
  const marqueeItems = [...repeated, ...repeated];

  return (
    <div className={styles.container}>
      <div className={styles.marqueeWrapper}>
        <div className={styles.marqueeTrack}>
          {marqueeItems.map((device, index) => {
            const isOnline = device.status === "ONLINE";
            const imgSrc = isOnline ? "/images/online.png" : "/images/offline.png";

            return (
              <div key={`${device.id}-${index}`} className={styles.card}>
                <div className={styles.imageContainer}>
                  <img
                    src={imgSrc}
                    alt={isOnline ? "Online" : "Offline"}
                    className={styles.statusImage}
                  />
                </div>
                <div className={styles.deviceIp} title={device.ipAddress}>
                  {device.ipAddress}
                </div>
                <div className={styles.deviceName} title={device.name}>
                  {device.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

