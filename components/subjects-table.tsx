"use client"

import type React from "react"
import { useState } from "react"
import { Search, Plus, Edit2, Trash2, Loader2, BookOpen } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSubjects, createSubject, updateSubject, deleteSubject, type Subject } from "@/hooks/use-api"

export function SubjectsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const { data, loading, error, refetch } = useSubjects()
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState({ name: "", courseCode: "", instructor: "" })
  const [editData, setEditData] = useState({ id: "", name: "", courseCode: "", instructor: "" })
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const subjects = data || []

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.instructor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.courseCode && formData.instructor) {
      try {
        setIsSubmitting(true)
        await createSubject(formData)
        setFormData({ name: "", courseCode: "", instructor: "" })
        setShowModal(false)
        refetch() // Refresh the data
      } catch (error) {
        console.error('Error creating subject:', error)
        alert('Error creating subject: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleEditSubject = (subject: Subject) => {
    setEditData({
      id: subject._id,
      name: subject.name,
      courseCode: subject.courseCode,
      instructor: subject.instructor,
    })
    setShowEditModal(true)
  }

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editData.name && editData.courseCode && editData.instructor) {
      try {
        setIsSubmitting(true)
        await updateSubject(editData)
        setEditData({ id: "", name: "", courseCode: "", instructor: "" })
        setShowEditModal(false)
        refetch() // Refresh the data
      } catch (error) {
        console.error('Error updating subject:', error)
        alert('Error updating subject: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleDeleteSubject = (subjectId: string) => {
    setDeleteSubjectId(subjectId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteSubject = async () => {
    if (deleteSubjectId) {
      try {
        setIsSubmitting(true)
        await deleteSubject(deleteSubjectId)
        setDeleteSubjectId(null)
        setShowDeleteDialog(false)
        refetch() // Refresh the data
      } catch (error) {
        console.error('Error deleting subject:', error)
        alert('Error deleting subject: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Subjects Management</h1>
          <p className="text-muted-foreground">Manage course subjects and their details.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading subjects...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Subjects Management</h1>
          <p className="text-muted-foreground">Manage course subjects and their details.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Error loading subjects: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Subjects Management</h1>
        <p className="text-muted-foreground">Manage course subjects and their details.</p>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, course code, or instructor..."
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
          Add Subject
        </Button>
      </div>

      {/* Table */}
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Course Code</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Instructor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Created</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((subject) => (
                <tr key={subject._id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{subject.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{subject.courseCode}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{subject.instructor}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(subject.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:bg-primary/10"
                      onClick={() => handleEditSubject(subject)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteSubject(subject._id)}
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

      {/* Add Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-border/50">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Add New Subject</h2>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Subject Name *</label>
                  <Input
                    placeholder="Mathematics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border-border/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Course Code *</label>
                  <Input
                    placeholder="MATH101"
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    className="bg-input border-border/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Instructor *</label>
                  <Input
                    placeholder="Dr. John Smith"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="bg-input border-border/50"
                    required
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
                      'Add Subject'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Subject Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-border/50">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Edit Subject</h2>
              <form onSubmit={handleUpdateSubject} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Subject Name *</label>
                  <Input
                    placeholder="Mathematics"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="bg-input border-border/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Course Code *</label>
                  <Input
                    placeholder="MATH101"
                    value={editData.courseCode}
                    onChange={(e) => setEditData({ ...editData, courseCode: e.target.value })}
                    className="bg-input border-border/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Instructor *</label>
                  <Input
                    placeholder="Dr. John Smith"
                    value={editData.instructor}
                    onChange={(e) => setEditData({ ...editData, instructor: e.target.value })}
                    className="bg-input border-border/50"
                    required
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
                      'Update Subject'
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
              <h2 className="text-xl font-bold text-foreground mb-4">Delete Subject</h2>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete this subject? This action cannot be undone.
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
                  onClick={confirmDeleteSubject}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Subject'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
