import { Navigate } from "react-router-dom";
import { featuredThreatPath } from "@/lib/featured";

/**
 * `/threats/today` (P4-04): redirects to the featured threat for today's UTC date. Lazy-loaded
 * from App.tsx so the threat catalog stays out of the entry chunk.
 */
export default function ThreatOfTheDayRedirect() {
  return <Navigate to={featuredThreatPath(new Date())} replace />;
}
