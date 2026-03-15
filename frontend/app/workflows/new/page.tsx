"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkflow } from "@/lib/api";

interface SchemaField {
  key: string;
  type: string;
  required: boolean;
  allowed_values: string;
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<SchemaField[]>([
    { key: "", type: "string", required: true, allowed_values: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addField = () => {
    setFields([...fields, { key: "", type: "string", required: true, allowed_values: "" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const buildInputSchema = () => {
    const schema: any = {};
    fields.forEach((f) => {
      if (!f.key) return;
      schema[f.key] = {
        type: f.type,
        required: f.required,
        ...(f.allowed_values
          ? { allowed_values: f.allowed_values.split(",").map((v) => v.trim()) }
          : {}),
      };
    });
    return schema;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Workflow name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await createWorkflow({
        name,
        description,
        input_schema: buildInputSchema(),
      });
      router.push(`/workflows/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create workflow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Create Workflow</h1>
        <p className="text-gray-400 mt-1">Define your workflow and its input schema</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Basic Info</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Workflow Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Expense Approval"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Input Schema */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Input Schema</h2>
            <p className="text-gray-500 text-sm mt-0.5">Define the fields this workflow accepts</p>
          </div>
          <button
            onClick={addField}
            className="text-sm text-violet-400 hover:text-violet-300 transition"
          >
            + Add Field
          </button>
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 text-xs text-gray-500 px-1">
            <div className="col-span-3">Field Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Required</div>
            <div className="col-span-4">Allowed Values</div>
            <div className="col-span-1"></div>
          </div>

          {fields.map((field, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3">
                <input
                  type="text"
                  value={field.key}
                  onChange={(e) => updateField(index, "key", e.target.value)}
                  placeholder="e.g. amount"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="col-span-2">
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, "type", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, "required", e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
                />
                <span className="text-sm text-gray-400">Yes</span>
              </div>
              <div className="col-span-4">
                <input
                  type="text"
                  value={field.allowed_values}
                  onChange={(e) => updateField(index, "allowed_values", e.target.value)}
                  placeholder="High,Medium,Low"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => removeField(index)}
                  className="text-red-500 hover:text-red-400 text-lg transition"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition"
        >
          {loading ? "Creating..." : "Create Workflow"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}