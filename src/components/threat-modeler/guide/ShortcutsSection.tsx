import { Fragment } from "react";
import { SHORTCUTS, SHORTCUT_GROUPS, formatKey } from "../shortcuts";
import { Kbd } from "./GuideSection";

const SCOPE_LABEL = {
  canvas: "Canvas focused",
  modeler: "Anywhere in the modeler",
} as const;

/** Shortcut tables generated from TM/shortcuts.ts (the same table drives the handler and the in-app dialog). */
export default function ShortcutsSection() {
  return (
    <div className="space-y-4">
      {SHORTCUT_GROUPS.map((group) => {
        const rows = SHORTCUTS.filter((s) => s.group === group);
        if (!rows.length) return null;
        return (
          <div key={group} className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <caption className="border-b bg-muted/40 px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Keys</th>
                  <th scope="col">Action</th>
                  <th scope="col">Where</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="w-48 whitespace-nowrap px-3 py-2">
                      {s.keys.map((combo, i) => (
                        <Fragment key={i}>
                          {i > 0 && (
                            <span className="mx-1 text-[11px] text-muted-foreground">or</span>
                          )}
                          <span className="inline-flex items-center gap-0.5">
                            {combo.map((k) => (
                              <Kbd key={k}>{formatKey(k)}</Kbd>
                            ))}
                          </span>
                        </Fragment>
                      ))}
                    </td>
                    <td className="px-3 py-2">{s.description}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                      {SCOPE_LABEL[s.scope]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
