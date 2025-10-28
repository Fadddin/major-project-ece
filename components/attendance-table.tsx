"use client"

import { useState, useEffect } from "react"
import { Search, Download, Filter, Loader2, BookOpen, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from "@/components/ui/pagination"
import { useAttendanceRecordsPaginated, useSubjects, useSelectedSubject, selectSubject, clearSelectedSubject, getUserName } from "@/hooks/use-api"

export function AttendanceTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, loading, error } = useAttendanceRecordsPaginated(
    currentPage, 
    pageSize, 
    searchTerm, 
    dateFilter
  )
  const { data: subjects } = useSubjects()
  const { data: selectedSubject, refetch: refetchSelectedSubject } = useSelectedSubject()

  const attendance = data?.records || []
  const pagination = data?.pagination

  // Debug logging
  console.log('Subjects data:', subjects)
  console.log('Selected subject data:', selectedSubject)
  console.log('Attendance records:', attendance)
  console.log('First attendance record subject data:', attendance[0] ? {
    subjectName: attendance[0].subjectName,
    courseCode: attendance[0].courseCode,
    instructor: attendance[0].instructor,
    subjectId: attendance[0].subjectId
  } : 'No records')

  // Reset to first page when search, date filter, or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateFilter, pageSize])

  const handleExport = () => {
    const csv = [
      ["Name", "RFID", "Subject", "Course Code", "Instructor", "Date", "Time", "Type"], 
      ...attendance.filter(r => r && r.rfid).map((r) => [
        getUserName(r),
        r.rfid,
        r.subjectName || "No subject",
        r.courseCode || "",
        r.instructor || "",
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSubjectSelect = async (subjectId: string) => {
    console.log('Selecting subject with ID:', subjectId)
    try {
      const result = await selectSubject(subjectId)
      console.log('Subject selection result:', result)
      refetchSelectedSubject()
    } catch (error) {
      console.error('Error selecting subject:', error)
      alert('Error selecting subject: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleClearSubject = async () => {
    try {
      await clearSelectedSubject()
      refetchSelectedSubject()
    } catch (error) {
      console.error('Error clearing subject:', error)
      alert('Error clearing subject: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const renderPaginationItems = () => {
    if (!pagination) return null

    const { currentPage: page, totalPages } = pagination
    const items = []

    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          href="#"
          onClick={(e) => {
            e.preventDefault()
            if (page > 1) handlePageChange(page - 1)
          }}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    )

    // Page numbers
    const maxVisiblePages = 5
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink 
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(1)
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(i)
            }}
            isActive={i === page}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(totalPages)
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          href="#"
          onClick={(e) => {
            e.preventDefault()
            if (page < totalPages) handlePageChange(page + 1)
          }}
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    )

    return items
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

      {/* Subject Selection */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Current Subject</h2>
          </div>
          
          {selectedSubject ? (
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">{selectedSubject.subjectName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSubject.courseCode} • {selectedSubject.instructor}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSubject}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">No subject selected. Choose a subject to track attendance:</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select onValueChange={handleSubjectSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject._id} value={subject._id}>
                          {subject.name} ({subject.courseCode}) - {subject.instructor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {subjects?.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={() => window.open('/dashboard/subjects', '_blank')}
                    className="gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Manage Subjects
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Subject</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => (
                <tr key={record._id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    {getUserName(record)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{record.rfid}</td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {record.subjectName ? (
                      <div>
                        <div className="font-medium">{record.subjectName}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.courseCode} • {record.instructor}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No subject</span>
                    )}
                  </td>
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {renderPaginationItems()}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Summary */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Records</p>
              <p className="text-2xl font-bold text-foreground">{pagination?.totalRecords || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Page</p>
              <p className="text-2xl font-bold text-foreground">
                {pagination?.currentPage || 1} of {pagination?.totalPages || 1}
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
