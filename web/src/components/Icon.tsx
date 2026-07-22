// Material Symbols (Google) icons — replaces the hand-drawn monoline SVG
// set so the UI uses one real, maintained icon system instead of a bespoke
// one. Uses `@material-symbols/svg-400` (one small SVG file per glyph,
// imported individually so the bundle only ever contains the ~20 icons this
// app actually uses) rather than the variable-font `material-symbols`
// package, whose single font file bundles every Material Symbols glyph
// (~4 MB) regardless of how few are referenced — verified via `npm run
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

export type IconName =
  | "home" | "dashboard" | "monitor" | "map" | "report"
  | "gate" | "empty"
  | "cloud-rain" | "sliders" | "alert-triangle" | "settings"
  | "bell" | "help-circle" | "user"
  | "route" | "droplet" | "pump" | "lock"
  | "mail" | "eye" | "eye-off";

/** Maps this app's semantic icon names to the imported Material Symbols SVG
 *  markup — kept as an indirection layer so call sites don't need to know
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
