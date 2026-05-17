import React from "react";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/constants";

interface HomeIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export function FishIcon({
  width = 24,
  height = 24,
  color = colors.GRAY_400,
}: HomeIconProps) {
  return (
    <Svg
      fill="none"
      height={height}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={width}
    >
      <Path d="M6.5 12c.94-3.46 4.94-6 8.5-6 1.18 0 2.97.08 4.03.93a1 1 0 0 1 .28 1.13L18 10.5M6.5 12c.94 3.46 4.94 6 8.5 6 1.18 0 2.97-.08 4.03-.93a1 1 0 0 0 .28-1.13L18 13.5M6.5 12A3.5 3.5 0 0 1 3 8.5v7A3.5 3.5 0 0 1 6.5 12Z" />
      <Path d="M18 12h.01" />
    </Svg>
  );
}

export function AnchorIcon({
  width = 16,
  height = 16,
  color = colors.BRAND_PRIMARY,
}: HomeIconProps) {
  return (
    <Svg
      fill="none"
      height={height}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={width}
    >
      <Path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </Svg>
  );
}

export function WaveIcon({
  width = 16,
  height = 16,
  color = colors.BRAND_PRIMARY,
}: HomeIconProps) {
  return (
    <Svg
      fill="none"
      height={height}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width={width}
    >
      <Path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.6 2 5.1 2 2.5 0 2.5-2 5.1-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5.1 2 2.5 0 2.5-2 5.1-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5.1 2 2.5 0 2.5-2 5.1-2 1.3 0 1.9.5 2.5 1" />
    </Svg>
  );
}

export function WeatherIcon({
  width = 16,
  height = 16,
  color = colors.ORANGE_500,
}: HomeIconProps) {
  return (
    <Svg
      fill="none"
      height={height}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={width}
    >
      <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      <Path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </Svg>
  );
}

export function MapPinIcon({
  width = 16,
  height = 16,
  color = colors.RED_500,
}: HomeIconProps) {
  return (
    <Svg fill={color} height={height} viewBox="0 0 24 24" width={width}>
      <Path
        clipRule="evenodd"
        d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fillRule="evenodd"
      />
    </Svg>
  );
}

export function PlusIcon({
  width = 28,
  height = 28,
  color = colors.WHITE,
}: HomeIconProps) {
  return (
    <Svg
      fill="none"
      height={height}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width={width}
    >
      <Path d="M12 4.5v15m7.5-7.5h-15" />
    </Svg>
  );
}
