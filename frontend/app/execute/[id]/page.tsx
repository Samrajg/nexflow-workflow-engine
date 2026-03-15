"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getWorkflow, startExecution, getExecution } from "@/lib/api";
import ExecutionTimeline from "@/components/ExecutionTimeline";

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
];

const RATES: Record<string, number> = {
  IN: 1, US: 83, GB: 106, DE: 90, FR: 90, IT: 90, ES: 90,
  NL: 90, SE: 8, AE: 22, SG: 62, AU: 54, CA: 61, JP: 0.55,
  CN: 11.5, KR: 0.063, BR: 17, MX: 4.8, ZA: 4.5, NG: 0.055
};

const CURRENCY_NAMES: Record<string, string> = {
  IN: "INR", US: "USD", GB: "GBP", DE: "EUR", FR: "EUR",
  IT: "EUR", ES: "EUR", NL: "EUR", SE: "SEK", AE: "AED",
  SG: "SGD", AU: "AUD", CA: "CAD", JP: "JPY", CN: "CNY",
  KR: "KRW", BR: "BRL", MX: "MXN", ZA: "ZAR", NG: "NGN"
};

const getAmountInINR = (amount: string, country: string): number => {
  const rate = RATES[country] || 1;
  return Math.round(parseFloat(amount) * rate);
};

const getCurrencyName = (country: string): string => {
  return CURRENCY_NAMES[country] || "INR";
};

const getApprovalTier = (amountInr: number): string => {
  if (amountInr < 2500) return "Manager approval only";
  if (amountInr <= 10000) return "Manager + Finance approval";
  return "Manager + Finance + CEO approval";
};

