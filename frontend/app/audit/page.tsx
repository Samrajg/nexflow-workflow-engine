"use client";
import { useEffect, useState } from "react";
import { getExecutions } from "@/lib/api";
import Link from "next/link";

export default function AuditPage() {
  const [executions, setExecutions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const res = await getExecutions(page, status);
      setExecutions(res.data.executions);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [page, status]);

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-green-900/40 text-green-400";
    if (s === "failed") return "bg-red-900/40 text-red-400";
    if (s === "running") return "bg-yellow-900/40 text-yellow-400";
    if (s === "cancelled") return "bg-gray-800 text-gray-400";
    return "bg-gray-800 text-gray-400";
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-gray-400 mt-1">All workflow executions and their results</p>
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Executions List */}
        <div className="col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm">
                <th className="text-left px-6 py-4 font-medium">Execution ID</th>
                <th className="text-left px-6 py-4 font-medium">Status</th>
                <th className="text-left px-6 py-4 font-medium">Version</th>
                <th className="text-left px-6 py-4 font-medium">Started</th>
                <th className="text-left px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">Loading...</td>
                </tr>
              ) : executions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">No executions found</td>
                </tr>
              ) : (
                executions.map((ex) => (
                  <tr
                    key={ex.id}
                    className={`border-b border-gray-800 hover:bg-gray-800/50 transition cursor-pointer ${
                      selected?.id === ex.id ? "bg-gray-800/70" : ""
                    }`}
                    onClick={() => setSelected(ex)}
                  >
                    <td className="px-6 py-4">
                      <code className="text-gray-400 text-xs">{ex.id.slice(0, 8)}...</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(ex.status)}`}>
                        {ex.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">v{ex.workflow_version}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(ex.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(ex); }}
                        className="text-violet-400 hover:text-violet-300 text-xs transition"
                      >
                        View Logs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Log Detail Panel */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 overflow-y-auto max-h-[600px]">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Click an execution to view logs
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">Execution Logs</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              <div className="space-y-3">
                {selected.step_logs.map((log: any, i: number) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === "completed" ? "bg-green-400" : "bg-red-400"
                      }`} />
                      <span className="text-white text-sm font-medium">{log.step_name}</span>
                    </div>
                    <div className="space-y-1.5">
                      {log.evaluated_rules.map((rule: any, ri: number) => (
                        <div key={ri} className="flex items-center gap-2 text-xs">
                          <span className={rule.result ? "text-green-400" : "text-gray-600"}>
                            {rule.result ? "✓" : "✗"}
                          </span>
                          <code className="text-gray-400 font-mono truncate">{rule.condition}</code>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {log.duration_seconds?.toFixed(2)}s
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="flex gap-2 mt-6 justify-end">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 10 >= total}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}