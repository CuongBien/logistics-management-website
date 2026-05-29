"use client"

import { useState, useEffect } from "react"
import { Users, Search, Plus, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import * as masterdataService from "@/lib/services/masterdata"
import type { Partner } from "@/lib/types"

export default function MasterDataPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Partner>>({ name: "", phone: "", address: "", city: "", isActive: true, tenantId: "T-001" })

  const loadPartners = async () => {
    try { setPartners(await masterdataService.getPartners(search, 1) || []) }
    catch (e) { toast.error("Failed to load partners") }
  }

  useEffect(() => { loadPartners() }, [search])

  const handleSave = async () => {
    try {
      if (formData.id) {
        await masterdataService.updatePartner(formData.id, formData);
        toast.success("Partner updated");
      } else {
        await masterdataService.createPartner(formData);
        toast.success("Partner created");
      }
      setIsDialogOpen(false);
      loadPartners();
    } catch (e) { toast.error("Failed to save partner") }
  }

  const handleDelete = async (id: string) => {
    try {
      await masterdataService.deactivatePartner(id);
      toast.success("Partner deactivated");
      loadPartners();
    } catch (e) { toast.error("Failed to deactivate") }
  }

  const openForm = (p?: Partner) => {
    setFormData(p ? { ...p } : { name: "", phone: "", address: "", city: "", isActive: true, tenantId: "T-001" })
    setIsDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted border-b border-border px-4 py-2 flex items-center justify-between">
        <h1 className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> CRM & Master Data: Partners</h1>
        <Button size="sm" className="h-7 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={() => openForm()}><Plus className="h-3 w-3 mr-1"/>New Partner</Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        
        <div className="flex gap-2 max-w-sm mb-4">
          <Input placeholder="Search partners..." className="h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          <Button variant="outline" className="h-8 w-8 p-0" onClick={loadPartners}><Search className="h-3 w-3" /></Button>
        </div>

        <div className="border border-border bg-white rounded-md">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-[10px] uppercase h-8">ID</TableHead>
              <TableHead className="text-[10px] uppercase h-8">Tenant</TableHead>
              <TableHead className="text-[10px] uppercase h-8">Name</TableHead>
              <TableHead className="text-[10px] uppercase h-8">Contact</TableHead>
              <TableHead className="text-[10px] uppercase h-8">Location</TableHead>
              <TableHead className="text-[10px] uppercase h-8 text-center">Status</TableHead>
              <TableHead className="text-[10px] uppercase h-8 text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {!partners || partners.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-xs py-4 text-muted-foreground">No partners found</TableCell></TableRow> : 
                partners.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.id}</TableCell>
                    <TableCell className="text-xs font-mono">{p.tenantId}</TableCell>
                    <TableCell className="text-xs font-semibold">{p.name}</TableCell>
                    <TableCell className="text-xs font-mono">{p.phone}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.city ? `${p.address}, ${p.city}` : p.address}</TableCell>
                    <TableCell className="text-xs text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{p.isActive ? "Active" : "Inactive"}</span></TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600" onClick={() => openForm(p)}><Edit2 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-sm">{formData.id ? "Edit Partner" : "New Partner"}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
              <div><Label className="text-xs">Partner Name</Label><Input className="h-8 text-xs mt-1" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Phone</Label><Input className="h-8 text-xs mt-1" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} /></div>
                <div><Label className="text-xs">Tenant ID</Label><Input className="h-8 text-xs mt-1 font-mono" value={formData.tenantId} onChange={e=>setFormData({...formData,tenantId:e.target.value})} /></div>
              </div>
              <div><Label className="text-xs">Address</Label><Input className="h-8 text-xs mt-1" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})} /></div>
              <div><Label className="text-xs">City</Label><Input className="h-8 text-xs mt-1" value={formData.city} onChange={e=>setFormData({...formData,city:e.target.value})} /></div>
            </div>
            <DialogFooter><Button size="sm" variant="outline" className="h-8 text-xs" onClick={()=>setIsDialogOpen(false)}>Cancel</Button><Button size="sm" className="h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white shadow" onClick={handleSave}>Save changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}
