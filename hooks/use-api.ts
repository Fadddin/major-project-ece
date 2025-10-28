import { useState, useEffect } from 'react';

// Types
export interface User {
  _id: string;
  rfid: string;
  name: string;
  employeeId: string;
  attendance: number;
  createdAt: string;
}

export interface UnregisteredUser {
  _id: string;
  rfid: string;
  lastSeen: string;
  scannedCount: number;
}

export interface AttendanceRecord {
  _id: string;
  rfid: string;
  userName?: string;
  userId?: string | {
    _id?: string;
    name?: string;
    employeeId?: string;
  };
  timestamp: string;
  type: 'check-in' | 'check-out';
}

export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalUnregisteredUsers: number;
    totalAttendanceRecords: number;
  };
  attendance: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  topUsers: User[];
  recentActivity: AttendanceRecord[];
}

// Custom hooks for data fetching
export function useDashboardStats() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

export function useUsers(page = 1, limit = 10) {
  const [data, setData] = useState<{ users: User[]; pagination: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users?page=${page}&limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const result = await response.json();
        setData(result.data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, limit]);

  const refetch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const result = await response.json();
      setData(result.data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

export function useUnregisteredUsers(page = 1, limit = 10) {
  const [data, setData] = useState<{ unregisteredUsers: UnregisteredUser[]; pagination: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnregistered = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/unregistered?page=${page}&limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch unregistered users');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUnregistered();
  }, [page, limit]);

  const refetch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/unregistered?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch unregistered users');
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

export function useAttendanceRecords() {
  const [data, setData] = useState<AttendanceRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/attendance/records`);
        if (!response.ok) {
          throw new Error('Failed to fetch attendance records');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/records`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

// API functions
export async function registerUser(userData: { rfid: string; name: string; employeeId: string }) {
  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to register user');
  }

  return response.json();
}

export async function recordAttendance(rfid: string) {
  const response = await fetch('/api/attendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rfid }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to record attendance');
  }

  return response.json();
}

// Helper function to get user name from attendance record
export function getUserName(record: AttendanceRecord): string {
  if (record.userName) {
    return record.userName;
  }
  if (typeof record.userId === 'object' && record.userId?.name) {
    return record.userId.name;
  }
  return 'Unregistered User';
}
