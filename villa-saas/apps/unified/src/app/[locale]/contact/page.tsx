'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Loader2, Mail, MapPin, Phone } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success(t('common.messageSent'))
    setFormData({ name: '', email: '', subject: '', message: '' })
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('common.contact')}</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('common.sendMessage')}</CardTitle>
              <CardDescription>
                {t('common.contactDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('common.name')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">{t('common.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="subject">{t('common.subject')}</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">{t('common.message')}</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={5}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.sending')}
                    </>
                  ) : (
                    t('common.send')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('common.contactInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{t('common.email')}</p>
                    <p className="text-sm text-muted-foreground">contact@webpro200.fr</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{t('common.phone')}</p>
                    <p className="text-sm text-muted-foreground">+33 1 23 45 67 89</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{t('common.address')}</p>
                    <p className="text-sm text-muted-foreground">
                      123 Avenue de la République<br />
                      75011 Paris, France
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('common.hours')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('common.monday')} - {t('common.friday')}</span>
                    <span>9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('common.saturday')}</span>
                    <span>10:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('common.sunday')}</span>
                    <span className="text-muted-foreground">{t('common.closed')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}