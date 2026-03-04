import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-report-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("REPORT_WEBHOOK_SECRET");
    const providedSecret = req.headers.get("x-report-secret");
    if (!webhookSecret || providedSecret !== webhookSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const recipients = (Deno.env.get("STAKEHOLDER_REPORT_EMAILS") ?? "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase credentials");
    }
    if (!resendKey) {
      throw new Error("Missing RESEND_API_KEY");
    }
    if (recipients.length === 0) {
      throw new Error("Missing STAKEHOLDER_REPORT_EMAILS");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 7);

    const { data: summaryRows, error: summaryError } = await supabase.rpc("get_admin_analytics_summary", {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
    if (summaryError) throw summaryError;

    const summary = summaryRows?.[0] ?? {};

    const [safetyRes, financialRes] = await Promise.all([
      supabase
        .from("analytics_safety_stats" as never)
        .select("*")
        .order("month_start", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("analytics_student_earnings_weekly" as never)
        .select("*")
        .order("week_start", { ascending: false })
        .limit(5),
    ]);

    if (safetyRes.error) throw safetyRes.error;
    if (financialRes.error) throw financialRes.error;

    const safety = safetyRes.data ?? {};
    const topEarners = financialRes.data ?? [];

    const topEarnersHtml = topEarners
      .map(
        (row: any) =>
          `<li>${row.sitter_name}: ₺${Number(row.total_sitter_earnings || 0).toLocaleString("tr-TR")}</li>`
      )
      .join("");

    const html = `
      <h2>KampusAbla Weekly Metrics</h2>
      <p>Period: ${startDate.toISOString()} - ${endDate.toISOString()}</p>
      <ul>
        <li>Time-to-match (avg): ${summary.avg_match_hours ?? 0} hours</li>
        <li>Completion rate: ${summary.completion_rate ?? 0}%</li>
        <li>Repeat booking rate: ${summary.repeat_booking_rate ?? 0}%</li>
        <li>Total bookings: ${summary.bookings_count ?? 0}</li>
        <li>Platform revenue: ₺${Number(summary.total_revenue ?? 0).toLocaleString("tr-TR")}</li>
        <li>Safety incidents / 1000 sessions: ${safety.incident_rate_per_1000 ?? 0}</li>
      </ul>
      <h3>Top Student Earnings (latest week)</h3>
      <ol>${topEarnersHtml || "<li>No earnings data</li>"}</ol>
    `;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KampusAbla Reports <reports@kampusabla.com>",
        to: recipients,
        subject: "Weekly Business Metrics Report",
        html,
      }),
    });

    if (!resendResp.ok) {
      const resendError = await resendResp.text();
      throw new Error(`Resend error: ${resendError}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
