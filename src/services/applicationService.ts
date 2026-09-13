import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ApplicationStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];
export type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];

export interface ApplicationSummary {
  total: number;
  saved: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}

const STORAGE_KEY_PREFIX = "resumate_applications_";
const memoryStore = new Map<string, ApplicationRow[]>();

function getLocalStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId || "guest"}`;
}

function loadLocalApplications(userId: string): ApplicationRow[] {
  const key = getLocalStorageKey(userId);
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    // Fall back to memory store
  }
  return memoryStore.get(key) || [];
}

function saveLocalApplications(userId: string, apps: ApplicationRow[]): void {
  const key = getLocalStorageKey(userId);
  memoryStore.set(key, apps);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(apps));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export const applicationService = {
  /**
   * Retrieves all job applications for the given user, newest first.
   */
  async listApplications(userId: string): Promise<ApplicationRow[]> {
    if (!userId) {
      return loadLocalApplications("guest");
    }

    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        // Fall back to local store if table is not yet migrated on hosted Supabase
        console.warn(
          "Supabase applications query returned an error, using local store:",
          error.message,
        );
        return loadLocalApplications(userId);
      }

      if (data) {
        // Sync local cache for offline/instant access
        saveLocalApplications(userId, data);
        return data;
      }
    } catch (err) {
      console.warn("Failed to reach Supabase for applications, using local store:", err);
    }

    return loadLocalApplications(userId);
  },

  /**
   * Retrieves a single application by ID.
   */
  async getApplication(id: string, userId?: string): Promise<ApplicationRow | null> {
    if (userId) {
      try {
        const { data, error } = await supabase
          .from("applications")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data) return data;
      } catch {
        // Fall back to local store below
      }
    }

    const localList = loadLocalApplications(userId || "guest");
    return localList.find((a) => a.id === id) || null;
  },

  /**
   * Creates a new job application.
   */
  async createApplication(input: ApplicationInsert): Promise<ApplicationRow> {
    const now = new Date().toISOString();
    const newId =
      input.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `app_${Date.now()}`);

    const record: ApplicationRow = {
      id: newId,
      user_id: input.user_id,
      company_name: input.company_name.trim(),
      job_title: input.job_title.trim(),
      job_url: input.job_url?.trim() || null,
      job_description: input.job_description?.trim() || null,
      application_date: input.application_date || now.slice(0, 10),
      status: input.status || "saved",
      resume_id: input.resume_id || null,
      resume_name: input.resume_name || null,
      ats_score: typeof input.ats_score === "number" ? input.ats_score : null,
      match_score: typeof input.match_score === "number" ? input.match_score : null,
      notes: input.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    // Always update local cache first for instant feedback & resilience
    const local = loadLocalApplications(input.user_id);
    const updatedLocal = [record, ...local.filter((a) => a.id !== record.id)];
    saveLocalApplications(input.user_id, updatedLocal);

    try {
      const { data, error } = await supabase
        .from("applications")
        .insert({
          id: record.id,
          user_id: record.user_id,
          company_name: record.company_name,
          job_title: record.job_title,
          job_url: record.job_url,
          job_description: record.job_description,
          application_date: record.application_date,
          status: record.status,
          resume_id: record.resume_id,
          resume_name: record.resume_name,
          ats_score: record.ats_score,
          match_score: record.match_score,
          notes: record.notes,
        })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
      if (error) {
        console.warn("Supabase applications insert error (using local sync):", error.message);
      }
    } catch (err) {
      console.warn("Supabase insert network exception, saved locally:", err);
    }

    return record;
  },

  /**
   * Updates an existing application.
   */
  async updateApplication(
    id: string,
    updates: ApplicationUpdate,
    userId?: string,
  ): Promise<ApplicationRow> {
    const now = new Date().toISOString();
    const uid = userId || updates.user_id || "guest";

    // Update local cache
    const local = loadLocalApplications(uid);
    const existing = local.find((a) => a.id === id);
    if (!existing && !userId) {
      throw new Error("Application not found");
    }

    const merged: ApplicationRow = existing
      ? {
          ...existing,
          ...updates,
          updated_at: now,
        }
      : ({
          id,
          user_id: uid,
          company_name: updates.company_name || "",
          job_title: updates.job_title || "",
          job_url: updates.job_url ?? null,
          job_description: updates.job_description ?? null,
          application_date: updates.application_date || now.slice(0, 10),
          status: (updates.status as ApplicationStatus) || "saved",
          resume_id: updates.resume_id ?? null,
          resume_name: updates.resume_name ?? null,
          ats_score: updates.ats_score ?? null,
          match_score: updates.match_score ?? null,
          notes: updates.notes ?? null,
          created_at: now,
          updated_at: now,
        } as ApplicationRow);

    const updatedLocal = local.map((a) => (a.id === id ? merged : a));
    if (!local.some((a) => a.id === id)) {
      updatedLocal.unshift(merged);
    }
    saveLocalApplications(uid, updatedLocal);

    if (userId) {
      try {
        const { data, error } = await supabase
          .from("applications")
          .update({
            ...updates,
            updated_at: now,
          })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (!error && data) {
          return data;
        }
        if (error) {
          console.warn("Supabase application update warning:", error.message);
        }
      } catch (err) {
        console.warn("Supabase application update network exception:", err);
      }
    }

    return merged;
  },

  /**
   * Quick status transition for Kanban drag/click (e.g. saved -> applied -> interview -> offer -> rejected).
   */
  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    userId?: string,
  ): Promise<ApplicationRow> {
    return this.updateApplication(id, { status }, userId);
  },

  /**
   * Deletes an application with user validation.
   */
  async deleteApplication(id: string, userId?: string): Promise<void> {
    const uid = userId || "guest";
    const local = loadLocalApplications(uid);
    saveLocalApplications(
      uid,
      local.filter((a) => a.id !== id),
    );

    if (userId) {
      try {
        const { error } = await supabase
          .from("applications")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.warn("Supabase application delete warning:", error.message);
        }
      } catch (err) {
        console.warn("Supabase application delete network exception:", err);
      }
    }
  },

  /**
   * Computes aggregate counts for the dashboard and summary badges.
   */
  async getApplicationSummary(userId: string): Promise<ApplicationSummary> {
    const list = await this.listApplications(userId);
    const summary: ApplicationSummary = {
      total: list.length,
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    for (const app of list) {
      if (app.status in summary) {
        summary[app.status as keyof Omit<ApplicationSummary, "total">]++;
      }
    }

    return summary;
  },
};
