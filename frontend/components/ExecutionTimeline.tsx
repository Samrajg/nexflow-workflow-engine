interface StepLog {
  step_id: string;
  step_name: string;
  step_type: string;
  status: string;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  evaluated_rules: any[];
  selected_next_step: string | null;
  error_message: string | null;
  assignee_email: string | null;
  approver_id: string | null;
}

interface Props {
  stepLogs: StepLog[];
  status: string;
}

export default function ExecutionTimeline({ stepLogs, status }: Props) {
  const stepColor = (status: string) => {
    if (status === "completed" || status === "approved") return "bg-green-500";
    if (status === "waiting_approval") return "bg-yellow-400";
    if (status === "failed" || status === "rejected") return "bg-red-500";
    if (status === "running") return "bg-blue-500 animate-pulse";
    return "bg-gray-600";
  };

  const stepBorder = (status: string) => {
    if (status === "completed" || status === "approved") return "border-green-500";
    if (status === "waiting_approval") return "border-yellow-400";
    if (status === "failed" || status === "rejected") return "border-red-500";
    if (status === "running") return "border-blue-500";
    return "border-gray-600";
  };

  const stepIcon = (status: string) => {
    if (status === "completed" || status === "approved") return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    );
    if (status === "waiting_approval") return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
    if (status === "failed" || status === "rejected") return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
    return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
  };

  const typeColor = (type: string) => {
    if (type === "approval") return "text-violet-400 bg-violet-900/30";
    if (type === "notification") return "text-blue-400 bg-blue-900/30";
    return "text-gray-400 bg-gray-800";
  };

  if (!stepLogs || stepLogs.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h2 className="text-white font-semibold mb-8">Execution Timeline</h2>

      {/* Timeline */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-700 z-0" />

        {/* Steps */}
        <div className="relative z-10 flex justify-between mb-10">
          {stepLogs.map((log, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              {/* Circle */}
              <div className={`w-10 h-10 rounded-full border-2 ${stepBorder(log.status)} ${stepColor(log.status)} flex items-center justify-center mb-3 shadow-lg`}>
                {stepIcon(log.status)}
              </div>
              {/* Step name */}
              <p className="text-white text-xs font-medium text-center max-w-20 leading-tight mb-1">
                {log.step_name}
              </p>
              {/* Type badge */}
              <span className={`text-xs px-1.5 py-0.5 rounded text-center mb-1 ${typeColor(log.step_type)}`}>
                {log.step_type}
              </span>
              {/* Duration */}
              {log.duration_seconds != null && (
                <span className="text-gray-600 text-xs">{log.duration_seconds.toFixed(2)}s</span>
              )}
              {/* Status label */}
              <span className={`text-xs mt-1 ${
                log.status === "completed" || log.status === "approved"
                  ? "text-green-400"
                  : log.status === "waiting_approval"
                  ? "text-yellow-400"
                  : log.status === "failed" || log.status === "rejected"
                  ? "text-red-400"
                  : "text-gray-500"
              }`}>
                {log.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>

        {/* Step Details */}
        <div className="space-y-3">
          {stepLogs.map((log, index) => (
            <div key={index} className={`bg-gray-800 rounded-xl p-4 border ${
              log.status === "waiting_approval"
                ? "border-yellow-700/40"
                : log.status === "completed" || log.status === "approved"
                ? "border-green-700/30"
                : log.status === "failed" || log.status === "rejected"
                ? "border-red-700/30"
                : "border-gray-700"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium text-sm">{log.step_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${typeColor(log.step_type)}`}>
                    {log.step_type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {log.duration_seconds != null && (
                    <span className="text-gray-500 text-xs">{log.duration_seconds.toFixed(2)}s</span>
                  )}
                  {log.started_at && (
                    <span className="text-gray-600 text-xs">
                      {new Date(log.started_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Rules */}
              {log.evaluated_rules?.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {log.evaluated_rules.map((rule: any, ri: number) => (
                    <div key={ri} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-xs flex-shrink-0 ${
                        rule.result ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-500"
                      }`}>
                        {rule.result ? "✓" : "✗"}
                      </span>
                      <code className="text-gray-400 text-xs font-mono flex-1 truncate">
                        {rule.condition}
                      </code>
                      <span className={`text-xs flex-shrink-0 ${rule.result ? "text-green-400" : "text-gray-600"}`}>
                        {rule.result ? "matched" : "skipped"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Extra info */}
              <div className="flex flex-wrap gap-4 text-xs">
                {log.assignee_email && (
                  <span className="text-gray-500">
                    Sent to: <span className="text-violet-400">{log.assignee_email}</span>
                  </span>
                )}
                {log.approver_id && (
                  <span className="text-gray-500">
                    Approved by: <span className="text-green-400">{log.approver_id}</span>
                  </span>
                )}
                {log.selected_next_step && (
                  <span className="text-gray-500">
                    Next: <span className="text-blue-400">{log.selected_next_step.slice(0, 8)}...</span>
                  </span>
                )}
                {log.error_message && (
                  <span className="text-red-400">{log.error_message}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall status */}
      <div className={`mt-6 rounded-xl p-4 border text-center ${
        status === "completed"
          ? "bg-green-900/20 border-green-700/30"
          : status === "waiting_approval"
          ? "bg-yellow-900/20 border-yellow-700/30"
          : status === "failed"
          ? "bg-red-900/20 border-red-700/30"
          : "bg-gray-800 border-gray-700"
      }`}>
        <p className={`text-sm font-medium ${
          status === "completed" ? "text-green-400"
          : status === "waiting_approval" ? "text-yellow-400"
          : status === "failed" ? "text-red-400"
          : "text-gray-400"
        }`}>
          {status === "completed" && "Workflow completed successfully"}
          {status === "waiting_approval" && "Workflow paused — waiting for approval"}
          {status === "failed" && "Workflow failed — check step details above"}
          {status === "running" && "Workflow is running..."}
        </p>
      </div>
    </div>
  );
}