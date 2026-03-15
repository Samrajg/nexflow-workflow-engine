"use client";
import { useEffect, useState } from "react";
import { getWorkflows, deleteWorkflow } from "@/lib/api";
import Link from "next/link";

interface Workflow {
  id: string;
  name: string;
  description: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await getWorkflows(page, search);
      setWorkflows(res.data.workflows);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [page, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete workflow "${name}"?`)) return;
    try {
      await deleteWorkflow(id);
      fetchWorkflows();
    } catch (err) {
      alert("Failed to delete workflow");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Workflow Engine</h1>
          <p className="text-gray-400 mt-1">Manage and execute your workflows</p>
        </div>
        <Link
          href="/workflows/new"
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          + New Workflow
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-sm">
              <th className="text-left px-6 py-4 font-medium">Name</th>
              <th className="text-left px-6 py-4 font-medium">Version</th>
              <th className="text-left px-6 py-4 font-medium">Status</th>
              <th className="text-left px-6 py-4 font-medium">Created</th>
              <th className="text-left px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : workflows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">
                  No workflows found. Create your first one!
                </td>
              </tr>
            ) : (
              workflows.map((wf) => (
                <tr
                  key={wf.id}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{wf.name}</div>
                    {wf.description && (
                      <div className="text-sm text-gray-500 mt-0.5">{wf.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                      v{wf.version}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      wf.is_active
                        ? "bg-green-900/50 text-green-400"
                        : "bg-gray-800 text-gray-500"
                    }`}>
                      {wf.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(wf.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/workflows/${wf.id}`}
                        className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg transition"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/execute/${wf.id}`}
                        className="bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 text-sm px-3 py-1.5 rounded-lg transition"
                      >
                        Execute
                      </Link>
                      <button
                        onClick={() => handleDelete(wf.id, wf.name)}
                        className="bg-red-900/20 hover:bg-red-900/40 text-red-400 text-sm px-3 py-1.5 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-gray-500 text-sm">
            Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
          </p>
          <div className="flex gap-2">
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
        </div>
      )}

      {/* Audit Log Link */}
      <div className="mt-8 text-center">
        <Link href="/audit" className="text-gray-500 hover:text-gray-300 text-sm transition">
          View Audit Log →
        </Link>
      </div>
    </div>
  );
}