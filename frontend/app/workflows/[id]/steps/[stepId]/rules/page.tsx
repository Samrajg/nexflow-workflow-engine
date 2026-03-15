"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRules, createRule, deleteRule, getSteps, getWorkflow } from "@/lib/api";

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

interface ConditionGroup {
  field: string;
  operator: string;
  value: string;
  logic: "and" | "or";
}

const OPERATORS = [
  { label: "equals", value: "==" },
  { label: "not equals", value: "!=" },
  { label: "greater than", value: ">" },
  { label: "less than", value: "<" },
  { label: "greater than or equal", value: ">=" },
  { label: "less than or equal", value: "<=" },
  { label: "contains", value: "in" },
];

export default function RuleEditorPage() {
  const { id, stepId } = useParams();
  const [rules, setRules] = useState<Rule[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [priority, setPriority] = useState(1);
  const [nextStepId, setNextStepId] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [schemaFields, setSchemaFields] = useState<string[]>([]);

  // Condition groups for builder
  const [conditions, setConditions] = useState<ConditionGroup[]>([
    { field: "", operator: "==", value: "", logic: "and" }
  ]);

  const fetchData = async () => {
    try {
      const [rulesRes, stepsRes, wfRes] = await Promise.all([
        getRules(stepId as string),
        getSteps(id as string),
        getWorkflow(id as string),
      ]);
      setRules(rulesRes.data);
      setSteps(stepsRes.data);
      const current = stepsRes.data.find((s: Step) => s.id === stepId);
      setCurrentStep(current || null);
      setPriority(rulesRes.data.length + 1);

      // Extract schema fields
      const schema = wfRes.data.input_schema || {};
      setSchemaFields(Object.keys(schema));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [stepId]);

  const addCondition = (logic: "and" | "or") => {
    setConditions([...conditions, { field: "", operator: "==", value: "", logic }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, key: keyof ConditionGroup, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: value };
    setConditions(updated);
  };

  const buildConditionString = (): string => {
    if (isDefault) return "DEFAULT";

    return conditions
      .map((c, i) => {
        if (!c.field || !c.value) return null;
        let expr = "";
        if (c.operator === "in") {
          expr = `'${c.value}' in ${c.field}`;
        } else if (c.operator === "==" && isNaN(Number(c.value))) {
          expr = `${c.field} ${c.operator} '${c.value}'`;
        } else {
          expr = `${c.field} ${c.operator} ${c.value}`;
        }
        if (i === 0) return expr;
        return `${c.logic} ${expr}`;
      })
      .filter(Boolean)
      .join(" ");
  };

  const handleAddRule = async () => {
    const conditionStr = buildConditionString();
    if (!conditionStr) {
      setError("Please fill in all condition fields");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createRule(stepId as string, {
        condition: conditionStr,
        next_step_id: nextStepId || null,
        priority,
      });
      setConditions([{ field: "", operator: "==", value: "", logic: "and" }]);
      setNextStepId("");
      setIsDefault(false);
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

  const conditionPreview = buildConditionString();

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-300">Home</Link>
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

      {/* Rule Builder Form */}
      {showForm && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
          <h3 className="text-white font-medium mb-5">Build Rule</h3>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-3 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* DEFAULT toggle */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-gray-800 rounded-lg">
            <input
              type="checkbox"
              id="is-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 accent-violet-600"
            />
            <label htmlFor="is-default" className="text-gray-300 text-sm cursor-pointer">
              This is a DEFAULT rule (catches all unmatched conditions)
            </label>
          </div>

          {/* Condition Builder */}
          {!isDefault && (
            <div className="space-y-3 mb-5">
              {conditions.map((condition, index) => (
                <div key={index}>
                  {/* Logic connector */}
                  {index > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px bg-gray-700" />
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateCondition(index, "logic", "and")}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            condition.logic === "and"
                              ? "bg-violet-600 text-white"
                              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                          }`}
                        >
                          AND
                        </button>
                        <button
                          onClick={() => updateCondition(index, "logic", "or")}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            condition.logic === "or"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                          }`}
                        >
                          OR
                        </button>
                      </div>
                      <div className="flex-1 h-px bg-gray-700" />
                    </div>
                  )}

                  {/* Condition row */}
                  <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-4">
                    {/* Field */}
                    <div className="flex-1">
                      <label className="text-gray-500 text-xs mb-1 block">Field</label>
                      {schemaFields.length > 0 ? (
                        <select
                          value={condition.field}
                          onChange={(e) => updateCondition(index, "field", e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                        >
                          <option value="">Select field</option>
                          {schemaFields.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={condition.field}
                          onChange={(e) => updateCondition(index, "field", e.target.value)}
                          placeholder="e.g. amount"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                        />
                      )}
                    </div>

                    {/* Operator */}
                    <div className="w-44">
                      <label className="text-gray-500 text-xs mb-1 block">Operator</label>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, "operator", e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Value */}
                    <div className="flex-1">
                      <label className="text-gray-500 text-xs mb-1 block">Value</label>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, "value", e.target.value)}
                        placeholder="e.g. 100"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* Remove */}
                    {conditions.length > 1 && (
                      <button
                        onClick={() => removeCondition(index)}
                        className="text-gray-600 hover:text-red-400 transition mt-5 flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add condition buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => addCondition("and")}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
                >
                  <span className="text-violet-400 font-bold">+</span> AND condition
                </button>
                <button
                  onClick={() => addCondition("or")}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
                >
                  <span className="text-blue-400 font-bold">+</span> OR condition
                </button>
              </div>
            </div>
          )}

          {/* Condition preview */}
          {conditionPreview && (
            <div className="bg-gray-800 rounded-lg p-3 mb-5">
              <p className="text-gray-500 text-xs mb-1">Condition preview:</p>
              <code className="text-green-400 text-sm">{conditionPreview}</code>
            </div>
          )}

          {/* Next step + priority */}
          <div className="grid grid-cols-2 gap-4 mb-5">
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
              onClick={() => { setShowForm(false); setError(""); setIsDefault(false); setConditions([{ field: "", operator: "==", value: "", logic: "and" }]); }}
              className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </button>
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
                    <code className={`text-sm px-3 py-1.5 rounded-lg ${
                      rule.condition === "DEFAULT"
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-800 text-green-400"
                    }`}>
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