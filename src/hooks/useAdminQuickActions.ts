import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, ShieldCheck, AlertTriangle, BarChart3, Settings,
  FileWarning, MessageSquare, CreditCard, Bell, Calendar,
  type LucideIcon,
} from "lucide-react";

export interface AdminAction {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  description: string;
}

export const ALL_ADMIN_ACTIONS: AdminAction[] = [
  { id: "users", label: "Kullanıcı Yönetimi", icon: Users, path: "/mgmt/panel/users", description: "Kullanıcıları görüntüle ve yönet" },
  { id: "verifications", label: "Onay Kuyruğu", icon: ShieldCheck, path: "/mgmt/panel/verifications", description: "Bakıcı doğrulama başvurularını incele" },
  { id: "reports", label: "Rapor Yönetimi", icon: AlertTriangle, path: "/mgmt/panel/reports", description: "Kullanıcı raporlarını incele" },
  { id: "monitoring", label: "Sistem İzleme", icon: BarChart3, path: "/mgmt/panel/monitoring", description: "Analitik ve performans verileri" },
  { id: "settings", label: "Sistem Ayarları", icon: Settings, path: "/mgmt/panel/settings", description: "Platform yapılandırması" },
  { id: "error-logs", label: "Hata Logları", icon: FileWarning, path: "/mgmt/panel/error-logs", description: "Kullanıcı hata raporlarını görüntüle" },
];

const DEFAULT_QUICK_ACTION_IDS = ["users", "verifications", "reports", "error-logs"];

export function useAdminQuickActions() {
  const [quickActionIds, setQuickActionIds] = useState<string[]>(DEFAULT_QUICK_ACTION_IDS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_settings")
        .select("notification_preferences")
        .eq("user_id", user.id)
        .single();

      if (data?.notification_preferences) {
        const prefs = data.notification_preferences as Record<string, unknown>;
        if (Array.isArray(prefs.admin_quick_actions)) {
          setQuickActionIds(prefs.admin_quick_actions as string[]);
        }
      }
    } catch {
      // Use defaults
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = useCallback(async (ids: string[]) => {
    setQuickActionIds(ids);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from("user_settings")
        .select("id, notification_preferences")
        .eq("user_id", user.id)
        .single();

      const currentPrefs = (existing?.notification_preferences as Record<string, unknown>) || {};
      const updatedPrefs = { ...currentPrefs, admin_quick_actions: ids };

      if (existing) {
        await supabase
          .from("user_settings")
          .update({ notification_preferences: updatedPrefs })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_settings")
          .insert({ user_id: user.id, notification_preferences: updatedPrefs });
      }
    } catch {
      // Silently fail, local state is already set
    }
  }, []);

  const toggleAction = useCallback((actionId: string) => {
    const newIds = quickActionIds.includes(actionId)
      ? quickActionIds.filter((id) => id !== actionId)
      : [...quickActionIds, actionId];
    savePreferences(newIds);
  }, [quickActionIds, savePreferences]);

  const quickActions = ALL_ADMIN_ACTIONS.filter((a) => quickActionIds.includes(a.id));
  const allActions = ALL_ADMIN_ACTIONS;

  return { quickActions, allActions, quickActionIds, toggleAction, isLoading };
}
