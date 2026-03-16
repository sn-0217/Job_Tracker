import { useState, useCallback, useMemo } from "react";
import type { JobApplication, ApplicationStatus } from "@/types/job";

const STORAGE_KEY = "jobtracker_applications";

function loadApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveApplications(apps: JobApplication[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function useJobStore() {
  const [applications, setApplications] = useState<JobApplication[]>(loadApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [showArchived, setShowArchived] = useState(false);

  const persist = useCallback((apps: JobApplication[]) => {
    setApplications(apps);
    saveApplications(apps);
  }, []);

  const addApplication = useCallback((app: Omit<JobApplication, "id" | "dateUpdated">) => {
    const newApp: JobApplication = {
      ...app,
      id: crypto.randomUUID(),
      dateUpdated: new Date().toISOString(),
    };
    persist([newApp, ...loadApplications()]);
  }, [persist]);

  const updateApplication = useCallback((id: string, updates: Partial<JobApplication>) => {
    const current = loadApplications();
    const updated = current.map((a) =>
      a.id === id ? { ...a, ...updates, dateUpdated: new Date().toISOString() } : a
    );
    persist(updated);
  }, [persist]);

  const deleteApplication = useCallback((id: string) => {
    persist(loadApplications().filter((a) => a.id !== id));
  }, [persist]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (app.archived !== showArchived) return false;
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          app.jobTitle.toLowerCase().includes(q) ||
          app.company.toLowerCase().includes(q) ||
          (app.officeLocation?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [applications, searchQuery, statusFilter, showArchived]);

  const stats = useMemo(() => {
    const active = applications.filter((a) => !a.archived);
    const now = new Date();
    const followUpsDue = active.filter((a) => {
      if (!a.followUpDate) return false;
      return new Date(a.followUpDate) <= now;
    });
    return {
      total: active.length,
      applied: active.filter((a) => a.status === "applied").length,
      interviewing: active.filter((a) =>
        ["phone-screen", "interviewing", "final-round"].includes(a.status)
      ).length,
      offers: active.filter((a) => a.status === "offer").length,
      followUpsDue: followUpsDue.length,
    };
  }, [applications]);

  return {
    applications: filteredApplications,
    allApplications: applications,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    showArchived,
    setShowArchived,
    addApplication,
    updateApplication,
    deleteApplication,
    stats,
  };
}
