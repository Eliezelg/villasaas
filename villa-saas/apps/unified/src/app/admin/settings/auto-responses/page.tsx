'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { messagingService } from '@/services/messaging.service';
import { Plus, Edit, Trash2, MessageCircle, Clock, Bot, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { value: 'GREETING', label: 'Salutations', icon: '👋' },
  { value: 'AVAILABILITY', label: 'Disponibilité', icon: '📅' },
  { value: 'PRICING', label: 'Prix', icon: '💰' },
  { value: 'AMENITIES', label: 'Équipements', icon: '🏠' },
  { value: 'CHECK_IN_OUT', label: 'Check-in/out', icon: '🔑' },
  { value: 'LOCATION', label: 'Localisation', icon: '📍' },
  { value: 'BOOKING_CONFIRM', label: 'Confirmation', icon: '✅' },
  { value: 'BOOKING_REMINDER', label: 'Rappels', icon: '⏰' },
  { value: 'THANK_YOU', label: 'Remerciements', icon: '🙏' },
  { value: 'FAQ', label: 'FAQ', icon: '❓' },
  { value: 'OUT_OF_OFFICE', label: 'Hors bureau', icon: '🌙' },
  { value: 'CUSTOM', label: 'Personnalisé', icon: '⚡' },
];

const TRIGGERS = [
  { value: 'NEW_CONVERSATION', label: 'Nouvelle conversation' },
  { value: 'KEYWORD', label: 'Mots-clés détectés' },
  { value: 'TIME_BASED', label: 'Basé sur l\'heure' },
  { value: 'NO_RESPONSE', label: 'Pas de réponse' },
  { value: 'BOOKING_CREATED', label: 'Réservation créée' },
  { value: 'BOOKING_UPCOMING', label: 'Réservation proche' },
  { value: 'AFTER_STAY', label: 'Après le séjour' },
  { value: 'MANUAL', label: 'Manuel' },
];

export default function AutoResponsesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [chatbotEnabled, setChatbotEnabled] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesRes, rulesRes] = await Promise.all([
        messagingService.getAutoResponseTemplates(),
        messagingService.getAutoResponseRules(),
      ]);
      
      setTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
      setRules(Array.isArray(rulesRes.data) ? rulesRes.data : []);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (data: any) => {
    try {
      if (editingTemplate) {
        await messagingService.updateAutoResponseTemplate(editingTemplate.id, data);
        toast.success('Template mis à jour');
      } else {
        await messagingService.createAutoResponseTemplate(data);
        toast.success('Template créé');
      }
      loadData();
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await messagingService.deleteAutoResponseTemplate(id);
      toast.success('Template supprimé');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleInitializeTemplates = async () => {
    try {
      await messagingService.initializeAutoResponseTemplates();
      toast.success('Templates par défaut créés');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'initialisation');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Réponses automatiques</h1>
        <p className="text-muted-foreground">
          Configurez les messages automatiques et le chatbot IA pour répondre à vos clients
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">
            <MessageCircle className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Clock className="w-4 h-4 mr-2" />
            Règles
          </TabsTrigger>
          <TabsTrigger value="chatbot">
            <Bot className="w-4 h-4 mr-2" />
            Chatbot IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Templates de messages</CardTitle>
                  <CardDescription>
                    Messages prédéfinis pour répondre rapidement aux questions fréquentes
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {templates.length === 0 && (
                    <Button variant="outline" onClick={handleInitializeTemplates}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Créer templates par défaut
                    </Button>
                  )}
                  <Button onClick={() => setShowTemplateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => {
                  const category = CATEGORIES.find(c => c.value === template.category);
                  const trigger = TRIGGERS.find(t => t.value === template.trigger);
                  
                  return (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{category?.icon}</span>
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant={template.isActive ? 'default' : 'secondary'}>
                              {template.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span>{category?.label}</span>
                            <span>•</span>
                            <span>{trigger?.label}</span>
                            <span>•</span>
                            <span>Priorité: {template.priority}</span>
                            {template.usageCount > 0 && (
                              <>
                                <span>•</span>
                                <span>Utilisé {template.usageCount} fois</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {template.content.fr?.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingTemplate(template);
                              setShowTemplateDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Règles de déclenchement</CardTitle>
                  <CardDescription>
                    Définissez quand et comment les réponses automatiques sont envoyées
                  </CardDescription>
                </div>
                <Button onClick={() => setShowRuleDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle règle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {rule.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {rule.property && (
                            <span>Propriété: {rule.property.name}</span>
                          )}
                          <span>Priorité: {rule.priority}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => {
                            // TODO: Update rule status
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingRule(rule);
                            setShowRuleDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chatbot">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot IA</CardTitle>
              <CardDescription>
                Utilisez l\'intelligence artificielle pour répondre automatiquement aux questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Activer le chatbot IA</h3>
                    <p className="text-sm text-muted-foreground">
                      Le chatbot répondra automatiquement aux nouvelles conversations
                    </p>
                  </div>
                  <Switch
                    checked={chatbotEnabled}
                    onCheckedChange={setChatbotEnabled}
                  />
                </div>

                {chatbotEnabled && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">Configuration OpenAI</h4>
                    <div className="space-y-2">
                      <Label>Clé API OpenAI</Label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        defaultValue={process.env.NEXT_PUBLIC_OPENAI_API_KEY}
                      />
                      <p className="text-xs text-muted-foreground">
                        Votre clé API OpenAI pour utiliser GPT-4
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Modèle</Label>
                      <Select defaultValue="gpt-4o-mini">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rapide et économique)</SelectItem>
                          <SelectItem value="gpt-4">GPT-4 (Plus intelligent)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <TemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />

      {/* Rule Dialog */}
      <RuleDialog
        open={showRuleDialog}
        onOpenChange={setShowRuleDialog}
        rule={editingRule}
        onSave={(data: any) => {
          // TODO: Implement save rule
          setShowRuleDialog(false);
        }}
      />
    </div>
  );
}

function TemplateDialog({ open, onOpenChange, template, onSave }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'GREETING',
    trigger: 'NEW_CONVERSATION',
    content: { fr: '', en: '' },
    priority: 0,
    isActive: true,
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'GREETING',
        trigger: 'NEW_CONVERSATION',
        content: { fr: '', en: '' },
        priority: 0,
        isActive: true,
      });
    }
  }, [template]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Modifier le template' : 'Nouveau template'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nom</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Message de bienvenue"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        {cat.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Déclencheur</Label>
              <Select
                value={formData.trigger}
                onValueChange={(value) => setFormData({ ...formData, trigger: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Message (Français)</Label>
            <Textarea
              value={formData.content.fr}
              onChange={(e) => setFormData({
                ...formData,
                content: { ...formData.content, fr: e.target.value }
              })}
              rows={4}
              placeholder="Tapez votre message ici..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Variables disponibles: {'{property_name}'}, {'{guest_name}'}, {'{check_in}'}, {'{check_out}'}
            </p>
          </div>
          <div>
            <Label>Message (English)</Label>
            <Textarea
              value={formData.content.en || ''}
              onChange={(e) => setFormData({
                ...formData,
                content: { ...formData.content, en: e.target.value }
              })}
              rows={4}
              placeholder="Type your message here..."
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Priorité</Label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                min={0}
                max={100}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Actif</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => onSave(formData)}>
            {template ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleDialog({ open, onOpenChange, rule, onSave }: any) {
  // TODO: Implement rule dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Modifier la règle' : 'Nouvelle règle'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          Fonctionnalité en cours de développement...
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}