// scripts/check-security.ts
import { prisma } from '../lib/prisma';

async function checkSecurityTables() {
  try {
    console.log('🔍 Verificando tablas de seguridad...');
    
    // Verificar SecuritySettings
    const settings = await (prisma as any).securitySettings.findFirst();
    console.log('✅ SecuritySettings:', settings ? 'Existe' : 'No existe');
    
    // Verificar UserSession
    const sessions = await (prisma as any).userSession.findFirst();
    console.log('✅ UserSession:', sessions ? 'Existe' : 'No existe');
    
    // Verificar LoginAttempt
    const attempts = await (prisma as any).loginAttempt.findFirst();
    console.log('✅ LoginAttempt:', attempts ? 'Existe' : 'No existe');
    
    console.log('✅ Todas las tablas verificadas correctamente');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSecurityTables();