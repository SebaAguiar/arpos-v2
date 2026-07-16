# Wizards Interactivos — ArPOS Tauri v2

Este documento especifica los asistentes interactivos (wizards) de ArPOS: FirstRunWizard, Migration Wizard y configuración de sync.

---

## 1. Objetivo

Mejorar la experiencia del usuario (UX) proporcionando **asistentes paso a paso** que guíen al usuario a través de la configuración inicial, migración de datos y sincronización, sin necesidad de conocimiento técnico.

---

## 2. FirstRunWizard (Setup Inicial)

### 2.1 When It Triggers

El FirstRunWizard se ejecuta automáticamente cuando:
- ArPOS se instala por primera vez.
- No existe Company configurada en la base de datos.
- El usuario abre ArPOS después de la instalación.

### 2.2 Flow

```
Paso 1: Welcome
┌─────────────────────────────────────────────┐
│  ¡Bienvenido a ArPOS!                       │
│                                             │
│  Vamos a configurar tu negocio en           │
│  unos simples pasos.                        │
│                                             │
│         [ Comenzar configuración ]          │
└─────────────────────────────────────────────┘

Paso 2: Company Setup
┌─────────────────────────────────────────────┐
│  Datos de tu negocio                        │
│                                             │
│  Nombre:     [____________________]         │
│  CUIT/RUT:   [____________________]         │
│  Dirección:  [____________________]         │
│  Email:      [____________________]         │
│  Teléfono:   [____________________]         │
│                                             │
│         [ Atrás ]    [ Siguiente ]          │
└─────────────────────────────────────────────┘

Paso 3: Store Setup
┌─────────────────────────────────────────────┐
│  Configurar sucursal principal              │
│                                             │
│  Nombre:     [Sucursal Principal    ]       │
│  Dirección:  [____________________]         │
│                                             │
│  (Se crea automáticamente la primera       │
│   sucursal. Puedes agregar más después.)   │
│                                             │
│         [ Atrás ]    [ Siguiente ]          │
└─────────────────────────────────────────────┘

Paso 4: Admin User Setup
┌─────────────────────────────────────────────┐
│  Crear usuario administrador                │
│                                             │
│  Email:      [____________________]         │
│  Contraseña: [____________________]         │
│  Confirmar:  [____________________]         │
│  Nombre:     [____________________]         │
│                                             │
│         [ Atrás ]    [ Siguiente ]          │
└─────────────────────────────────────────────┘

Paso 5: Success
┌─────────────────────────────────────────────┐
│  ✅ ¡Configuración completada!              │
│                                             │
│  Tu negocio está listo para usar ArPOS.     │
│                                             │
│  • 1 sucursal creada                        │
│  • 1 usuario admin creado                   │
│  • Base de datos inicializada               │
│                                             │
│         [ Ir al POS ]                       │
└─────────────────────────────────────────────┘
```

### 2.3 Implementation

```typescript
// apps/pos-react/src/components/auth/FirstRunWizard.tsx

const FirstRunWizard = () => {
  const [step, setStep] = useState<'welcome' | 'company' | 'store' | 'admin' | 'done'>('welcome');
  const { createCompany } = useSettingsApi();

  return (
    <div className="flex h-screen items-center justify-center bg-gradient">
      {step === 'welcome' && (
        <WelcomeStep onNext={() => setStep('company')} />
      )}
      {step === 'company' && (
        <CompanySetupStep onNext={() => setStep('store')} />
      )}
      {step === 'store' && (
        <StoreSetupStep onNext={() => setStep('admin')} />
      )}
      {step === 'admin' && (
        <AdminUserSetupStep onComplete={() => setStep('done')} />
      )}
      {step === 'done' && (
        <SuccessStep onFinish={() => navigate('/dashboard')} />
      )}
    </div>
  );
};
```

---

## 3. Migration Wizard (Cloud → Local)

### 3.1 When It Triggers

El Migration Wizard se ejecuta cuando:
- El usuario tiene datos en la nube (PostgreSQL cloud) y quiere migrarlos a local.
- Se detecta una instalación anterior de ArPOS cloud.
- El usuario lo selecciona desde Settings > Backup & Restore.

### 3.2 Flow

