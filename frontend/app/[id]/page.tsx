"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getWorkflow, startExecution } from "./lib/api";

export default function ExecutePage() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [inputData, setInputData] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkflow(id as string).then((res) => {
      setWorkflow(res.data);
      // Pre-fill input fields from schema
      const defaults: any = {};
      Object.keys(res.data.input_schema).forEach((key) => {
        defaults[key] = "";
      });
      setInputData(defaults);
    });
  }, [id]);

  const handleExecute = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      // Convert number fields
      const processedData: any = {};
      Object.entries(inputData).forEach(([key, value]) => {
        const fieldSchema = workflow.input_schema[key];
        if (fieldSchema?.type === "number") {
          processedData[key] = Number(value);
        } else {
          processedData[key] = value;
        }
      });

      const res = await startExecution({
        workflow_id: id,
        input_data: processedData,
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Execution failed");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "text-green-400 bg-green-900/30";
    if (status === "failed") return "text-red-400 bg-red-900/30";
    if (status === "running") return "text-yellow-400 bg-yellow-900/30";
    return "text-gray-400 bg-gray-800";
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-300">Workflows</Link>
        <span>/</span>
        <span className="text-gray-300">Execute — {workflow?.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-8">Run Workflow</h1>

      {/* Input Form */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Input Data
          <span className="text-gray-500 text-sm font-normal ml-2">
            — {workflow?.name} v{workflow?.version}
          </span>
        </h2>

        {workflow && (
          <div className="space-y-4">
            {Object.entries(workflow.input_schema).map(([key, schema]: [string, any]) => (
              <div key={key}>
                <label className="text-sm text-gray-400 mb-1.5 flex items-center gap-2 block">
                  {key}
                  <span className="text-gray-600 text-xs">({schema.type})</span>
                  {schema.required && (
                    <span className="text-red-500 text-xs">required</span>
                  )}
                </label>
                {schema.allowed_values ? (
                  <select
                    value={inputData[key] || ""}
                    onChange={(e) => setInputData({ ...inputData, [key]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                  >
                    <option value="">Select {key}</option>
                    {schema.allowed_values.map((v: string) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={schema.type === "number" ? "number" : "text"}
                    value={inputData[key] || ""}
                    onChange={(e) => setInputData({ ...inputData, [key]: e.target.value })}
                    placeholder={`Enter ${key}`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mt-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleExecute}
          disabled={loading}
          className="mt-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition"
        >
          {loading ? "Running..." : "Start Execution"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Execution Result</h2>
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${statusColor(result.status)}`}>
              {result.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4">
            {result.step_logs.map((log: any, index: number) => (
              <div key={index} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      log.status === "completed" ? "bg-green-400" : "bg-red-400"
                    }`} />
                    <span className="text-white font-medium">{log.step_name}</span>
                    <span className="text-gray-500 text-xs bg-gray-700 px-2 py-0.5 rounded">
                      {log.step_type}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {log.duration_seconds?.toFixed(2)}s
                  </span>
                </div>

                {/* Evaluated Rules */}
                <div className="space-y-2 mb-4">
                  {log.evaluated_rules.map((rule: any, rIndex: number) => (
                    <div key={rIndex} className="flex items-center gap-3 text-sm">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        rule.result ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-500"
                      }`}>
                        {rule.result ? "✓" : "✗"}
                      </span>
                      <code className="text-gray-300 text-xs font-mono flex-1">
                        {rule.condition}
                      </code>
                      <span className={`text-xs ${rule.result ? "text-green-400" : "text-gray-600"}`}>
                        {rule.result ? "matched" : "skipped"}
                      </span>
                    </div>
                  ))}
                </div>

                {log.selected_next_step && (
                  <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
                    Next step: <span className="text-blue-400">{log.selected_next_step}</span>
                  </div>
                )}
                {log.error_message && (
                  <div className="text-xs text-red-400 border-t border-gray-700 pt-3">
                    Error: {log.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}