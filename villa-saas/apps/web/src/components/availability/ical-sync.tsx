'use client';

import { useState } from 'react';
import { Calendar, Link, Download, Upload, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { availabilityService } from '@/services/availability.service';
import { useToast } from '@/hooks/use-toast';

interface IcalSyncProps {
  propertyId: string;
  onImport?: () => void;
}

export function IcalSync({ propertyId, onImport }: IcalSyncProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [exportUrl, setExportUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const loadExportUrl = async () => {
    try {
      const { data } = await availabilityService.getIcalExportUrl(propertyId);
      setExportUrl(data.url);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer l\'URL d\'export',
        variant: 'destructive'
      });
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    if (!exportUrl) {
      loadExportUrl();
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une URL valide',
        variant: 'destructive'
      });
      return;
    }

    try {
      setImporting(true);
      const { data } = await availabilityService.importIcal({
        propertyId,
        url: importUrl
      });

      toast({
        title: 'Import terminé',
        description: `${data.imported} événements importés, ${data.skipped} ignorés`,
      });

      if (data.errors.length > 0) {
        console.error('Import errors:', data.errors);
      }

      setImportUrl('');
      onImport?.();
    } catch (error: any) {
      toast({
        title: 'Erreur d\'import',
        description: error.response?.data?.error || 'Impossible d\'importer le calendrier',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'URL copiée',
      description: 'L\'URL a été copiée dans le presse-papiers',
    });
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleOpenDialog}
        className="gap-2"
      >
        <Calendar className="w-4 h-4" />
        Synchronisation iCal
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Synchronisation des calendriers</DialogTitle>
            <DialogDescription>
              Synchronisez votre calendrier avec d'autres plateformes (Airbnb, Booking.com, etc.)
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="export" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </TabsTrigger>
              <TabsTrigger value="import">
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4">
              <div>
                <Label>URL du calendrier</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={exportUrl}
                    readOnly
                    placeholder="Chargement..."
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    disabled={!exportUrl}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Copiez cette URL et ajoutez-la dans votre calendrier externe
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Instructions par plateforme :</h4>
                
                <Card className="p-4">
                  <h5 className="font-medium mb-2">Airbnb</h5>
                  <p className="text-sm text-muted-foreground">
                    Dans votre calendrier Airbnb → Disponibilité → Synchroniser les calendriers → Importer un calendrier
                  </p>
                </Card>

                <Card className="p-4">
                  <h5 className="font-medium mb-2">Google Calendar</h5>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur "+" à côté de "Autres agendas" → "À partir de l'URL"
                  </p>
                </Card>

                <Card className="p-4">
                  <h5 className="font-medium mb-2">Outlook</h5>
                  <p className="text-sm text-muted-foreground">
                    Paramètres → Calendrier → Calendriers partagés → Publier un calendrier
                  </p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <div>
                <Label>URL du calendrier à importer</Label>
                <Input
                  className="mt-2"
                  placeholder="https://..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Entrez l'URL iCal fournie par l'autre plateforme (Airbnb, Booking.com, etc.)
                </p>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Comment obtenir l'URL iCal ?</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Airbnb :</strong> Calendrier → Disponibilité → Synchroniser → Exporter</li>
                  <li>• <strong>Booking.com :</strong> Calendrier → Synchronisation → Exporter</li>
                  <li>• <strong>Google Calendar :</strong> Paramètres → Intégrer le calendrier</li>
                </ul>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
                className="w-full"
              >
                {importing ? 'Import en cours...' : 'Importer le calendrier'}
              </Button>

              <p className="text-sm text-muted-foreground">
                Les événements importés seront ajoutés comme périodes bloquées. 
                Les conflits avec des réservations existantes seront ignorés.
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}