```
Paso 1: Selection
┌─────────────────────────────────────────────┐
│  ¿Tienes datos en la nube?                  │
│                                             │
│  [✓] Migrar mis datos a local              │
│  [ ] Empezar de cero                        │
│  [ ] Aún no sé                              │
│                                             │
│         [ Cancelar ]    [ Siguiente ]       │
└─────────────────────────────────────────────┘

Paso 2: Credentials
┌─────────────────────────────────────────────┐
│  Ingresá tu email y contraseña de ArPOS    │
│                                             │
│  Email:    [____________________]           │
│  Password: [____________________]           │
│                                             │
│         [ Cancelar ]    [ Siguiente ]       │
└─────────────────────────────────────────────┘

Paso 3: Progress
┌─────────────────────────────────────────────┐
│  Migrando datos...                          │
│                                             │
│  █████████████░░░░░░░░  60%                │
│                                             │
│  Productos: 45,234 ✓                       │
│  Ventas: 12,456 ✓                          │
│  Inventario: En proceso...                 │
│                                             │
│  Tiempo estimado: 2 min 30s                │
└─────────────────────────────────────────────┘

Paso 4: Complete
┌─────────────────────────────────────────────┐
│  ✅ Migración completada                    │
│                                             │
│  • 45,234 productos migrados               │
│  • 12,456 ventas migradas                  │
│  • 1,234 contactos migrados                │
│                                             │
│  [✓] Mantener sincronizado con cloud       │
│                                             │
│         [ Ir al POS ]                       │
└─────────────────────────────────────────────┘
```

### 3.3 Technical Flow

```typescript
// apps/pos-react/src/components/auth/MigrationWizard.tsx

const MigrationWizard = () => {
  const [step, setStep] = useState<'select' | 'credentials' | 'progress' | 'complete'>('select');
  const [progress, setProgress] = useState({ current: 0, total: 0, table: '' });

  const handleMigrate = async (email: string, password: string) => {
    setStep('progress');

    // 1. Validate credentials with cloud API
    const token = await validateCredentials(email, password);

    // 2. Download data in batches
    const tables = ['companies', 'stores', 'users', 'products', 'inventory',
                    'sales', 'sales_items', 'contacts', 'cash_registers'];

    for (const table of tables) {
      setProgress(prev => ({ ...prev, table }));
      await downloadTable(table, token);
    }

    // 3. Create SQLite schema
    await prisma.migrate.deploy();

    // 4. Insert data from cache
    await insertCachedData();

    // 5. Validate migration
    await validateMigration();

    setStep('complete');
  };

  return (
    <div>
      {step === 'select' && <SelectionStep onNext={() => setStep('credentials')} />}
      {step === 'credentials' && <CredentialsStep onMigrate={handleMigrate} />}
      {step === 'progress' && <ProgressStep progress={progress} />}
      {step === 'complete' && <CompleteStep onFinish={() => navigate('/pos')} />}
    </div>
  );
};
```

---

## 4. Cloud Sync Settings

### 4.1 Configuration Screen

```
┌─────────────────────────────────────────────┐
│  Sincronización con Cloud                   │
│                                             │
│  Estado: ● Conectado                        │
│  Última sync: hace 5 minutos               │
│  Cambios pendientes: 0                      │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Cloud URL:  [https://cloud.arpos.app  ]    │
│  JWT Token:  [••••••••••••••••••••••••••]   │
│                                             │
│  [✓] Sincronizar automáticamente           │
│  [✓] Resolver conflictos (last-write-wins) │
│  [ ] Modo solo lectura                     │
│                                             │
│  Intervalo de sync: [5 min ▼]              │
│                                             │
│  [ Probar conexión ]  [ Forzar sync now ]  │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  ⚠️ La sincronización es opcional.          │
│  ArPOS funciona 100% offline sin ella.     │
│                                             │
│         [ Guardar ]    [ Cancelar ]         │
└─────────────────────────────────────────────┘
```

---

## 5. Backup & Restore

### 5.1 Backup Screen

```
┌─────────────────────────────────────────────┐
│  Backup y Restore                           │
│                                             │
│  Último backup: 2026-07-16 03:00           │
│  Próximo backup: 2026-07-17 03:00          │
│  Tamaño DB: 45.2 MB                        │
│                                             │
│  [ Crear backup ahora ]                     │
│  [ Restaurar desde backup ]                 │
│  [ Exportar a SQL ]                         │
│                                             │
│  Backups disponibles:                       │
│  ┌─────────────────────────────────────┐    │
│  │ auto_2026-07-16_03:00.tar.gz  12MB │    │
│  │ auto_2026-07-15_03:00.tar.gz  11MB │    │
│  │ auto_2026-07-14_03:00.tar.gz  10MB │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [✓] Backup automático diario             │
│  Hora de backup: [03:00]                   │
│  Retener: [30 días ▼]                      │
└─────────────────────────────────────────────┘
```

---

## 6. Especificación Técnica

### 6.1 Librería de Prompts

Usar `@radix-ui/react-dialog` para modales y componentes Shadcn/ui para forms. No se necesita librería CLI (este es un app React, no un CLI tool).

### 6.2 Validación

Todos los forms usan Zod schemas para validación:
```typescript
const CompanySchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  taxId: z.string().min(8, 'CUIT/RUT inválido'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
});
```

### 6.3 Persistencia

Los datos del wizard se persisten en SQLite via Prisma. El wizard crea:
- 1 Company record
- 1 Store record
- 1 User record (admin)
- Configuración inicial (settings)
