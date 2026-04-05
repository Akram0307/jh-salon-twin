'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit2 } from 'lucide-react'

interface ServiceDialogProps {
  service?: {
    id?: string
    name?: string
    description?: string
    price?: number
    duration?: number
    category?: string
  }
  onServiceSaved?: () => void
}

export default function ServiceDialog({ service, onServiceSaved }: ServiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(service?.name || '')
  const [description, setDescription] = useState(service?.description || '')
  const [price, setPrice] = useState(service?.price?.toString() || '')
  const [duration, setDuration] = useState(service?.duration?.toString() || '')
  const [category, setCategory] = useState(service?.category || 'hair')

  const isEditing = !!service?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log(isEditing ? 'Updating service:' : 'Creating service:', { name, description, price, duration, category })
    setOpen(false)
    onServiceSaved?.()
  }

  return (
    <>
      {isEditing ? (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Edit2 className="h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)} className="bg-gold-500 text-slate-950 hover:bg-gold-400">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{isEditing ? 'Edit Service' : 'Add New Service'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Service Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                >
                  <option value="hair">Hair Services</option>
                  <option value="color">Color Services</option>
                  <option value="nails">Nail Services</option>
                  <option value="spa">Spa Services</option>
                  <option value="barber">Barber Services</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gold-500 text-slate-950 hover:bg-gold-400">
                  {isEditing ? 'Save Changes' : 'Add Service'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
