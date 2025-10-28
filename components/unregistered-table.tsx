"use client"

import type React from "react"

import { useState } from "react"
import { AlertCircle, UserPlus, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUnregisteredUsers, registerUser } from "@/hooks/use-api"

export function UnregisteredTable() {
  const [page, setPage] = useState(1)
  const limit = 20
  const { data, loading, error, refetch } = useUnregisteredUsers(page, limit)
  const [showModal, setShowModal] = useState(false)
  const [selectedRfid, setSelectedRfid] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", employeeId: "", email: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const unregistered = data?.unregisteredUsers || []

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRfid && formData.name) {
      try {
        setIsSubmitting(true)
        await registerUser({
          rfid: selectedRfid,
          name: formData.name,
          employeeId: formData.employeeId || undefined,
          email: formData.email || undefined,
        })
        
        // Reset form
        setFormData({ name: "", employeeId: "", email: "" })
        setSelectedRfid(null)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Unregistered RFID Tags</h1>
          <p className="text-muted-foreground">Register unknown RFID tags to the system.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading unregistered users...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Unregistered RFID Tags</h1>
          <p className="text-muted-foreground">Register unknown RFID tags to the system.</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Error loading unregistered users: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Unregistered RFID Tags</h1>
        <p className="text-muted-foreground">Register unknown RFID tags to the system.</p>
      </div>

      {/* Alert */}
      {unregistered.length > 0 && (
        <Card className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <div className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">
                {unregistered.length} unregistered RFID tag{unregistered.length !== 1 ? "s" : ""} detected
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Please register these tags to enable attendance tracking.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      {unregistered.length > 0 ? (
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">RFID Tag</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Last Seen</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Scanned Count</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unregistered.map((record) => (
                  <tr key={record._id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-mono font-medium">{record.rfid}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(record.lastSeen).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{record.scannedCount}</td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedRfid(record.rfid)
                          setShowModal(true)
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-xs"
                      >
                        <UserPlus className="w-4 h-4" />
                        Register
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground mb-2">No Unregistered Tags</p>
            <p className="text-muted-foreground">All RFID tags are registered and active.</p>
          </div>
        </Card>
      )}

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border border-border/50">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Register RFID Tag</h2>
              <p className="text-sm text-muted-foreground mb-4">RFID: {selectedRfid}</p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Employee Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border-border/50"
                    required
                  />
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
                        Registering...
                      </>
                    ) : (
                      'Register'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
