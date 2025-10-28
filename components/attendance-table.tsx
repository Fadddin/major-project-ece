"use client"

import { useState, useEffect } from "react"
import { Search, Download, Filter, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAttendanceRecords, getUserName } from "@/hooks/use-api"

export function AttendanceTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  const { data, loading, error } = useAttendanceRecords()

  const attendance = data || []

  const filteredAttendance = attendance.filter((record) => {
    // Safety check for record existence and required properties
    if (!record || !record.rfid) return false;
    
    const name = getUserName(record)
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.rfid.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handleExport = () => {
    const csv = [
      ["Name", "RFID", "Date", "Time", "Type"], 
      ...filteredAttendance.filter(r => r && r.rfid).map((r) => [
        getUserName(r),
        r.rfid, 
        new Date(r.timestamp).toLocaleDateString(),
        new Date(r.timestamp).toLocaleTimeString(),
        r.type
      ])
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "attendance.csv"
    a.click()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Attendance Logs</h1>
          <p className="text-muted-foreground">View and filter attendance records.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading attendance records...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Attendance Logs</h1>
          <p className="text-muted-foreground">View and filter attendance records.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Error loading attendance records: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Attendance Logs</h1>
        <p className="text-muted-foreground">View and filter attendance records.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or RFID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input border-border/50 focus:border-primary"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 bg-input border-border/50 focus:border-primary"
          />
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2 bg-transparent">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Table */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">RFID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record) => (
                <tr key={record._id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    {getUserName(record)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{record.rfid}</td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      record.type === 'check-in' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {record.type === 'check-in' ? 'Check-in' : 'Check-out'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Records</p>
              <p className="text-2xl font-bold text-foreground">{filteredAttendance.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Unique Users</p>
              <p className="text-2xl font-bold text-foreground">
                {new Set(filteredAttendance.map((r) => r.rfid)).size}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Date Range</p>
              <p className="text-sm font-medium text-foreground">{dateFilter || "All dates"}</p>
            </div>
          </div>
        </div>
      </Card>

    </div>
  )
}
