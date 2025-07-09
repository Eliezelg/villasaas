'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { userService } from '@/services/admin/user.service'
import { toast } from 'sonner'
import { Search, UserPlus, Mail, Shield, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'OWNER' | 'ADMIN' | 'USER'
  active: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'USER' | 'ADMIN'>('USER')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await userService.getAll()
      if (response.data) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      toast.error('Impossible de charger les utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Veuillez entrer une adresse email')
      return
    }

    setInviting(true)
    try {
      const response = await userService.invite({
        email: inviteEmail,
        role: inviteRole
      })
      
      if (response.data) {
        toast.success('Invitation envoyée avec succès')
        setIsInviteOpen(false)
        setInviteEmail('')
        setInviteRole('USER')
        loadUsers()
      }
    } catch (error) {
      console.error('Erreur lors de l\'invitation:', error)
      toast.error('Impossible d\'envoyer l\'invitation')
    } finally {
      setInviting(false)
    }
  }

  const toggleUserStatus = async (userId: string, active: boolean) => {
    try {
      await userService.update(userId, { active: !active })
      toast.success(active ? 'Utilisateur désactivé' : 'Utilisateur activé')
      loadUsers()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error('Impossible de modifier le statut')
    }
  }

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase()
    return (
      user.email.toLowerCase().includes(search) ||
      user.firstName.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search)
    )
  })

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default'
      case 'ADMIN':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Propriétaire'
      case 'ADMIN':
        return 'Administrateur'
      case 'USER':
        return 'Utilisateur'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs de votre organisation
          </p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Inviter un utilisateur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {users.length} utilisateur{users.length > 1 ? 's' : ''} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={user.active ? 'success' : 'destructive'}>
                          {user.active ? 'Actif' : 'Inactif'}
                        </Badge>
                        {user.emailVerified && (
                          <Badge variant="outline" className="text-xs">
                            Email vérifié
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? (
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.active)}
                        >
                          {user.active ? 'Désactiver' : 'Activer'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un utilisateur</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email pour rejoindre votre organisation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={inviteRole} onValueChange={(value: 'USER' | 'ADMIN') => setInviteRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Utilisateur</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}