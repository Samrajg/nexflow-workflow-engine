import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── WORKFLOWS ───────────────────────────────────────────
export const getWorkflows = (page = 1, search = "") =>
  api.get(`/api/workflows?page=${page}&search=${search}`);

export const getWorkflow = (id: string) =>
  api.get(`/api/workflows/${id}`);

export const createWorkflow = (data: any) =>
  api.post("/api/workflows", data);

export const updateWorkflow = (id: string, data: any) =>
  api.put(`/api/workflows/${id}`, data);

export const deleteWorkflow = (id: string) =>
  api.delete(`/api/workflows/${id}`);

// ─── STEPS ───────────────────────────────────────────────
export const getSteps = (workflowId: string) =>
  api.get(`/api/workflows/${workflowId}/steps`);

export const createStep = (workflowId: string, data: any) =>
  api.post(`/api/workflows/${workflowId}/steps`, data);

export const updateStep = (workflowId: string, stepId: string, data: any) =>
  api.put(`/api/workflows/${workflowId}/steps/${stepId}`, data);

export const deleteStep = (workflowId: string, stepId: string) =>
  api.delete(`/api/workflows/${workflowId}/steps/${stepId}`);

// ─── RULES ───────────────────────────────────────────────
export const getRules = (stepId: string) =>
  api.get(`/api/steps/${stepId}/rules`);

export const createRule = (stepId: string, data: any) =>
  api.post(`/api/steps/${stepId}/rules`, data);

export const updateRule = (stepId: string, ruleId: string, data: any) =>
  api.put(`/api/steps/${stepId}/rules/${ruleId}`, data);

export const deleteRule = (stepId: string, ruleId: string) =>
  api.delete(`/api/steps/${stepId}/rules/${ruleId}`);

// ─── EXECUTIONS ──────────────────────────────────────────
export const startExecution = (data: any) =>
  api.post("/api/executions", data);

export const getExecution = (id: string) =>
  api.get(`/api/executions/${id}`);

export const getExecutions = (page = 1, status = "") =>
  api.get(`/api/executions?page=${page}&status=${status}`);

export const cancelExecution = (id: string) =>
  api.post(`/api/executions/${id}/cancel`);

export const retryExecution = (id: string) =>
  api.post(`/api/executions/${id}/retry`);

export default api;