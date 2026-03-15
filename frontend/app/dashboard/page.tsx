"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard, approveExecution } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (executionId: string, approved: boolean) => {
    try {
      await approveExecution(executionId, approved, "dashboard-user");
      fetchDashboard();
    } catch (err) {
      alert("Action failed");
    }
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-green-900/40 text-green-400";
    if (status === "failed") return "bg-red-900/40 text-red-400";
    if (status === "waiting_approval") return "bg-yellow-900/40 text-yellow-400";
    if (status === "running") return "bg-blue-900/40 text-blue-400";
    return "bg-gray-800 text-gray-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const trend = data?.trend || [];
  const recentExecutions = data?.recent_executions || [];
  const pendingExecutions = data?.pending_executions || [];

  const maxTrendValue = Math.max(...trend.map((t: any) => t.completed + t.failed), 1);

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Business process automation overview</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
        >
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-gray-500 text-sm mb-1">Active Workflows</p>
          <p className="text-3xl font-bold text-white">{stats.total_workflows}</p>
          <p className="text-gray-600 text-xs mt-2">Total configured</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-yellow-800/40 p-5">
          <p className="text-gray-500 text-sm mb-1">Pending Approvals</p>
          <p className="text-3xl font-bold text-yellow-400">{stats.pending_approvals}</p>
          <p className="text-gray-600 text-xs mt-2">Waiting for action</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-green-800/40 p-5">
          <p className="text-gray-500 text-sm mb-1">Completed Today</p>
          <p className="text-3xl font-bold text-green-400">{stats.completed_today}</p>
          <p className="text-gray-600 text-xs mt-2">Successful executions</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-gray-500 text-sm mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-violet-400">{stats.success_rate}%</p>
          <p className="text-gray-600 text-xs mt-2">Of all executions</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Trend Chart */}
        <div className="col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-white font-semibold mb-6">Execution Trend — Last 7 Days</h2>
          <div className="flex items-end gap-3 h-40">
            {trend.map((day: any, i: number) => {
              const completedH = Math.round((day.completed / maxTrendValue) * 140);
              const failedH = Math.round((day.failed / maxTrendValue) * 140);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col-reverse gap-0.5">
                    {day.completed > 0 && (
                      <div
                        className="w-full bg-green-600/70 rounded-t"
                        style={{ height: `${completedH}px` }}
                        title={`${day.completed} completed`}
                      />
                    )}
                    {day.failed > 0 && (
                      <div
                        className="w-full bg-red-600/70 rounded-t"
                        style={{ height: `${failedH}px` }}
                        title={`${day.failed} failed`}
                      />
                    )}
                    {day.completed === 0 && day.failed === 0 && (
                      <div className="w-full bg-gray-800 rounded-t" style={{ height: "4px" }} />
                    )}
                  </div>
                  <span className="text-gray-600 text-xs">{day.date.split(" ")[1]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600/70 rounded-sm" />
              <span className="text-gray-500 text-xs">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600/70 rounded-sm" />
              <span className="text-gray-500 text-xs">Failed</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-white font-semibold mb-6">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Total Executions</span>
              <span className="text-white font-semibold">{stats.total_executions}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Total Failed</span>
              <span className="text-red-400 font-semibold">{stats.total_failed}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Pending Approvals</span>
              <span className="text-yellow-400 font-semibold">{stats.pending_approvals}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400 text-sm">Success Rate</span>
              <span className="text-green-400 font-semibold">{stats.success_rate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Inbox */}
      {pendingExecutions.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-yellow-800/30 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <h2 className="text-white font-semibold">Pending Approvals Inbox</h2>
            <span className="bg-yellow-900/40 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
              {pendingExecutions.length} waiting
            </span>
          </div>
          <div className="space-y-3">
            {pendingExecutions.map((ex: any) => (
              <div key={ex.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-gray-400 text-xs">{ex.id.slice(0, 8)}...</code>
                      <span className="text-yellow-400 text-xs bg-yellow-900/30 px-2 py-0.5 rounded">
                        {ex.waiting_step}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      {Object.entries(ex.input_data || {}).map(([k, v]) => (
                        <span key={k}>
                          <span className="text-gray-600">{k}:</span>{" "}
                          <span className="text-gray-300">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      Submitted {new Date(ex.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(ex.id, true)}
                      className="bg-green-700 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprove(ex.id, false)}
                      className="bg-red-900/50 hover:bg-red-900 text-red-300 px-4 py-1.5 rounded-lg text-sm font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Executions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Recent Executions</h2>
          <Link href="/audit" className="text-violet-400 hover:text-violet-300 text-sm transition">
            View all →
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-sm">
              <th className="text-left px-6 py-3 font-medium">Execution ID</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-left px-6 py-3 font-medium">Version</th>
              <th className="text-left px-6 py-3 font-medium">Started</th>
            </tr>
          </thead>
          <tbody>
            {recentExecutions.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No executions yet
                </td>
              </tr>
            ) : (
              recentExecutions.map((ex: any) => (
                <tr key={ex.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                  <td className="px-6 py-3">
                    <code className="text-gray-400 text-xs">{ex.id.slice(0, 8)}...</code>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(ex.status)}`}>
                      {ex.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-sm">v{ex.workflow_version}</td>
                  <td className="px-6 py-3 text-gray-400 text-sm">
                    {new Date(ex.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}