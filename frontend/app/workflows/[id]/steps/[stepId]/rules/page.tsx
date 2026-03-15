"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getRules, createRule, updateRule, deleteRule, getSteps } from "@/lib/api";

interface Rule {
  id: string;
  condition: string;
  next_step_id: string | null;
  priority: number;
}

interface Step {
  id: string;
  name: string;
  order: number;
}

export default function RuleEditorPage() {
  const { id, stepId } = useParams();
  const [rules, setRules] = useState<Rule[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [condition, setCondition] = useState("");
  const [nextStepId, setNextStepId] = useState("");
  const [priority, setPriority] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState<Step | null>(null);

  const fetchData = async () => {
    try {
      const [rulesRes, stepsRes] = await Promise.all([
        getRules(stepId as string),
        getSteps(id as string),
      ]);
      setRules(rulesRes.data);
      setSteps(stepsRes.data);
      const current = stepsRes.data.find((s: Step) => s.id === stepId);
      setCurrentStep(current || null);
      setPriority(rulesRes.data.length + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [stepId]);

  const handleAddRule = async () => {
    if (!condition.trim()) {
      setError("Condition is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createRule(stepId as string, {
        condition,
        next_step_id: nextStepId || null,
        priority,
      });
      setCondition("");
      setNextStepId("");
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await deleteRule(stepId as string, ruleId);
      fetchData();
    } catch {
      alert("Failed to delete rule");
    }
  };

  const getStepName = (stepId: string | null) => {
    if (!stepId) return "End workflow";
    const step = steps.find((s) => s.id === stepId);
    return step ? step.name : "Unknown";
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-300">Workflows</Link>
        <span>/</span>
        <Link href={`/workflows/${id}`} className="hover:text-gray-300">Editor</Link>
        <span>/</span>
        <span className="text-gray-300">{currentStep?.name} — Rules</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Rule Editor</h1>
          <p className="text-gray-400 mt-1">
            Step: <span className="text-violet-400">{currentStep?.name}</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Add Rule
        </button>
      </div>

      {/* Add Rule Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <h3 className="text-white font-medium mb-4">New Rule</h3>
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-3 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Condition *</label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. amount > 100 and country == 'US' or DEFAULT"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 font-mono"
              />
              <p className="text-gray-600 text-xs mt-1">
                Use: and, or, ==, !=, &gt;, &lt;, &gt;=, &lt;= or DEFAULT
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Next Step</label>
                <select
                  value={nextStepId}
                  onChange={(e) => setNextStepId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="">End workflow</option>
                  {steps
                    .filter((s) => s.id !== stepId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.order}. {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Priority</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  min={1}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddRule}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
              >
                {saving ? "Saving..." : "Save Rule"}
              </button>
              <button
                onClick={() => { setShowForm(false); setError(""); }}
                className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-sm">
              <th className="text-left px-6 py-4 font-medium w-16">Priority</th>
              <th className="text-left px-6 py-4 font-medium">Condition</th>
              <th className="text-left px-6 py-4 font-medium">Next Step</th>
              <th className="text-left px-6 py-4 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">Loading...</td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500">
                  No rules yet. Add your first rule above.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4">
                    <span className="w-8 h-8 bg-violet-900/40 text-violet-400 rounded-lg flex items-center justify-center text-sm font-bold">
                      {rule.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-green-400 text-sm bg-gray-800 px-3 py-1.5 rounded-lg">
                      {rule.condition}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      rule.next_step_id
                        ? "bg-blue-900/30 text-blue-400"
                        : "bg-gray-800 text-gray-500"
                    }`}>
                      {getStepName(rule.next_step_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-500 hover:text-red-400 text-sm transition"
                    >
                      Delete
                    </button>
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