'use client'

import { useState } from 'react'
import { User, Mail, Phone, MapPin, Save, Loader2 } from 'lucide-react'
import { FormStack, FormStackItem } from '@/components/shared/responsive/FormStack'
import { ResponsiveImageUpload } from '@/components/shared/responsive/ResponsiveImageUpload'

interface ProfileFormProps {
  initialData?: {
    name?: string
    email?: string
    phone?: string
    address?: string
    avatar?: string
  }
  onSave?: (data: any) => void
}

export default function ProfileForm({ initialData, onSave }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleAvatarChange = (file: File | null) => {
    setAvatar(file)
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    onSave?.({ ...formData, avatar })
    setSaving(false)
    setSaved(true)
    
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="mb-8">
        <ResponsiveImageUpload
          currentImage={initialData?.avatar}
          onImageChange={handleAvatarChange}
          size="lg"
        />
        <p className="mt-2 text-xs text-slate-500 text-center sm:text-left">
          JPG, PNG or GIF. Max 2MB.
        </p>
      </div>

      {/* Form Fields */}
      <FormStack>
        <FormStackItem label="Full Name" helperText="Your full name as it appears to clients">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
              placeholder="Enter your name"
            />
          </div>
        </FormStackItem>

        <FormStackItem label="Email Address" helperText="Used for login and notifications">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
              placeholder="Enter your email"
            />
          </div>
        </FormStackItem>

        <FormStackItem label="Phone Number" helperText="For appointment reminders and client contact">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
              placeholder="Enter your phone"
            />
          </div>
        </FormStackItem>

        <FormStackItem label="Address" helperText="Your salon's physical address">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
              placeholder="Enter your address"
            />
          </div>
        </FormStackItem>
      </FormStack>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {saved && (
          <span className="text-sm text-emerald-400">Profile saved successfully!</span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-gold-400 transition-colors disabled:opacity-50 min-h-11"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>
    </form>
  )
}
