/**
 * Provenance of every dataset on the site, in one place.
 *
 * Each data module exports its own `source`; this file only aggregates them so
 * pages (About, footers, "data as of" badges) and `npm run check:data` can read
 * a single object. `retrievedAt` is the date the data was last checked against
 * the primary source; check:data warns once it is more than 12 months old.
 */
import { source as aisvs } from "./aisvs";
import { source as nist } from "./nistAisvsRemap";
import { source as atlas } from "./atlasCrosswalk";
import {
  source as threats,
  controlsSource as controls,
} from "../components/components/securityData";
import { source as top10 } from "../components/components/owaspAgenticTop10Data";
import { source as cisco } from "../components/components/ciscoTaxonomyData";
import { source as aiuc1 } from "../components/components/aiuc1Data";
import { source as aivss } from "../components/components/aivssCalcData";
import { source as kc } from "../components/components/frameworkData";
import { source as architectures } from "../components/components/architecturesData";
import { source as components } from "../components/components/componentDataMap";

export interface DataSource {
  name: string;
  version: string;
  url: string;
  /** YYYY-MM-DD */
  retrievedAt: string;
  /** Machine-readable file the data was taken from, when different from `url`. */
  dataUrl?: string;
}

export type DataSourceKey =
  | "aisvs"
  | "threats"
  | "controls"
  | "top10"
  | "cisco"
  | "atlas"
  | "aiuc1"
  | "aivss"
  | "kc"
  | "components"
  | "architectures"
  | "nist";

export const SOURCES: Record<DataSourceKey, DataSource> = {
  aisvs,
  threats,
  controls,
  top10,
  cisco,
  atlas,
  aiuc1,
  aivss,
  kc,
  components,
  architectures,
  nist,
};

/** Most recent `retrievedAt` across all sources (YYYY-MM-DD). */
export const DATA_RETRIEVED_AT: string = Object.values(SOURCES).reduce(
  (latest, s) => (s.retrievedAt > latest ? s.retrievedAt : latest),
  "",
);
