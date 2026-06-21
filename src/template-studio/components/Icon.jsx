// Lucide-style SVG icon component
// name — key in UI_ICONS. size, color, strokeWidth, style — styling overrides.

import { UI_ICONS } from "../constants/ui.jsx";

export const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 1.75, style = {} }) => {
  const renderPaths = UI_ICONS[name];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
         fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}>
      {renderPaths ? renderPaths(name) : null}
    </svg>
  );
};