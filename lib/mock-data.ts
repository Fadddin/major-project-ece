export const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    rfid: "RF001",
    department: "Engineering",
    totalAttendance: 45,
    lastSeen: "2025-10-27 09:30",
  },
  {
    id: 2,
    name: "Jane Smith",
    rfid: "RF002",
    department: "Marketing",
    totalAttendance: 42,
    lastSeen: "2025-10-27 08:45",
  },
  {
    id: 3,
    name: "Mike Johnson",
    rfid: "RF003",
    department: "Sales",
    totalAttendance: 38,
    lastSeen: "2025-10-26 10:15",
  },
  { id: 4, name: "Sarah Williams", rfid: "RF004", department: "HR", totalAttendance: 48, lastSeen: "2025-10-27 09:00" },
  {
    id: 5,
    name: "Tom Brown",
    rfid: "RF005",
    department: "Engineering",
    totalAttendance: 44,
    lastSeen: "2025-10-27 09:45",
  },
]

export const mockAttendance = [
  { id: 1, name: "John Doe", rfid: "RF001", date: "2025-10-27", time: "09:30" },
  { id: 2, name: "Jane Smith", rfid: "RF002", date: "2025-10-27", time: "08:45" },
  { id: 3, name: "Mike Johnson", rfid: "RF003", date: "2025-10-27", time: "10:15" },
  { id: 4, name: "Sarah Williams", rfid: "RF004", date: "2025-10-27", time: "09:00" },
  { id: 5, name: "Tom Brown", rfid: "RF005", date: "2025-10-27", time: "09:45" },
  { id: 6, name: "John Doe", rfid: "RF001", date: "2025-10-26", time: "09:15" },
  { id: 7, name: "Jane Smith", rfid: "RF002", date: "2025-10-26", time: "08:30" },
]

export const mockUnregistered = [
  { id: 1, rfid: "RF999", lastSeen: "2025-10-27 14:20" },
  { id: 2, rfid: "RF998", lastSeen: "2025-10-27 13:45" },
  { id: 3, rfid: "RF997", lastSeen: "2025-10-26 15:30" },
]

export const attendanceStats = [
  { date: "Mon", attendance: 45 },
  { date: "Tue", attendance: 48 },
  { date: "Wed", attendance: 42 },
  { date: "Thu", attendance: 50 },
  { date: "Fri", attendance: 46 },
  { date: "Sat", attendance: 20 },
  { date: "Sun", attendance: 15 },
]