function CountrySelector({ value, onChange, error }: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const selected = COUNTRIES.find(c => c.code === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-left flex items-center gap-3 transition ${
          error ? "border-red-500" : "border-gray-700 hover:border-gray-600"
        }`}
      >
        {selected ? (
          <>
            <span style={{ fontSize: "20px" }}>{selected.flag}</span>
            <span className="text-white text-sm flex-1">{selected.name}</span>
            <span className="text-gray-500 text-xs">{selected.code}</span>
          </>
        ) : (
          <span className="text-gray-500 text-sm flex-1">Select country</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">No countries found</div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country.code);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-700 transition text-left ${
                    value === country.code ? "bg-violet-900/30" : ""
                  }`}
                >
                  <span style={{ fontSize: "20px" }}>{country.flag}</span>
                  <span className="text-white text-sm flex-1">{country.name}</span>
                  <span className="text-gray-500 text-xs">{country.code}</span>
                  {value === country.code && (
                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExecutePage() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [inputData, setInputData] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getWorkflow(id as string).then((res) => {
      setWorkflow(res.data);
      const defaults: any = {};
      Object.keys(res.data.input_schema).forEach((key) => {
        defaults[key] = "";
      });
      setInputData(defaults);
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  useEffect(() => {
    if (!result) return;
    if (result.status === "waiting_approval" || result.status === "running") {
      pollRef.current = setInterval(async () => {
        try {
          const res = await getExecution(result.id);
          setResult(res.data);
          if (["completed", "failed", "cancelled"].includes(res.data.status)) {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [result?.id, result?.status]);

  const validateInputs = () => {
    const errors: Record<string, string> = {};
    Object.entries(workflow.input_schema).forEach(([key, schema]: [string, any]) => {
      const value = inputData[key];
      if (schema.required && (value === "" || value === null || value === undefined)) {
        errors[key] = `This field is required`;
        return;
      }
      if (value === "" || value === null || value === undefined) return;
      if (schema.type === "number" && isNaN(Number(value))) {
        errors[key] = `Must be a valid number`;
      }
      if (schema.allowed_values && !schema.allowed_values.includes(value)) {
        errors[key] = `Must be one of: ${schema.allowed_values.join(", ")}`;
      }
    });
    return errors;
  };

  const handleExecute = async () => {
    const validationErrors = validateInputs();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setError("");
    setResult(null);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
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
    if (status === "running") return "text-blue-400 bg-blue-900/30";
    if (status === "waiting_approval") return "text-yellow-400 bg-yellow-900/30";
    if (status === "cancelled") return "text-gray-400 bg-gray-800";
    return "text-gray-400 bg-gray-800";
  };

  const orderedKeys = (schema: any): string[] => {
    if (!schema) return [];
    const keys = Object.keys(schema);
    const priority = ["country", "amount"];
    const ordered = [
      ...priority.filter(k => keys.includes(k)),
      ...keys.filter(k => !priority.includes(k))
    ];
    return ordered;
  };

  const renderField = (key: string, schema: any) => {
    if (key === "country") {
      return (
        <div key={key}>
          <label className="text-sm text-gray-300 mb-1.5 flex items-center gap-2 block">
            Country
            {schema.required && <span className="text-red-500 text-xs">*</span>}
          </label>
          <CountrySelector
            value={inputData[key] || ""}
            onChange={(val) => {
              setInputData({ ...inputData, [key]: val });
              setFieldErrors((prev) => ({ ...prev, [key]: "" }));
            }}
            error={fieldErrors[key]}
          />
          {fieldErrors[key] && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
              <p className="text-red-400 text-xs">{fieldErrors[key]}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={key}>
        <label className="text-sm text-gray-300 mb-1.5 flex items-center gap-2 block capitalize">
          {key.replace(/_/g, " ")}
          {schema.required && <span className="text-red-500 text-xs">*</span>}
        </label>
        {schema.allowed_values ? (
          <select
            value={inputData[key] || ""}
            onChange={(e) => {
              setInputData({ ...inputData, [key]: e.target.value });
              setFieldErrors((prev) => ({ ...prev, [key]: "" }));
            }}
            className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none transition ${
              fieldErrors[key] ? "border-red-500" : "border-gray-700 focus:border-violet-500"
            }`}
          >
            <option value="">Select {key.replace(/_/g, " ")}</option>
            {schema.allowed_values.map((v: string) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        ) : (
          <input
            type={schema.type === "number" ? "number" : "text"}
            value={inputData[key] || ""}
            onChange={(e) => {
              setInputData({ ...inputData, [key]: e.target.value });
              setFieldErrors((prev) => ({ ...prev, [key]: "" }));
            }}
            placeholder={`Enter ${key.replace(/_/g, " ")}`}
            className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none transition ${
              fieldErrors[key] ? "border-red-500" : "border-gray-700 focus:border-violet-500"
            }`}
          />
        )}
        {fieldErrors[key] && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
            <p className="text-red-400 text-xs">{fieldErrors[key]}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Request for Approval</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Fill in the details below to submit your request
        </p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-6">
          {workflow?.name}
        </h2>

        {workflow && (
          <div className="space-y-5">
            {orderedKeys(workflow.input_schema).map((key) =>
              renderField(key, workflow.input_schema[key])
            )}
          </div>
        )}

        {/* INR conversion banner — shows as soon as country + amount filled */}
        {inputData.country && inputData.amount && !isNaN(parseFloat(inputData.amount)) && (
          <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg px-4 py-3 mt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">
                  {inputData.amount} {getCurrencyName(inputData.country)}
                </span>
                <span className="text-gray-600">≈</span>
                <span className="text-white font-semibold text-sm">
                  ₹{getAmountInINR(inputData.amount, inputData.country).toLocaleString("en-IN")} INR
                </span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                getAmountInINR(inputData.amount, inputData.country) < 2500
                  ? "bg-green-900/40 text-green-400"
                  : getAmountInINR(inputData.amount, inputData.country) <= 10000
                  ? "bg-yellow-900/40 text-yellow-400"
                  : "bg-red-900/40 text-red-400"
              }`}>
                {getApprovalTier(getAmountInINR(inputData.amount, inputData.country))}
              </span>
            </div>
          </div>
        )}

        {Object.keys(fieldErrors).filter(k => fieldErrors[k]).length > 0 && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg px-4 py-3 mt-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
            <p className="text-red-400 text-sm">
              Please fix {Object.keys(fieldErrors).filter(k => fieldErrors[k]).length} error{Object.keys(fieldErrors).filter(k => fieldErrors[k]).length > 1 ? "s" : ""} before submitting
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mt-5 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleExecute}
          disabled={loading}
          className="mt-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Submit Request
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Request Status</h2>
            <p className="text-gray-600 text-xs mt-0.5">ID: {result.id}</p>
          </div>
          <div className="flex items-center gap-3">
            {(result.status === "waiting_approval" || result.status === "running") && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                Auto-refreshing...
              </div>
            )}
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${statusColor(result.status)}`}>
              {result.status.toUpperCase().replace("_", " ")}
            </span>
          </div>
        </div>
      )}

      {result?.status === "waiting_approval" && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <p className="text-yellow-400 font-medium">Waiting for Approval</p>
          </div>
          <p className="text-yellow-600 text-sm">
            Your request has been submitted and is waiting for approval.
            This page will update automatically once the approver takes action.
          </p>
          {result.step_logs?.find((l: any) => l.status === "waiting_approval")?.assignee_email && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-gray-500 text-xs">Approval request sent to:</span>
              <span className="text-violet-400 text-xs font-medium">
                {result.step_logs.find((l: any) => l.status === "waiting_approval").assignee_email}
              </span>
            </div>
          )}
        </div>
      )}

      {result?.status === "completed" && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-400 font-medium">Your request has been approved and completed!</p>
          </div>
        </div>
      )}

      {result?.status === "failed" && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-red-400 font-medium">Your request was rejected.</p>
          </div>
        </div>
      )}

      {result && (
        <ExecutionTimeline
          stepLogs={result.step_logs}
          status={result.status}
        />
      )}
    </div>
  );
}