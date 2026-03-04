import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { logger } from "@/lib/logger";

type SummaryData = {
  total_revenue: number;
  active_users: number;
  avg_match_hours: number;
  completion_rate: number;
  bookings_count: number;
  repeat_booking_rate: number;
};

export default function AnalyticsDashboard() {
  const [isExporting, setIsExporting] = useState(false);

  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_admin_analytics_summary");
      if (error) throw error;
      return ((data as any)?.[0] ?? {}) as SummaryData;
    },
  });

  const { data: timeToMatchData, isLoading: isLoadingTTM } = useQuery({
    queryKey: ["analytics-time-to-match"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_time_to_match" as any)
        .select("*")
        .order("booking_date", { ascending: true })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: completionData, isLoading: isLoadingCompletion } = useQuery({
    queryKey: ["analytics-completion-rate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_completion_rate" as any)
        .select("*")
        .order("week_start", { ascending: true })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ["analytics-financial-weekly"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_financial_weekly" as any)
        .select("*")
        .order("week_start", { ascending: true })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: safetyData, isLoading: isLoadingSafety } = useQuery({
    queryKey: ["analytics-safety-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_safety_stats" as any)
        .select("*")
        .order("month_start", { ascending: true })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: repeatData, isLoading: isLoadingRepeat } = useQuery({
    queryKey: ["analytics-repeat-booking-rate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_repeat_booking_rate" as any)
        .select("*")
        .order("week_start", { ascending: true })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: studentEarningsData, isLoading: isLoadingStudentEarnings } = useQuery({
    queryKey: ["analytics-student-earnings-weekly"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_student_earnings_weekly" as any)
        .select("*")
        .order("week_start", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const topStudentEarningsData = useMemo(() => {
    if (!studentEarningsData?.length) return [];
    const latestWeek = (studentEarningsData[0] as any).week_start;
    return (studentEarningsData as any[])
      .filter((row: any) => row.week_start === latestWeek)
      .sort((a: any, b: any) => b.total_sitter_earnings - a.total_sitter_earnings)
      .slice(0, 10);
  }, [studentEarningsData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const [ttm, completion, financial, safety, repeat, student] = await Promise.all([
        supabase.from("analytics_time_to_match" as any).select("*").csv(),
        supabase.from("analytics_completion_rate" as any).select("*").csv(),
        supabase.from("analytics_financial_weekly" as any).select("*").csv(),
        supabase.from("analytics_safety_stats" as any).select("*").csv(),
        supabase.from("analytics_repeat_booking_rate" as any).select("*").csv(),
        supabase.from("analytics_student_earnings_weekly" as any).select("*").csv(),
      ]);

      downloadCsv(ttm.data, "time_to_match.csv");
      downloadCsv(completion.data, "completion_rate.csv");
      downloadCsv(financial.data, "financial_report.csv");
      downloadCsv(safety.data, "safety_incidents.csv");
      downloadCsv(repeat.data, "repeat_booking_rate.csv");
      downloadCsv(student.data, "student_earnings_weekly.csv");

      toast.success("Raporlar indirildi.");
    } catch (error) {
      logger.error("Analytics export failed", { action: "analytics.export_failed", error });
      toast.error("Rapor oluşturulamadı.");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCsv = (csvString: string | null, filename: string) => {
    if (!csvString) return;
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  if (
    isLoadingSummary ||
    isLoadingTTM ||
    isLoadingCompletion ||
    isLoadingFinancial ||
    isLoadingSafety ||
    isLoadingRepeat ||
    isLoadingStudentEarnings
  ) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Analytics</h1>
          <p className="text-slate-500">Monitor key performance indicators and system health.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Match</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.avg_match_hours || 0} h</div>
            <p className="text-xs text-muted-foreground">Target: &lt; 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.completion_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">Completed / accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Repeat Booking Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.repeat_booking_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{summaryData?.total_revenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.active_users || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.bookings_count || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matching" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matching">Time to Match</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
          <TabsTrigger value="repeat">Repeat Booking</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="students">Student Earnings</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="matching">
          <Card>
            <CardHeader>
              <CardTitle>Matching Performance</CardTitle>
              <CardDescription>Hours from booking creation to booking confirmation.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeToMatchData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="booking_date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_hours_to_match" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completion">
          <Card>
            <CardHeader>
              <CardTitle>Booking Completion Trends</CardTitle>
              <CardDescription>Completed bookings as percentage of accepted bookings.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week_start" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="completion_percentage" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repeat">
          <Card>
            <CardHeader>
              <CardTitle>Repeat Booking Rate</CardTitle>
              <CardDescription>Same parent-sitter pair rebooking within 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={repeatData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week_start" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="repeat_booking_percentage" stroke="#0ea5e9" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue</CardTitle>
              <CardDescription>Platform fee revenue per week.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week_start" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="total_platform_revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Earnings (Latest Week)</CardTitle>
              <CardDescription>Top sitter earnings in the latest completed week.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStudentEarningsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="sitter_name"
                    width={120}
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="total_sitter_earnings" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety">
          <Card>
            <CardHeader>
              <CardTitle>Safety Incident Rate</CardTitle>
              <CardDescription>Reports per 1,000 sessions by month.</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safetyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month_start" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="incident_rate_per_1000" stroke="#ef4444" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
