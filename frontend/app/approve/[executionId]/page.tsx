"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";

export default function ApprovePage() {
  const { executionId } = useParams();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [executed, setExecuted] = useState(false);

  useEffect(() => {
    if (action && !executed) {
      setExecuted(true);
      handleAction(action === "approve");
    }
  }, [action]);

  const handleAction = async (approved: boolean) => {
    setStatus("loading");
    try {
      const res = await api.post(`/api/executions/${executionId}/approve`, {
        approved,
        approver_id: "email-approver",
      });
      setResult(res.data);
      setStatus("success");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Processing your decision...</p>
        </div>
      </div>
    );
  }

  if (status === "success" && result) {
    const approved = result.status !== "failed" && result.status !== "cancelled";

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">

          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            approved ? "bg-green-900/40" : "bg-red-900/40"
          }`}>
            {approved ? (
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold mb-2 ${approved ? "text-green-400" : "text-red-400"}`}>
            {approved ? "Approved!" : "Rejected"}
          </h1>

          {/* Description */}
          <p className="text-gray-400 mb-6">
            {approved
              ? result.status === "completed"
                ? "The workflow has been fully completed successfully."
                : result.status === "waiting_approval"
                ? "Your approval was recorded. The workflow is now waiting for the next approver."
                : "The workflow has been approved and is continuing."
              : "The workflow has been rejected and marked as failed."}
          </p>

          {/* Execution details */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 text-sm">Execution ID</span>
              <code className="text-gray-300 text-xs">{result.id?.slice(0, 8)}...</code>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 text-sm">Status</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                result.status === "completed"
                  ? "bg-green-900/40 text-green-400"
                  : result.status === "waiting_approval"
                  ? "bg-yellow-900/40 text-yellow-400"
                  : result.status === "failed"
                  ? "bg-red-900/40 text-red-400"
                  : "bg-gray-700 text-gray-400"
              }`}>
                {result.status.toUpperCase().replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Steps completed</span>
              <span className="text-gray-300 text-sm">{result.step_logs?.length || 0}</span>
            </div>
          </div>

          {/* Step logs summary */}
          {result.step_logs?.length > 0 && (
            <div className="text-left mb-6">
              <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Step Summary</p>
              <div className="space-y-2">
                {result.step_logs.map((log: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      log.status === "completed" || log.status === "approved"
                        ? "bg-green-400"
                        : log.status === "waiting_approval"
                        ? "bg-yellow-400 animate-pulse"
                        : "bg-red-400"
                    }`} />
                    <span className="text-gray-300 text-sm flex-1">{log.step_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      log.status === "completed" || log.status === "approved"
                        ? "bg-green-900/30 text-green-400"
                        : log.status === "waiting_approval"
                        ? "bg-yellow-900/30 text-yellow-400"
                        : "bg-red-900/30 text-red-400"
                    }`}>
                      {log.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status specific banners */}
          {result.status === "completed" && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-3 mb-4">
              <p className="text-green-400 text-sm font-medium">
                Workflow completed successfully!
              </p>
            </div>
          )}
          {result.status === "waiting_approval" && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                <p className="text-yellow-400 text-sm">
                  Next approval step is pending — another approver has been notified.
                </p>
              </div>
            </div>
          )}
          {result.status === "failed" && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 mb-4">
              <p className="text-red-400 text-sm font-medium">
                Workflow has been rejected and marked as failed.
              </p>
            </div>
          )}

          <p className="text-gray-600 text-xs mt-2">
            You can close this window now.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-900/40 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Action Failed</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleAction(true)}
              className="bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Try Approve
            </button>
            <button
              onClick={() => handleAction(false)}
              className="bg-red-900/60 hover:bg-red-900 text-red-300 px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Try Reject
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Idle — opened directly without action param
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-yellow-900/40 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Approval Required</h1>
        <p className="text-gray-400 mb-2">Execution ID:</p>
        <code className="text-violet-400 text-sm bg-gray-800 px-3 py-1.5 rounded-lg block mb-6">
          {executionId}
        </code>
        <p className="text-gray-500 text-sm mb-8">
          Please review and take action on this workflow execution.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleAction(true)}
            className="bg-green-700 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-medium transition"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(false)}
            className="bg-red-900/60 hover:bg-red-900 text-red-300 px-8 py-3 rounded-xl font-medium transition"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}