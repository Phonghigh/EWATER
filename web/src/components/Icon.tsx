// Material Symbols (Google) icons - replaces the hand-drawn monoline SVG
// set so the UI uses one real, maintained icon system instead of a bespoke
// one. Uses `@material-symbols/svg-400` (one small SVG file per glyph,
// imported individually so the bundle only ever contains the ~20 icons this
// app actually uses) rather than the variable-font `material-symbols`
// package, whose single font file bundles every Material Symbols glyph
// (~4 MB) regardless of how few are referenced - verified via `npm run
// build` output before choosing this approach.

import home from "@material-symbols/svg-400/outlined/home.svg?raw";
import dashboard from "@material-symbols/svg-400/outlined/dashboard.svg?raw";
import monitoring from "@material-symbols/svg-400/outlined/monitoring.svg?raw";
import map from "@material-symbols/svg-400/outlined/map.svg?raw";
import description from "@material-symbols/svg-400/outlined/description.svg?raw";
import gate from "@material-symbols/svg-400/outlined/gate.svg?raw";
import inventory2 from "@material-symbols/svg-400/outlined/inventory_2.svg?raw";
import rainy from "@material-symbols/svg-400/outlined/rainy.svg?raw";
import tune from "@material-symbols/svg-400/outlined/tune.svg?raw";
import warning from "@material-symbols/svg-400/outlined/warning.svg?raw";
import settings from "@material-symbols/svg-400/outlined/settings.svg?raw";
import notifications from "@material-symbols/svg-400/outlined/notifications.svg?raw";
import help from "@material-symbols/svg-400/outlined/help.svg?raw";
import person from "@material-symbols/svg-400/outlined/person.svg?raw";
import route from "@material-symbols/svg-400/outlined/route.svg?raw";
import waterDrop from "@material-symbols/svg-400/outlined/water_drop.svg?raw";
import waterPump from "@material-symbols/svg-400/outlined/water_pump.svg?raw";
import lock from "@material-symbols/svg-400/outlined/lock.svg?raw";
import mail from "@material-symbols/svg-400/outlined/mail.svg?raw";
import visibility from "@material-symbols/svg-400/outlined/visibility.svg?raw";
import visibilityOff from "@material-symbols/svg-400/outlined/visibility_off.svg?raw";
import search from "@material-symbols/svg-400/outlined/search.svg?raw";
import playArrow from "@material-symbols/svg-400/outlined/play_arrow.svg?raw";
import pause from "@material-symbols/svg-400/outlined/pause.svg?raw";
import skipNext from "@material-symbols/svg-400/outlined/skip_next.svg?raw";
import skipPrevious from "@material-symbols/svg-400/outlined/skip_previous.svg?raw";
import arrowSelectorTool from "@material-symbols/svg-400/outlined/arrow_selector_tool.svg?raw";
import openWith from "@material-symbols/svg-400/outlined/open_with.svg?raw";
import zoomIn from "@material-symbols/svg-400/outlined/zoom_in.svg?raw";
import zoomOut from "@material-symbols/svg-400/outlined/zoom_out.svg?raw";
import straighten from "@material-symbols/svg-400/outlined/straighten.svg?raw";
import squareFoot from "@material-symbols/svg-400/outlined/square_foot.svg?raw";
import download from "@material-symbols/svg-400/outlined/download.svg?raw";
import fullscreen from "@material-symbols/svg-400/outlined/fullscreen.svg?raw";
import fullscreenExit from "@material-symbols/svg-400/outlined/fullscreen_exit.svg?raw";
import layers from "@material-symbols/svg-400/outlined/layers.svg?raw";
import chevronLeft from "@material-symbols/svg-400/outlined/chevron_left.svg?raw";
import chevronRight from "@material-symbols/svg-400/outlined/chevron_right.svg?raw";
import keyboardArrowUp from "@material-symbols/svg-400/outlined/keyboard_arrow_up.svg?raw";
import keyboardArrowDown from "@material-symbols/svg-400/outlined/keyboard_arrow_down.svg?raw";
import arrowUpward from "@material-symbols/svg-400/outlined/arrow_upward.svg?raw";
import arrowDownward from "@material-symbols/svg-400/outlined/arrow_downward.svg?raw";
import trendingFlat from "@material-symbols/svg-400/outlined/trending_flat.svg?raw";
import centerFocusStrong from "@material-symbols/svg-400/outlined/center_focus_strong.svg?raw";
import close from "@material-symbols/svg-400/outlined/close.svg?raw";

export type IconName =
  | "home" | "dashboard" | "monitor" | "map" | "report"
  | "gate" | "empty"
  | "cloud-rain" | "sliders" | "alert-triangle" | "settings"
  | "bell" | "help-circle" | "user"
  | "route" | "droplet" | "pump" | "lock"
  | "mail" | "eye" | "eye-off"
  | "search" | "play" | "pause" | "skip-next" | "skip-previous"
  | "select" | "pan" | "zoom-in" | "zoom-out" | "ruler" | "area"
  | "download" | "fullscreen" | "fullscreen-exit"
  | "layers" | "chevron-left" | "chevron-right" | "chevron-up" | "chevron-down"
  | "trend-up" | "trend-down" | "trend-flat" | "focus" | "close";

/** Maps this app's semantic icon names to the imported Material Symbols SVG
 *  markup - kept as an indirection layer so call sites don't need to know
 *  Google's glyph naming, and a glyph can be swapped in one place. */
const RAW: Record<IconName, string> = {
  home,
  dashboard,
  monitor: monitoring,
  map,
  report: description,
  gate,
  empty: inventory2,
  "cloud-rain": rainy,
  sliders: tune,
  "alert-triangle": warning,
  settings,
  bell: notifications,
  "help-circle": help,
  user: person,
  route,
  droplet: waterDrop,
  pump: waterPump,
  lock,
  mail,
  eye: visibility,
  "eye-off": visibilityOff,
  search,
  play: playArrow,
  pause,
  "skip-next": skipNext,
  "skip-previous": skipPrevious,
  select: arrowSelectorTool,
  pan: openWith,
  "zoom-in": zoomIn,
  "zoom-out": zoomOut,
  ruler: straighten,
  area: squareFoot,
  download,
  fullscreen,
  "fullscreen-exit": fullscreenExit,
  layers,
  "chevron-left": chevronLeft,
  "chevron-right": chevronRight,
  "chevron-up": keyboardArrowUp,
  "chevron-down": keyboardArrowDown,
  "trend-up": arrowUpward,
  "trend-down": arrowDownward,
  "trend-flat": trendingFlat,
  focus: centerFocusStrong,
  close,
};

export default function Icon({ name, size = 18, className }: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`icon ${className ?? ""}`}
      style={{ display: "inline-block", width: size, height: size }}
      aria-hidden="true"
      // Markup is a fixed set of local build-time imports from a trusted
      // package (`@material-symbols/svg-400`), not user/runtime data.
      dangerouslySetInnerHTML={{ __html: RAW[name] }}
    />
  );
}
