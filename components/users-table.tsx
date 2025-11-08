"use client"

import type React from "react"

import { useState } from "react"
import { Search, Plus, Edit2, Trash2, Loader2, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUsers, registerUser, updateUser, deleteUser, type User } from "@/hooks/use-api"
import { UserAttendanceModal } from "@/components/user-attendance-modal"

export function UsersTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, loading, error, refetch } = useUsers(page, limit)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", rfid: "", fingerId: "", employeeId: "", email: "" })
  const [editData, setEditData] = useState({ id: "", name: "", employeeId: "", email: "" })
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const users = data?.users || []
  const pagination = data?.pagination

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.rfid && user.rfid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.fingerId && user.fingerId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && (formData.rfid || formData.fingerId)) {
      try {
        setIsSubmitting(true)
        await registerUser({
          name: formData.name,
          rfid: formData.rfid || undefined,
          fingerId: formData.fingerId || undefined,
          employeeId: formData.employeeId || undefined,
          email: formData.email || undefined,
        })
        setFormData({ name: "", rfid: "", fingerId: "", employeeId: "", email: "" })
        setShowModal(false)
        refetch() // Refresh the data
      } catch (error) {
        console.error('Error registering user:', error)
        alert('Error registering user: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleEditUser = (user: User) => {
    setEditData({
      id: user._id,
      name: user.name,
      employeeId: user.employeeId || "",
      email: user.email || "",
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editData.name) {
      try {
        setIsSubmitting(true)
        await updateUser({
          id: editData.id,
          name: editData.name,
          employeeId: editData.employeeId || undefined,
          email: editData.email || undefined,
        })
        setEditData({ id: "", name: "", employeeId: "", email: "" })
        setShowEditModal(false)
        refetch() // Refresh the data
      } catch (error) {
        console.error('Error updating user:', error)
        alert('Error updating user: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleDeleteUser = (userId: string) => {
    setDeleteUserId(userId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (deleteUserId) {
      try {
        setIsSubmitting(true)
        await deleteUser(deleteUserId)
        setDeleteUserId(null)
        setShowDeleteDialog(false)
        refetch() // Refresh the data
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Error deleting user: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleViewAttendance = (userId: string) => {
    setSelectedUserId(userId)
    setShowAttendanceModal(true)
  }

  const handleRowClick = (user: User, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on action buttons
    const target = event.target as HTMLElement
    if (target.closest('button')) {
      return
    }
    handleViewAttendance(user._id)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Users Management</h1>
          <p className="text-muted-foreground">Manage registered employees and their RFID tags.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading users...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Users Management</h1>
          <p className="text-muted-foreground">Manage registered employees and their RFID tags.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Error loading users: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Users Management</h1>
        <p className="text-muted-foreground">Manage registered employees and their RFID tags.</p>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, RFID, Finger ID, employee ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input border-border/50 focus:border-primary"
          />
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Finger ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Employee ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Attendance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Created</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr 
                  key={user._id} 
                  className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={(e) => handleRowClick(user, e)}
                >
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{user.rfid || '-'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{user.fingerId || '-'}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{user.employeeId || '-'}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{user.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{user.attendance}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-500 hover:bg-blue-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewAttendance(user._id)
                      }}
                      title="View Attendance"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditUser(user)
                      }}
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteUser(user._id)
                      }}
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-border/50">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Add New User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border-border/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">RFID</label>
                  <Input
                    placeholder="RF006 (optional)"
                    value={formData.rfid}
                    onChange={(e) => setFormData({ ...formData, rfid: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Finger ID</label>
                  <Input
                    placeholder="12345 (optional)"
                    value={formData.fingerId}
                    onChange={(e) => setFormData({ ...formData, fingerId: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>
                <div className="text-xs text-muted-foreground -mt-2">
                  * At least one of RFID or Finger ID is required
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Employee ID</label>
                  <Input
                    placeholder="EMP001 (optional)"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="john@company.com (optional)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      'Add User'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-border/50">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Edit User</h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="bg-input border-border/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Employee ID</label>
                  <Input
                    placeholder="EMP001 (optional)"
                    value={editData.employeeId}
                    onChange={(e) => setEditData({ ...editData, employeeId: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="john@company.com (optional)"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="bg-input border-border/50"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowEditModal(false)} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update User'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-border/50">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Delete User</h2>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmDeleteUser}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete User'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* User Attendance Modal */}
      <UserAttendanceModal
        userId={selectedUserId}
        isOpen={showAttendanceModal}
        onClose={() => {
          setShowAttendanceModal(false)
          setSelectedUserId(null)
        }}
      />
    </div>
  )
}
