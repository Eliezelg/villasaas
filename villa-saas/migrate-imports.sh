#!/bin/bash

echo "🔄 Migration des imports..."

# Backend imports
cd apps/backend/src

# Remplacer les imports des utils
find . -name "*.ts" -type f -exec sed -i "s|from '../../utils/password'|from '@villa-saas/utils'|g" {} \;
find . -name "*.ts" -type f -exec sed -i "s|from '../../utils/tenant'|from '@villa-saas/utils'|g" {} \;
find . -name "*.ts" -type f -exec sed -i "s|from '../utils/password'|from '@villa-saas/utils'|g" {} \;
find . -name "*.ts" -type f -exec sed -i "s|from '../utils/tenant'|from '@villa-saas/utils'|g" {} \;

echo "✅ Imports migrés"