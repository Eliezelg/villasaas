'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface PropertyQuota {
  used: number;
  included: number | 'unlimited';
  additional: number;
  canAdd: boolean;
  requiresPayment: boolean;
  plan: string;
}

export function PropertyQuotaCard() {
  const router = useRouter();
  const locale = useLocale();
  const [quota, setQuota] = useState<PropertyQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const { data } = await apiClient.get<PropertyQuota>('/api/properties/quota');
      if (data) {
        setQuota(data);
      }
    } catch (error) {
      console.error('Failed to fetch property quota:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quota) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Propriétés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  const isUnlimited = quota.included === 'unlimited';
  const percentage = isUnlimited ? 0 : (quota.used / (quota.included as number)) * 100;
  const isAtLimit = !isUnlimited && quota.used >= (quota.included as number);

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'starter':
        return 'Starter';
      case 'standard':
        return 'Standard';
      case 'enterprise':
        return 'Entreprise';
      default:
        return 'Aucun';
    }
  };

  const handleUpgrade = () => {
    router.push(`/${locale}/admin/dashboard/settings/payments`);
  };

  const handleAddProperty = () => {
    if (quota.canAdd) {
      router.push(`/${locale}/admin/dashboard/properties/new`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Propriétés
        </CardTitle>
        <CardDescription>
          Plan {getPlanName(quota.plan)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isUnlimited && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilisées</span>
              <span className="font-medium">
                {quota.used} / {quota.included}
              </span>
            </div>
            <Progress value={percentage} className={isAtLimit ? 'bg-orange-100' : ''} />
          </div>
        )}

        {isUnlimited && (
          <div className="text-center py-2">
            <p className="text-2xl font-bold">{quota.used}</p>
            <p className="text-sm text-muted-foreground">Propriétés (illimité)</p>
          </div>
        )}

        {quota.additional > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>{quota.additional} propriété{quota.additional > 1 ? 's' : ''} supplémentaire{quota.additional > 1 ? 's' : ''}</strong>
              <br />
              <span className="text-xs">
                +{quota.additional * 15}$/mois en plus de votre abonnement
              </span>
            </p>
          </div>
        )}

        {isAtLimit && quota.plan === 'starter' && (
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>Limite atteinte</strong>
              <br />
              Passez au plan Standard pour ajouter plus de propriétés.
            </p>
          </div>
        )}

        {quota.requiresPayment && (
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Propriété supplémentaire</strong>
              <br />
              15$/mois seront ajoutés à votre facture.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {quota.canAdd ? (
            <Button 
              onClick={handleAddProperty}
              className="flex-1"
              variant={quota.requiresPayment ? 'outline' : 'default'}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une propriété
              {quota.requiresPayment && ' (+15$/mois)'}
            </Button>
          ) : (
            <Button 
              onClick={handleUpgrade}
              className="flex-1"
              variant="default"
            >
              <Zap className="h-4 w-4 mr-2" />
              Passer au plan Standard
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}