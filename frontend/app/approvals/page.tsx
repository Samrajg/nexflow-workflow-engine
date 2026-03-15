"use client";
import { useEffect, useState } from "react";
import { getDashboard, approveExecution } from "@/lib/api";
import Link from "next/link";

export default function ApprovalsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [done, setDone] = useState<any[]>([]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await getDashboard();
      setPending(res.data.pending_executions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (executionId: string, approved: boolean) => {
    setActionLoading(executionId);
    try {
      const res = await approveExecution(executionId, approved, "dashboard-manager");
      setPending((prev) => prev.filter((ex) => ex.id !== executionId));
      setDone((prev) => [{ ...res.data, action: approved ? "approved" : "rejected" }, ...prev]);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Approvals Inbox</h1>
          <p className="text-gray-400 mt-1">
            Review and act on pending workflow approvals
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pending.length > 0 && (
            <span className="bg-yellow-900/40 text-yellow-400 text-sm px-3 py-1 rounded-full font-medium">
              {pending.length} pending
            </span>
          )}
          <button
            onClick={fetchPending}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Pending Section */}
      <div className="mb-8">
        <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">
          Waiting for Action
        </h2>

        {loading ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading approvals...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">All caught up!</p>
            <p className="text-gray-500 text-sm">No pending approvals right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((ex) => (
              <div
                key={ex.id}
                className="bg-gray-900 rounded-xl border border-yellow-800/30 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Top row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      <span className="text-yellow-400 text-sm font-medium">
                        {ex.waiting_step}
                      </span>
                      <span className="text-gray-600 text-xs">—</span>
                      <code className="text-gray-500 text-xs">{ex.id.slice(0, 8)}...</code>
                    </div>

                    {/* Input data */}
                    <div className="bg-gray-800 rounded-lg p-3 mb-3">
                      <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">
                        Submitted Data
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(ex.input_data || {}).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">{k}:</span>
                            <span className="text-white text-xs font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Time */}
                    <p className="text-gray-600 text-xs">
                      Submitted {new Date(ex.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(ex.id, true)}
                      disabled={actionLoading === ex.id}
                      className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition min-w-24 text-center"
                    >
                      {actionLoading === ex.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleAction(ex.id, false)}
                      disabled={actionLoading === ex.id}
                      className="bg-red-900/50 hover:bg-red-900 disabled:opacity-50 text-red-300 px-5 py-2 rounded-lg text-sm font-medium transition min-w-24 text-center"
                    >
                      {actionLoading === ex.id ? "..." : "Reject"}
                    </button>
                    <Link
                      href={`/approve/${ex.id}`}
                      className="text-gray-500 hover:text-gray-300 text-xs text-center transition"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently actioned */}
      {done.length > 0 && (
        <div>
          <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">
            Recently Actioned This Session
          </h2>
          <div className="space-y-2">
            {done.map((ex, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 flex items-center justify-between ${
                  ex.action === "approved"
                    ? "bg-green-900/10 border-green-800/30"
                    : "bg-red-900/10 border-red-800/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    ex.action === "approved" ? "bg-green-400" : "bg-red-400"
                  }`} />
                  <code className="text-gray-400 text-xs">{ex.id.slice(0, 8)}...</code>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ex.action === "approved"
                      ? "bg-green-900/40 text-green-400"
                      : "bg-red-900/40 text-red-400"
                  }`}>
                    {ex.action}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ex.status === "completed"
                      ? "bg-green-900/40 text-green-400"
                      : ex.status === "waiting_approval"
                      ? "bg-yellow-900/40 text-yellow-400"
                      : "bg-red-900/40 text-red-400"
                  }`}>
                    {ex.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {Object.entries(ex.input_data || {}).slice(0, 2).map(([k, v]) => (
                    <span key={k}>{k}: <span className="text-gray-300">{String(v)}</span></span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}