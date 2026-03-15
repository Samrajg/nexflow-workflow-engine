"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getWorkflow, updateWorkflow,
  getSteps, createStep, deleteStep
} from "@/lib/api";

interface Step {
  id: string;
  name: string;
  step_type: string;
  order: number;
  metadata: any;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  version: number;
  is_active: boolean;
  input_schema: any;
}

export default function WorkflowEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // New step form
  const [showStepForm, setShowStepForm] = useState(false);
  const [stepName, setStepName] = useState("");
  const [stepType, setStepType] = useState("approval");
  const [stepOrder, setStepOrder] = useState(1);
  const [stepMeta, setStepMeta] = useState("");
  const [stepLoading, setStepLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [wfRes, stepsRes] = await Promise.all([
        getWorkflow(id as string),
        getSteps(id as string),
      ]);
      setWorkflow(wfRes.data);
      setName(wfRes.data.name);
      setDescription(wfRes.data.description || "");
      setSteps(stepsRes.data);
      setStepOrder(stepsRes.data.length + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWorkflow(id as string, { name, description });
      fetchData();
    } catch (err) {
      alert("Failed to update workflow");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async () => {
    if (!stepName.trim()) {
      setError("Step name is required");
      return;
    }
    setStepLoading(true);
    setError("");
    try {
      let metadata = {};
      if (stepMeta.trim()) {
        metadata = JSON.parse(stepMeta);
      }
      await createStep(id as string, {
        name: stepName,
        step_type: stepType,
        order: stepOrder,
        metadata,
      });
      setStepName("");
      setStepType("approval");
      setStepMeta("");
      setShowStepForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add step");
    } finally {
      setStepLoading(false);
    }
  };

  const handleDeleteStep = async (stepId: string, stepName: string) => {
    if (!confirm(`Delete step "${stepName}"?`)) return;
    try {
      await deleteStep(id as string, stepId);
      fetchData();
    } catch (err) {
      alert("Failed to delete step");
    }
  };

  const stepTypeColor = (type: string) => {
    if (type === "approval") return "bg-violet-900/40 text-violet-400";
    if (type === "notification") return "bg-blue-900/40 text-blue-400";
    return "bg-gray-800 text-gray-400";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-gray-300 transition">Workflows</Link>
            <span>/</span>
            <span className="text-gray-300">{workflow?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Edit Workflow</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/execute/${id}`}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Execute
          </Link>
        </div>
      </div>

      {/* Workflow Info */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Workflow Info</h2>
          <span className="bg-gray-800 text-gray-400 text-xs px-2.5 py-1 rounded-full">
            v{workflow?.version}
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Steps</h2>
            <p className="text-gray-500 text-sm mt-0.5">{steps.length} steps defined</p>
          </div>
          <button
            onClick={() => setShowStepForm(!showStepForm)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Add Step
          </button>
        </div>

        {/* Add Step Form */}
        {showStepForm && (
          <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
            <h3 className="text-white font-medium mb-4">New Step</h3>
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 px-3 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Step Name *</label>
                <input
                  type="text"
                  value={stepName}
                  onChange={(e) => setStepName(e.target.value)}
                  placeholder="e.g. Manager Approval"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Step Type *</label>
                <select
                  value={stepType}
                  onChange={(e) => setStepType(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="approval">Approval</option>
                  <option value="notification">Notification</option>
                  <option value="task">Task</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Order *</label>
                <input
                  type="number"
                  value={stepOrder}
                  onChange={(e) => setStepOrder(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Metadata (JSON)</label>
                <input
                  type="text"
                  value={stepMeta}
                  onChange={(e) => setStepMeta(e.target.value)}
                  placeholder='{"assignee_email": "manager@example.com"}'
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddStep}
                disabled={stepLoading}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                {stepLoading ? "Adding..." : "Add Step"}
              </button>
              <button
                onClick={() => { setShowStepForm(false); setError(""); }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Steps List */}
        {steps.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No steps yet. Add your first step above.
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between bg-gray-800 rounded-xl px-5 py-4 border border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 font-bold text-sm">
                    {step.order}
                  </div>
                  <div>
                    <p className="text-white font-medium">{step.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {step.metadata && Object.keys(step.metadata).length > 0
                        ? Object.entries(step.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")
                        : "No metadata"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stepTypeColor(step.step_type)}`}>
                    {step.step_type}
                  </span>
                  <Link
                    href={`/workflows/${id}/steps/${step.id}/rules`}
                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    Rules
                  </Link>
                  <button
                    onClick={() => handleDeleteStep(step.id, step.name)}
                    className="text-red-500 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}