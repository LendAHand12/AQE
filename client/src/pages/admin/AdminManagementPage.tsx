import { useState, useEffect } from "react"
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Pencil, 
  Loader2
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import apiClient from "@/lib/axios"
import dayjs from "dayjs"

// Define available permissions grouped by category
const PERMISSION_GROUPS = [
  {
    category: "Users",
    permissions: [
      { id: "USERS_VIEW", label: "View List" },
      { id: "USERS_EDIT", label: "Edit Information" },
      { id: "USERS_DELETE", label: "Delete Account" },
      { id: "USERS_EXPORT", label: "Export Data" },
    ]
  },
  {
    category: "KYC Verification",
    permissions: [
      { id: "KYC_VIEW", label: "View KYC Requests" },
      { id: "KYC_APPROVE", label: "Approve/Reject KYC" },
    ]
  },
  {
    category: "Properties",
    permissions: [
      { id: "PROPERTIES_VIEW", label: "View List" },
      { id: "PROPERTIES_ADD", label: "Add New" },
      { id: "PROPERTIES_EDIT", label: "Edit" },
      { id: "PROPERTIES_DELETE", label: "Delete" },
    ]
  },
  {
    category: "Transactions",
    permissions: [
      { id: "TRANSACTIONS_VIEW", label: "View Transaction History" },
      { id: "TRANSACTIONS_EXPORT", label: "Export Data" },
    ]
  },
  {
    category: "Withdrawals",
    permissions: [
      { id: "WITHDRAWALS_VIEW", label: "View Withdrawal Requests" },
      { id: "WITHDRAWALS_APPROVE", label: "Approve Withdrawals" },
      { id: "WITHDRAWALS_EXPORT", label: "Export Data" },
    ]
  },
  {
    category: "Pool Settings",
    permissions: [
      { id: "SETTINGS_VIEW", label: "View Pool Settings" },
      { id: "SETTINGS_EDIT", label: "Update Pool Settings" },
    ]
  },
  {
    category: "Support Tickets",
    permissions: [
      { id: "TICKETS_VIEW", label: "View Tickets" },
      { id: "TICKETS_MANAGE", label: "Reply and Resolve Tickets" },
    ]
  },
  {
    category: "Investment Packages",
    permissions: [
      { id: "PACKAGES_VIEW", label: "View List" },
      { id: "PACKAGES_EDIT", label: "Add/Edit Packages" },
      { id: "PACKAGES_DELETE", label: "Delete Packages" },
    ]
  }
]

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "subadmin",
    permissions: [] as string[]
  })

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get("/admin/accounts")
      setAdmins(response.data)
    } catch (err: any) {
      toast.error("Could not load admin account list")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleOpenModal = (admin: any = null) => {
    if (admin) {
      setEditingAdmin(admin)
      setFormData({
        username: admin.username,
        password: "", // Don't show password
        role: admin.role,
        permissions: admin.permissions || []
      })
    } else {
      setEditingAdmin(null)
      setFormData({
        username: "",
        password: "",
        role: "subadmin",
        permissions: []
      })
    }
    setIsModalOpen(true)
  }

  const handlePermissionChange = (permId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permId]
        : prev.permissions.filter(p => p !== permId)
    }))
  }

  const handleSubmit = async () => {
    if (!formData.username) return toast.error("Please enter username")
    if (!editingAdmin && !formData.password) return toast.error("Please enter password")

    try {
      if (editingAdmin) {
        await apiClient.put(`/admin/accounts/${editingAdmin._id}`, formData)
        toast.success("Account updated successfully")
      } else {
        await apiClient.post("/admin/accounts", formData)
        toast.success("Subadmin account created successfully")
      }
      setIsModalOpen(false)
      fetchAdmins()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "An error occurred")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return
    try {
      await apiClient.delete(`/admin/accounts/${id}`)
      toast.success("Account deleted successfully")
      fetchAdmins()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not delete account")
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0d1f1d]">Admin Management</h1>
          <p className="text-[#6b7280]">Create and assign permissions for system administrator accounts</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="bg-[#276152] hover:bg-[#276152]/90 text-white gap-2"
        >
          <UserPlus size={18} />
          Add Subadmin
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[#efefef] shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-[#0d1f1d]">Username</TableHead>
              <TableHead className="font-bold text-[#0d1f1d]">Role</TableHead>
              <TableHead className="font-bold text-[#0d1f1d]">Permissions</TableHead>
              <TableHead className="font-bold text-[#0d1f1d]">Created At</TableHead>
              <TableHead className="text-right font-bold text-[#0d1f1d]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#276152] mx-auto" />
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-gray-400">
                  No admin accounts yet
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium text-[#0d1f1d]">{admin.username}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      admin.role === 'superadmin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {admin.role.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[400px]">
                      {admin.role === 'superadmin' ? (
                        <span className="text-xs text-gray-400 italic">Full System Access</span>
                      ) : admin.permissions?.length > 0 ? (
                        admin.permissions.map((p: string) => (
                          <span key={p} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-red-400 italic">No permissions</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#717c8d] text-sm">
                    {dayjs(admin.createdAt).format("DD/MM/YYYY HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleOpenModal(admin)}
                      >
                        <Pencil size={18} />
                      </Button>
                      {admin.role !== 'superadmin' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(admin._id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-[#276152]" />
              {editingAdmin ? "Edit Account" : "Create New Subadmin"}
            </DialogTitle>
            <DialogDescription>
              Set detailed permissions for administrative staff.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0d1f1d]">Username (Email)</label>
                <Input 
                  placeholder="nhanvien@gmail.com" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0d1f1d]">Password {editingAdmin && "(Leave blank if no change)"}</label>
                <Input 
                  type="password"
                  placeholder="********" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0d1f1d]">Role</label>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({...formData, role: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subadmin">Subadmin (Limited permissions)</SelectItem>
                  <SelectItem value="superadmin">Superadmin (Full access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'subadmin' && (
              <div className="space-y-4 border-t pt-4">
                <label className="text-sm font-bold text-[#0d1f1d]">Detailed Permissions</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.category} className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <h4 className="text-xs font-bold text-[#276152] uppercase tracking-wider">{group.category}</h4>
                      <div className="space-y-2">
                        {group.permissions.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={perm.id} 
                              checked={formData.permissions.includes(perm.id)}
                              onCheckedChange={(checked) => handlePermissionChange(perm.id, !!checked)}
                            />
                            <label htmlFor={perm.id} className="text-sm font-medium leading-none cursor-pointer">
                              {perm.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-[#276152] hover:bg-[#276152]/90 text-white"
              onClick={handleSubmit}
            >
              {editingAdmin ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
