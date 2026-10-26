"use client";

import { useState } from "react";
import styles from "../app/dashboard.module.css";

export default function DeviceBarChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // SVG dimensions & padding (Reduced height for fit-to-page)
  const width = 1000;
  const height = 190;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Dynamic tick generator for clean Y-axis ticks
  const maxDevices = Math.max(1, ...data.map((d) => Math.max(d.total, d.working)));
  let step = 1;
  if (maxDevices <= 6) step = 1;
  else if (maxDevices <= 12) step = 2;
  else if (maxDevices <= 30) step = 5;
  else step = 10;

  const ticks = [];
  const limit = Math.ceil((maxDevices + 1) / step) * step;
  for (let val = 0; val <= limit; val += step) {
    ticks.push(val);
  }
  const maxVal = limit;

  // Calculate coordinates
  const getX = (index) => paddingLeft + (index * chartWidth) / data.length;
  const getY = (value) => paddingTop + chartHeight - (value * chartHeight) / maxVal;

  const barGroupWidth = chartWidth / data.length;
  const barWidth = Math.min(28, barGroupWidth * 0.25);
  const gap = 8; // gap between total and working bars

  return (
    <div className={styles.chartContainer}>
      {/* Left Area: The SVG Chart */}
      <div className={styles.chartMainArea}>
        <div className={styles.chartHeader}>
          <div>
            <h2 className={styles.chartTitle}>Key Devices </h2>
            <p className={styles.chartSubtitle}>Real-time monitoring response across primary network sectors</p>
          </div>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendColor} ${styles.colorTotal}`}></span>
              <span>Total Monitored</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendColor} ${styles.colorWorking}`}></span>
              <span>Active Online</span>
            </div>
          </div>
        </div>

        <div className={styles.svgWrapper}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className={styles.chartSvg}>
            <defs>
              {/* Vibrant Gradients */}
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="workingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="gridGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.1" />
              </linearGradient>

              {/* Glowing Drop Shadows */}
              <filter id="totalGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.25" />
              </filter>
              <filter id="workingGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#10b981" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Grid lines */}
            {ticks.map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="url(#gridGrad)"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    className={styles.axisLabel}
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* X Axis base line */}
            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight}
              x2={width - paddingRight}
              y2={paddingTop + chartHeight}
              stroke="#e2e8f0"
              strokeWidth="2"
            />

            {/* Bars */}
            {data.map((item, idx) => {
              const xGroupStart = getX(idx);
              const xCenter = xGroupStart + barGroupWidth / 2;

              // Coordinates for Total Bar
              const totalBarHeight = (item.total * chartHeight) / maxVal;
              const totalX = xCenter - barWidth - gap / 2;
              const totalY = getY(item.total);

              // Coordinates for Working Bar
              const workingBarHeight = (item.working * chartHeight) / maxVal;
              const workingX = xCenter + gap / 2;
              const workingY = getY(item.working);

              const isHovered = hoveredIdx === idx;

              return (
                <g
                  key={idx}
                  className={styles.barGroup}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Background highlight area on hover */}
                  <rect
                    x={xGroupStart + 8}
                    y={paddingTop - 10}
                    width={barGroupWidth - 16}
                    height={chartHeight + 15}
                    fill="#f8fafc"
                    opacity={isHovered ? 0.9 : 0}
                    rx="8"
                    className={styles.hoverBg}
                  />

                  {/* Total Bar with Top Rounded Corner Trick */}
                  {item.total > 0 && (
                    <g>
                      <rect
                        x={totalX}
                        y={totalY}
                        width={barWidth}
                        height={Math.max(0, totalBarHeight)}
                        fill="url(#totalGrad)"
                        rx="6"
                        filter={isHovered ? "url(#totalGlow)" : ""}
                        className={styles.bar}
                      />
                      {/* Flatten the bottom corners of the bar */}
                      <rect
                        x={totalX}
                        y={totalY + Math.max(0, totalBarHeight) - 6}
                        width={barWidth}
                        height={6}
                        fill="url(#totalGrad)"
                      />
                      {/* Count Badge label */}
                      <text
                        x={totalX + barWidth / 2}
                        y={totalY - 6}
                        textAnchor="middle"
                        fill="#4f46e5"
                        fontSize="11px"
                        fontWeight="bold"
                      >
                        {item.total}
                      </text>
                    </g>
                  )}

                  {/* Working Bar with Top Rounded Corner Trick */}
                  {item.working > 0 && (
                    <g>
                      <rect
                        x={workingX}
                        y={workingY}
                        width={barWidth}
                        height={Math.max(0, workingBarHeight)}
                        fill="url(#workingGrad)"
                        rx="6"
                        filter={isHovered ? "url(#workingGlow)" : ""}
                        className={styles.bar}
                      />
                      {/* Flatten the bottom corners of the bar */}
                      <rect
                        x={workingX}
                        y={workingY + Math.max(0, workingBarHeight) - 6}
                        width={barWidth}
                        height={6}
                        fill="url(#workingGrad)"
                      />
                      {/* Count Badge label */}
                      <text
                        x={workingX + barWidth / 2}
                        y={workingY - 6}
                        textAnchor="middle"
                        fill="#059669"
                        fontSize="11px"
                        fontWeight="bold"
                      >
                        {item.working}
                      </text>
                    </g>
                  )}

                  {/* X Axis location label */}
                  <text
                    x={xCenter}
                    y={paddingTop + chartHeight + 22}
                    textAnchor="middle"
                    className={`${styles.xAxisLabel} ${isHovered ? styles.activeText : ""}`}
                  >
                    {item.category}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right Area: Premium Glassmorphism Status Panel */}
      <div className={styles.tooltipContainer}>
        {hoveredIdx !== null ? (
          <div className={styles.tooltipCard}>
            <div className={styles.panelHeader}>
              <span className={styles.pulseDot}></span>
              <span className={styles.panelCategoryName}>{data[hoveredIdx].category}</span>
            </div>
            <div className={styles.panelMeta}>
              <div className={styles.metaBadge}>
                <span className={styles.metaNumTotal}>{data[hoveredIdx].total}</span>
                <span className={styles.metaLabel}>Nodes</span>
              </div>
              <div className={styles.metaBadge}>
                <span className={styles.metaNumOnline}>{data[hoveredIdx].working}</span>
                <span className={styles.metaLabel}>Active</span>
              </div>
            </div>
            <div className={styles.tooltipDevicesList}>
              {data[hoveredIdx].devices.map((device, dIdx) => (
                <div key={dIdx} className={styles.tooltipDeviceItem}>
                  <span className={`${styles.statusDot} ${device.status === 'ONLINE' ? styles.dotOnline : styles.dotOffline}`}></span>
                  <span className={styles.deviceName} title={device.name}>{device.name}</span>
                  <span className={`${styles.statusPill} ${device.status === 'ONLINE' ? styles.pillOnline : styles.pillOffline}`}>
                    {device.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.tooltipPlaceholder}>
            <div className={styles.placeholderIcon}>📡</div>
            <div className={styles.placeholderTitle}>System Health Monitor</div>
            <p className={styles.placeholderText}>
              Hover over a sector bar to query real-time diagnostics, device rosters, and network states.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
