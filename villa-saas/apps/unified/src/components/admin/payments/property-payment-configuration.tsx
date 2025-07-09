'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PropertyPaymentConfigurationProps {
  propertyId: string;
  onUpdate?: () => void;
}

export function PropertyPaymentConfiguration({ propertyId, onUpdate }: PropertyPaymentConfigurationProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    paymentMethods: {
      creditCard: true,
      bankTransfer: false,
      cash: false
    },
    paymentSchedule: {
      depositPercentage: 30,
      depositDueDays: 7,
      balanceDueDays: 30
    },
    cancellationPolicy: 'moderate',
    refundSettings: {
      processingDays: 7,
      automaticRefund: true
    }
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: Implement save logic when backend endpoint is ready
      toast({
        title: 'Configuration enregistrée',
        description: 'Les paramètres de paiement ont été mis à jour'
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer la configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Cette fonctionnalité est en cours de développement. Les paramètres de paiement seront bientôt disponibles.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="methods" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="methods">Méthodes de paiement</TabsTrigger>
          <TabsTrigger value="schedule">Échéancier</TabsTrigger>
          <TabsTrigger value="cancellation">Annulation</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Méthodes de paiement acceptées</CardTitle>
              <CardDescription>
                Choisissez les méthodes de paiement que vous acceptez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="credit-card">Carte de crédit</Label>
                <Switch
                  id="credit-card"
                  checked={config.paymentMethods.creditCard}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      paymentMethods: { ...config.paymentMethods, creditCard: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bank-transfer">Virement bancaire</Label>
                <Switch
                  id="bank-transfer"
                  checked={config.paymentMethods.bankTransfer}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      paymentMethods: { ...config.paymentMethods, bankTransfer: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="cash">Espèces</Label>
                <Switch
                  id="cash"
                  checked={config.paymentMethods.cash}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      paymentMethods: { ...config.paymentMethods, cash: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Échéancier de paiement</CardTitle>
              <CardDescription>
                Configurez les modalités de paiement pour vos réservations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="deposit-percentage">Pourcentage d'acompte (%)</Label>
                  <Input
                    id="deposit-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={config.paymentSchedule.depositPercentage}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        paymentSchedule: {
                          ...config.paymentSchedule,
                          depositPercentage: parseInt(e.target.value) || 0
                        }
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deposit-due-days">Délai de paiement de l'acompte (jours)</Label>
                  <Input
                    id="deposit-due-days"
                    type="number"
                    min="1"
                    value={config.paymentSchedule.depositDueDays}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        paymentSchedule: {
                          ...config.paymentSchedule,
                          depositDueDays: parseInt(e.target.value) || 1
                        }
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="balance-due-days">Délai de paiement du solde (jours avant l'arrivée)</Label>
                  <Input
                    id="balance-due-days"
                    type="number"
                    min="1"
                    value={config.paymentSchedule.balanceDueDays}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        paymentSchedule: {
                          ...config.paymentSchedule,
                          balanceDueDays: parseInt(e.target.value) || 1
                        }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancellation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Politique d'annulation</CardTitle>
              <CardDescription>
                Définissez vos conditions d'annulation et de remboursement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cancellation-policy">Politique d'annulation</Label>
                <Select
                  value={config.cancellationPolicy}
                  onValueChange={(value) =>
                    setConfig({ ...config, cancellationPolicy: value })
                  }
                >
                  <SelectTrigger id="cancellation-policy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">
                      Flexible - Remboursement complet jusqu'à 24h avant
                    </SelectItem>
                    <SelectItem value="moderate">
                      Modérée - Remboursement complet jusqu'à 5 jours avant
                    </SelectItem>
                    <SelectItem value="strict">
                      Stricte - Remboursement de 50% jusqu'à 1 semaine avant
                    </SelectItem>
                    <SelectItem value="super-strict">
                      Super stricte - Remboursement de 50% jusqu'à 30 jours avant
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="automatic-refund">Remboursement automatique</Label>
                  <Switch
                    id="automatic-refund"
                    checked={config.refundSettings.automaticRefund}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        refundSettings: {
                          ...config.refundSettings,
                          automaticRefund: checked
                        }
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="processing-days">Délai de traitement des remboursements (jours)</Label>
                  <Input
                    id="processing-days"
                    type="number"
                    min="1"
                    value={config.refundSettings.processingDays}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        refundSettings: {
                          ...config.refundSettings,
                          processingDays: parseInt(e.target.value) || 1
                        }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Enregistrement...' : 'Enregistrer la configuration'}
        </Button>
      </div>
    </div>
  );
}