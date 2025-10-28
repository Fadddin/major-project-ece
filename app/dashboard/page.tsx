"use client"

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Users, Clock, AlertCircle, TrendingUp, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { useDashboardStats, getUserName } from "@/hooks/use-api"

export default function DashboardPage() {
  const { data: stats, loading, error } = useDashboardStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Error loading dashboard: {error}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>No data available</p>
      </div>
    )
  }

  const { overview, attendance, topUsers, recentActivity } = stats
  const attendancePercentage = overview.totalUsers > 0 ? ((attendance.today / overview.totalUsers) * 100).toFixed(0) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your attendance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={overview.totalUsers}
          description="Registered employees"
          icon={Users}
        />
        <StatsCard
          title="Today's Attendance"
          value={attendance.today}
          description={`${attendancePercentage}% present`}
          icon={Clock}
        />
        <StatsCard
          title="Unregistered RFID"
          value={overview.totalUnregisteredUsers}
          description="Pending registration"
          icon={AlertCircle}
        />
        <StatsCard
          title="This Week"
          value={attendance.thisWeek}
          description="Total scans this week"
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Weekly Attendance Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { date: "Mon", attendance: attendance.thisWeek },
                { date: "Tue", attendance: attendance.thisWeek },
                { date: "Wed", attendance: attendance.thisWeek },
                { date: "Thu", attendance: attendance.thisWeek },
                { date: "Fri", attendance: attendance.thisWeek },
                { date: "Sat", attendance: Math.floor(attendance.thisWeek * 0.3) },
                { date: "Sun", attendance: Math.floor(attendance.thisWeek * 0.2) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Users by Attendance */}
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Top Users by Attendance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topUsers.map(user => ({
                  name: user.name.split(' ')[0], // First name only
                  attendance: user.attendance
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="attendance" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Attendance</h2>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((record) => (
              <div key={record._id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">
                    {getUserName(record)}
                  </p>
                  <p className="text-xs text-muted-foreground">{record.rfid}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
