import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polyline, Circle, Line, Defs, LinearGradient, Stop, Path } from "react-native-svg";

interface MiniChartProps {
  data: number[];
  width: number;
  height: number;
  color: string;
  showDots?: boolean;
  showArea?: boolean;
}

export function MiniChart({
  data,
  width,
  height,
  color,
  showDots = false,
  showArea = true,
}: MiniChartProps) {
  if (data.length < 2) return null;

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((val - min) / range) * chartHeight;
    return { x, y };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const areaPath =
    `M ${points[0].x},${height} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x},${height} Z`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.2" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {showArea && (
          <Path d={areaPath} fill={`url(#grad-${color})`} />
        )}
        <Polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showDots &&
          points.map((p, i) =>
            i === points.length - 1 ? (
              <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
            ) : null,
          )}
      </Svg>
    </View>
  );
}
