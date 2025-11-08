'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUserAttendance, UserAttendanceData } from '@/hooks/use-api';
import { format } from 'date-fns';
import { CalendarDays, Clock, User, BookOpen, GraduationCap, UserCheck } from 'lucide-react';

interface UserAttendanceModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserAttendanceModal({ userId, isOpen, onClose }: UserAttendanceModalProps) {
  const { data, loading, error } = useUserAttendance(userId);

  if (!isOpen) return null;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw]">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading attendance data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw]">
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-red-500">
              <p>Error loading attendance data: {error}</p>
              <Button onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw]">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p>No attendance data found</p>
              <Button onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { user, attendanceBySubject, totalRecords } = data;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {user.name}'s Attendance Records
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh]">
              <div className="p-6 space-y-6">
                {/* User Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium truncate" title={user.name}>{user.name}</p>
                      </div>
                      {user.rfid && (
                        <div>
                          <p className="text-sm text-muted-foreground">RFID</p>
                          <p className="font-medium font-mono text-sm">{user.rfid}</p>
                        </div>
                      )}
                      {user.fingerId && (
                        <div>
                          <p className="text-sm text-muted-foreground">Finger ID</p>
                          <p className="font-medium font-mono text-sm">{user.fingerId}</p>
                        </div>
                      )}
                      {user.employeeId && (
                        <div>
                          <p className="text-sm text-muted-foreground">Employee ID</p>
                          <p className="font-medium truncate" title={user.employeeId}>{user.employeeId}</p>
                        </div>
                      )}
                      {user.email && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium truncate" title={user.email}>{user.email}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Total Records</p>
                          <p className="text-2xl font-bold">{totalRecords}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-green-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Subjects</p>
                          <p className="text-2xl font-bold">{attendanceBySubject.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-purple-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Check-ins</p>
                          <p className="text-2xl font-bold">
                            {attendanceBySubject.reduce((sum, subject) => 
                              sum + subject.records.filter(r => r.type === 'check-in').length, 0
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Attendance by Subject */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Attendance by Subject</h3>
                  <div className="space-y-4">
                    {attendanceBySubject.map((subject, index) => (
                      <Card key={subject.subjectId || `no-subject-${index}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base truncate" title={subject.subjectName}>
                                {subject.subjectName}
                              </CardTitle>
                              {subject.courseCode && (
                                <CardDescription className="truncate" title={`${subject.courseCode} • ${subject.instructor}`}>
                                  {subject.courseCode} • {subject.instructor}
                                </CardDescription>
                              )}
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              {subject.totalAttendance} records
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {subject.records.map((record, recordIndex) => (
                              <div key={record._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <Badge 
                                    variant={record.type === 'check-in' ? 'default' : 'outline'}
                                    className="text-xs shrink-0"
                                  >
                                    {record.type}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                      {format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-end p-6 border-t">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
