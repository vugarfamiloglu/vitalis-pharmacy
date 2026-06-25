import { useEffect, useState } from "react";

import { get } from "../lib/api.ts";

interface Entry {
  actor: string;
  action: string;
  detail: string;
  at: string;
}

const COLOR: Record<string, string> = {
  login: "var(--primary)",
  sale: "var(--primary-2)",
  dispense_prescription: "var(--accent)",
  update_medicine: "var(--amber)",
};

export function Logs() {
  const [logs, setLogs] = useState<Entry[]>([]);

  useEffect(() => {
    const load = (): void => {
      get<Entry[]>("/api/admin/logs").then(setLogs).catch(() => {});
    };
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="label">Audit</p>
          <h2 className="text-xl">Activity log</h2>
        </div>
        <span className="chip">live · refreshes every 4s</span>
      </div>
      <div className="card max-h-[70vh] overflow-auto p-4 font-mono text-xs" style={{ background: "var(--surface-2)" }}>
        {logs.length === 0 && <p className="text-muted">No activity yet.</p>}
        {logs.map((l, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-line py-1.5">
            <span className="text-faint">{l.at}</span>
            <span className="font-semibold" style={{ color: COLOR[l.action] ?? "var(--muted)" }}>
              {l.action}
            </span>
            <span className="text-muted">{l.actor}</span>
            {l.detail && <span className="text-faint">{l.detail}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
