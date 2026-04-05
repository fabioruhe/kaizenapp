# Segundo Cérebro — Documento de Escopo Técnico

> Versão: 1.0 | Data: 30/03/2026 | Status: Referência canônica para implementação

---

## 1. Visão Geral

### Produto

**Segundo Cérebro** é um aplicativo mobile de desenvolvimento pessoal focado em dois pilares:

1. **Hábitos** — construção de novos hábitos e eliminação de vícios, com rastreamento de sequências (streaks) e progresso diário
2. **Tarefas** — gerenciamento de tarefas com prioridade, prazos e organização visual

O nome remete ao conceito de externalizar a memória e a disciplina para um sistema confiável, liberando a mente para o que importa.

### Valores Centrais

- **Honestidade com o usuário** — sem dark patterns, sem notificações manipulativas
- **Simplicidade radical** — cada tela faz uma coisa muito bem
- **Privacidade por design** — dados do usuário nunca são lidos individualmente, nem na Fase 2
- **Persistência local primeiro** — o app funciona 100% offline; sync é uma camada adicional
- **Motivação intrínseca** — o "porquê" do usuário é o elemento motivacional central, não gamificação vazia

### Público-Alvo

Pessoas que querem construir consistência em seus hábitos e têm dificuldade em manter sistemas externos (planilhas, aplicativos complexos). O app oferece atrito mínimo para o registro diário e máximo de clareza visual.

### Escopo da Fase 1

- Aplicativo mobile (iOS + Android) via Expo
- Persistência local com SQLite
- Sem autenticação (identificação por `deviceId`)
- Sem sincronização remota
- Templates de hábitos como arquivo JSON estático

---

## 2. Stack Tecnológica

### React Native + Expo

**Por que:** Expo oferece o menor tempo de setup para projetos React Native com suporte a iOS e Android. O ecossistema de bibliotecas gerenciadas (expo-sqlite, expo-router) reduz fricção operacional. A escolha de React Native permite reaproveitamento de lógica com a web (Fase 2 via turborepo).

**Versão alvo:** Expo SDK 51+ com New Architecture habilitada.

### expo-sqlite (WAL Mode)

**Por que:** SQLite embutido no dispositivo garante persistência offline-first sem dependência de rede. O modo WAL (Write-Ahead Logging) melhora performance em leituras concorrentes e reduz bloqueios em operações de escrita frequentes (logs de hábitos diários).

**Configuração obrigatória:**
```typescript
// db/client.ts
const db = openDatabaseSync('segundo-cerebro.db');
db.execSync('PRAGMA journal_mode=WAL;');
```

### Drizzle ORM

**Por que:** Schema TypeScript-first com inferência de tipos automática. A sintaxe espelha SQL diretamente, facilitando a migração futura para Supabase (PostgreSQL) sem reescrita significativa. Suporte nativo a expo-sqlite com migrations gerenciadas.

**Vantagem chave:** O schema Drizzle serve como fonte de verdade tanto para SQLite (Fase 1) quanto para PostgreSQL (Fase 2), garantindo paridade de estrutura.

### NativeWind (Tailwind para React Native)

**Por que:** Consistência visual via utility classes elimina a necessidade de StyleSheet.create() verboso. Facilita theming e modo escuro no futuro. Desenvolvedores familiarizados com Tailwind têm curva de aprendizado zero.

### @expo/vector-icons (MaterialCommunityIcons)

**Por que:** Biblioteca incluída no Expo com mais de 7.000 ícones. MaterialCommunityIcons cobre todos os casos de uso do app (hábitos, tarefas, navegação) sem assets externos. Acesso via string de nome facilita persistência do ícone escolhido pelo usuário.

### Expo Router (File-based Routing)

**Por que:** Roteamento declarativo baseado na estrutura de arquivos elimina configuração manual de navegação. Suporte nativo a layouts aninhados (tabs, stacks, modais). Compatibilidade com deep linking por padrão.

### Zustand (Global State)

**Por que:** API mínima sem boilerplate (sem actions, reducers, dispatch). Slices por módulo mantêm concerns separados. Performance adequada para o volume de dados do app. Fácil integração com repositórios assíncronos.

**Padrão adotado:** Uma store por módulo (`useHabitsStore`, `useTasksStore`, `useOnboardingStore`), cada uma com slice próprio.

### UUID v4

**Por que:** IDs universalmente únicos eliminam conflitos em sync futura (Fase 2). Permitem criação offline de registros sem coordenação com servidor. Nunca usar autoincrement inteiro — isso criaria conflitos ao sincronizar múltiplos dispositivos.

**Biblioteca:** `expo-crypto` para geração nativa de UUID v4 com entropia adequada.

---

## 3. Modelo de Dados

### SyncMetadata (base para todos os registros sincronizáveis)

```typescript
interface SyncMetadata {
  id: string;           // UUID v4 — identificador universal único
  userId: string;       // UUID — deviceId na Fase 1, auth.uid() na Fase 2
  createdAt: string;    // ISO 8601 — momento da criação local
  updatedAt: string;    // ISO 8601 — atualizado automaticamente em todo UPDATE
  deletedAt: string | null; // ISO 8601 — soft delete; null = registro ativo
  syncStatus: 'pending' | 'synced' | 'conflict';
  // pending  → criado/modificado localmente, aguarda envio ao servidor
  // synced   → confirmado pelo servidor na última sincronização
  // conflict → versão local e remota divergem; requer resolução manual
}
```

**Regras de SyncMetadata:**
- Todo INSERT define `syncStatus: 'pending'` e `deletedAt: null`
- Todo UPDATE redefine `updatedAt` para o momento atual e `syncStatus: 'pending'`
- NUNCA executar DELETE físico — sempre setar `deletedAt` com o timestamp atual
- O campo `userId` é preenchido automaticamente pelo repositório, não pelo componente

---

### HabitTemplate

```typescript
interface HabitTemplate {
  id: string;              // UUID v4 estático (definido no JSON)
  name: string;            // Nome exibido na tela de templates — ex: "Meditação"
  icon: string;            // Nome do ícone MaterialCommunityIcons — ex: "meditation"
  type: 'build' | 'quit';  // build = construir hábito / quit = eliminar vício
  frequencyType: 'once_daily' | 'multiple_daily';
  // once_daily: uma verificação por dia (obrigatório para quit)
  // multiple_daily: múltiplas verificações que acumulam para uma meta
  defaultDailyTarget?: number;    // Meta diária (apenas multiple_daily) — ex: 8
  defaultUnitLabel?: string;      // Unidade — ex: "copos", "páginas", "minutos"
  defaultIncrementValue?: number; // Quanto cada check soma — ex: 1, 250, 15
  category: string;        // Categoria para agrupamento na tela — ex: "Saúde"
  isActive: boolean;       // false = template oculto (para deprecação futura)
  createdAt: string;       // ISO 8601 — data de criação do template no JSON
}
```

**Nota sobre Phase 1:** Templates são carregados do arquivo `/data/habitTemplates.json`. Não há tabela SQLite para templates na Fase 1. Não há gestão administrativa na Fase 1.

---

### Habit

```typescript
interface Habit extends SyncMetadata {
  name: string;            // Nome do hábito — ex: "Beber água", "Parar de fumar"
  icon: string;            // Nome do ícone MaterialCommunityIcons
  type: 'build' | 'quit';  // Determina lógica de check e visual
  frequencyType: 'once_daily' | 'multiple_daily';
  // INVARIANTE: se type === 'quit', frequencyType DEVE ser 'once_daily'
  startDate: string;       // YYYY-MM-DD — data de início para cálculo de streak
  dailyTarget?: number;    // Apenas multiple_daily — meta total no dia
  unitLabel?: string;      // Apenas multiple_daily — ex: "copos"
  incrementValue?: number; // Apenas multiple_daily — valor somado por check
  isActive: boolean;       // false = hábito arquivado (soft delete via isActive)
}
```

**Campos condicionais:**
- `dailyTarget`, `unitLabel`, `incrementValue` são `undefined` para `once_daily`
- Ao criar um hábito `once_daily`, esses campos não devem ser persistidos
- Ao criar um hábito `quit`, `frequencyType` é sempre forçado para `'once_daily'` pelo repositório, independente do input

---

### HabitLog

```typescript
interface HabitLog extends SyncMetadata {
  habitId: string;         // UUID do Habit pai — FK com índice
  date: string;            // YYYY-MM-DD — data local do dispositivo
  progress: number;
  // once_daily: 0 (não feito) ou 1 (concluído)
  // multiple_daily: soma acumulada dos checks no dia (0 a dailyTarget)
  completedAt?: string;    // ISO 8601 — momento em que progress atingiu a meta
  // Para once_daily: momento do único check
  // Para multiple_daily: momento em que progress === dailyTarget
}
```

**Invariantes do HabitLog:**
- Existe no máximo UM HabitLog por `(habitId, date)`
- `completedAt` é `undefined` enquanto `progress < dailyTarget` (ou `progress < 1` para once_daily)
- `completedAt` é preenchido uma única vez e nunca atualizado após isso
- A ausência de um HabitLog para uma data significa que o hábito não foi feito naquele dia

---

### Task

```typescript
interface Task extends SyncMetadata {
  title: string;           // Título da tarefa — campo obrigatório
  description?: string;    // Descrição adicional — opcional
  priority: 'high' | 'medium' | 'low';
  // high   → vermelho — aparece primeiro na lista
  // medium → amarelo
  // low    → cinza — aparece por último
  dueDate?: string;        // YYYY-MM-DD — prazo opcional
  completedAt?: string;    // ISO 8601 — momento da conclusão
  isCompleted: boolean;    // true = tarefa concluída (filtro principal)
}
```

---

## 4. Arquitetura de Repositórios

### Padrão

O padrão Repository isola a lógica de acesso a dados dos componentes e stores. Cada módulo define uma interface TypeScript (contrato) e uma implementação SQLite concreta. Na Fase 2, uma implementação Supabase pode ser adicionada sem alterar stores ou componentes.

```
Interface (contrato)
    ↑
SQLiteImplementation (Fase 1)
SupabaseImplementation (Fase 2, não implementar agora)
```

---

### HabitsRepository

```typescript
// DTOs
interface CreateHabitDTO {
  name: string;
  icon: string;
  type: 'build' | 'quit';
  frequencyType: 'once_daily' | 'multiple_daily';
  startDate: string;
  dailyTarget?: number;
  unitLabel?: string;
  incrementValue?: number;
}

interface UpdateHabitDTO {
  name?: string;
  icon?: string;
  isActive?: boolean;
  dailyTarget?: number;
  unitLabel?: string;
  incrementValue?: number;
}

// Contrato
interface HabitsRepository {
  getAll(userId: string): Promise<Habit[]>;
  // Retorna apenas registros com deletedAt IS NULL e isActive = true

  getById(id: string): Promise<Habit | null>;
  // Retorna null se não encontrado ou se deletedAt IS NOT NULL

  create(data: CreateHabitDTO): Promise<Habit>;
  // Gera UUID v4, insere userId do contexto, syncStatus: 'pending'
  // Força frequencyType: 'once_daily' se type === 'quit'

  update(id: string, data: UpdateHabitDTO): Promise<Habit>;
  // Atualiza updatedAt automaticamente, redefine syncStatus: 'pending'

  softDelete(id: string): Promise<void>;
  // Define deletedAt = now(), syncStatus: 'pending'
  // NUNCA executa DELETE físico

  getPendingSync(): Promise<Habit[]>;
  // Retorna registros com syncStatus = 'pending' — para uso na Fase 2
}

// Implementação
export class SQLiteHabitsRepository implements HabitsRepository {
  // Detalhes de implementação: usar Drizzle ORM com expo-sqlite
}

// Fase 2 — apenas declarar, não implementar
// export class SupabaseHabitsRepository implements HabitsRepository { ... }
```

---

### HabitLogsRepository

```typescript
interface CreateHabitLogDTO {
  habitId: string;
  date: string;
  progress: number;
}

interface UpdateHabitLogDTO {
  progress: number;
  completedAt?: string;
}

interface HabitLogsRepository {
  getByHabitAndDate(habitId: string, date: string): Promise<HabitLog | null>;
  // Retorna o log único para aquele hábito naquele dia

  getByHabit(habitId: string): Promise<HabitLog[]>;
  // Retorna todos os logs do hábito, ordenados por date DESC
  // Usado para cálculo de streak

  getByDate(userId: string, date: string): Promise<HabitLog[]>;
  // Retorna todos os logs do usuário para uma data específica

  upsert(data: CreateHabitLogDTO): Promise<HabitLog>;
  // Cria ou atualiza o log para (habitId, date)
  // Se já existe: atualiza progress e, se completado, define completedAt

  getPendingSync(): Promise<HabitLog[]>;
}

export class SQLiteHabitLogsRepository implements HabitLogsRepository { ... }
```

---

### HabitTemplatesRepository

```typescript
interface HabitTemplatesRepository {
  getAll(): Promise<HabitTemplate[]>;
  // Lê do arquivo /data/habitTemplates.json (Fase 1)
  // Filtra isActive = true

  getByCategory(category: string): Promise<HabitTemplate[]>;
  // Filtra por categoria

  getById(id: string): Promise<HabitTemplate | null>;
}

export class JSONHabitTemplatesRepository implements HabitTemplatesRepository {
  // Fase 1: lê de habitTemplates.json em memória
}

// Fase 2: export class SQLiteHabitTemplatesRepository implements HabitTemplatesRepository { ... }
// Fase 2: export class SupabaseHabitTemplatesRepository implements HabitTemplatesRepository { ... }
```

---

### TasksRepository

```typescript
interface CreateTaskDTO {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  isCompleted?: boolean;
  completedAt?: string;
}

interface TasksRepository {
  getAll(userId: string): Promise<Task[]>;
  // Retorna apenas deletedAt IS NULL, ordenado por: priority (high→low), dueDate ASC

  getById(id: string): Promise<Task | null>;

  create(data: CreateTaskDTO): Promise<Task>;

  update(id: string, data: UpdateTaskDTO): Promise<Task>;

  complete(id: string): Promise<Task>;
  // Define isCompleted = true, completedAt = now()

  softDelete(id: string): Promise<void>;

  getPendingSync(): Promise<Task[]>;
}

export class SQLiteTasksRepository implements TasksRepository { ... }
```

---

## 5. Fluxo de Telas

### Visão Geral da Navegação

```
App Launch
    │
    ├── hasCompletedOnboarding === false
    │       └── /(onboarding)/index.tsx
    │                   └── [após salvar] → /(tabs)/habits/index.tsx
    │
    └── hasCompletedOnboarding === true
            └── /(tabs)/
                    ├── habits/ (tab 1 — padrão)
                    │     ├── index.tsx (lista de hábitos de hoje)
                    │     ├── new.tsx (formulário de criação do zero)
                    │     └── templates.tsx (grid de templates)
                    │
                    └── tasks/ (tab 2)
                          ├── index.tsx (lista de tarefas com filtros)
                          └── new.tsx (formulário de nova tarefa)
```

---

### Tela 0 — Onboarding (`/(onboarding)/index.tsx`)

**Objetivo:** Capturar o "porquê" do usuário e gerar o `deviceId`.

**Elementos:**
- Citação de Nietzsche (texto motivacional fixo, centralizado)
- Subtítulo: "Construa seus hábitos com propósito"
- Campo de texto: "Qual é o seu porquê?" (multiline, mínimo 10 caracteres)
- Contador de caracteres visível
- Botão: "Começar minha jornada" (desabilitado se < 10 caracteres)

**Fluxo:**
```
[Abertura do app]
        │
        ▼
[Gerar UUID v4 → salvar como deviceId no AsyncStorage]
        │
        ▼
[Exibir tela de onboarding]
        │
[Usuário digita seu "porquê" (min 10 chars)]
        │
[Toca "Começar minha jornada"]
        │
        ▼
[Salvar: { why: string, hasCompletedOnboarding: true } no AsyncStorage]
        │
        ▼
[Navegar para /(tabs)/habits/index.tsx]
```

**Regras:**
- Esta tela aparece UMA ÚNICA VEZ na vida do app
- O `deviceId` gerado aqui é o `userId` usado em todos os registros
- O "porquê" salvo é exibido permanentemente no topo da tela de hábitos

---

### Tela 1 — Lista de Hábitos (`/(tabs)/habits/index.tsx`)

**Objetivo:** Visualizar e registrar o progresso dos hábitos do dia atual.

**Layout:**
```
┌─────────────────────────────────────────┐
│ [porquê do usuário — citação motivacional] │
├─────────────────────────────────────────┤
│ Hábitos de hoje — Segunda, 30 mar       │
├─────────────────────────────────────────┤
│ [HabitCard — once_daily build]          │
│ [HabitCard — multiple_daily build]      │
│ [HabitCard — quit]                      │
│ ...                                     │
├─────────────────────────────────────────┤
│ [+ Novo hábito]  [Ver templates]        │
└─────────────────────────────────────────┘
```

**HabitCard — once_daily build:**
- Ícone + nome + streak ("🔥 5 dias")
- Botão de check: "Feito!" → muda para estado concluído
- Após check: visual verde com marca de concluído

**HabitCard — multiple_daily build:**
- Ícone + nome + streak
- Barra de progresso: "3/8 copos"
- Botão "+1 copo" (ou incrementValue configurado)
- Preview: "Você precisa de X checks por dia"
- Ao atingir dailyTarget: barra cheia, visual verde

**HabitCard — quit (once_daily):**
- Ícone + nome em vermelho/alaranjado
- Contador: "37 dias sem [hábito]"
- Botão: "Não recaí hoje" (check diário)
- Após check: visual de confirmação
- Se não checado até meia-noite: streak quebra (passa para 0)

---

### Tela 2 — Templates (`/(tabs)/habits/templates.tsx`)

**Objetivo:** Explorar e adicionar hábitos a partir de sugestões pré-definidas.

**Layout:**
```
┌─────────────────────────────────────────┐
│ ← Voltar          Templates             │
├─────────────────────────────────────────┤
│ SAÚDE                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ [ícone]  │ │ [ícone]  │ │ [ícone]  │ │
│ │ Meditação│ │ Exercício│ │ Água     │ │
│ │ construir│ │ construir│ │ construir│ │
│ │ 1x/dia   │ │ 1x/dia   │ │ 8x/dia   │ │
│ └──────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────┤
│ VÍCIOS                                  │
│ ┌──────────┐ ┌──────────┐              │
│ │ [ícone]  │ │ [ícone]  │              │
│ │ Cigarro  │ │ Álcool   │              │
│ │ eliminar │ │ eliminar │              │
│ │ 1x/dia   │ │ 1x/dia   │              │
│ └──────────┘ └──────────┘              │
├─────────────────────────────────────────┤
│        [Criar do zero]                  │
└─────────────────────────────────────────┘
```

**Fluxo ao tocar um template:**
```
[Toca "Personalizar e adicionar"]
        │
        ▼
[Abre HabitForm pré-preenchido com dados do template]
        │
[Usuário pode alterar: nome, ícone, frequência, etc.]
        │
[Salva] → volta para lista de hábitos com novo hábito
```

---

### Tela 3 — Formulário de Hábito (`/(tabs)/habits/new.tsx`)

**Objetivo:** Criar ou personalizar um hábito.

**Campos (em ordem de exibição):**

1. **IconPicker** — grid com ícones MaterialCommunityIcons selecionáveis
2. **Nome** — campo de texto obrigatório
3. **Tipo** — toggle bicolor:
   - "CONSTRUIR" (verde) ↔ "ELIMINAR" (vermelho)
4. **Data de início** — date picker, padrão: hoje
5. **Frequência** — OCULTO se type === 'quit' (sempre once_daily)
   - "1x por dia" — radio button
   - "Mais de 1x por dia" — radio button
     - Se selecionado, exibe:
       - Campo: meta total (número)
       - Campo: unidade (ex: "copos", "minutos")
       - Campo: valor por check (padrão: 1)
       - Preview calculado: "Você precisará de X checks por dia"
         (calculado como: `Math.ceil(dailyTarget / incrementValue)`)

**Validações:**
- Nome: obrigatório, mínimo 3 caracteres
- Meta total: obrigatório se multiple_daily, deve ser inteiro positivo
- Unidade: obrigatória se multiple_daily
- Valor por check: deve ser > 0 e <= dailyTarget

**Botão:** "Salvar hábito" → cria o hábito e navega de volta

---

### Tela 4 — Lista de Tarefas (`/(tabs)/tasks/index.tsx`)

**Objetivo:** Visualizar, filtrar e gerenciar tarefas.

**Layout:**
```
┌─────────────────────────────────────────┐
│ Tarefas                        [+ Nova] │
├─────────────────────────────────────────┤
│ [Todas] [Pendentes] [Concluídas]        │
├─────────────────────────────────────────┤
│ ← [TaskCard: ALTA prioridade]  →        │
│ ← [TaskCard: MÉDIA prioridade] →        │
│ ← [TaskCard: BAIXA prioridade] →        │
│ ← [TaskCard: concluída]        →        │
└─────────────────────────────────────────┘
```

**Swipe para esquerda:** Excluir (soft delete) — ícone de lixeira vermelho
**Swipe para direita:** Concluir — ícone de check verde

**Ordenação:** priority (high → medium → low) + dueDate ASC dentro de cada grupo

---

### Tela 5 — Nova Tarefa (`/(tabs)/tasks/new.tsx`)

**Campos:**
1. Título (obrigatório)
2. Descrição (opcional, multiline)
3. Prioridade — seletor visual: Alta (vermelho) / Média (amarelo) / Baixa (cinza)
4. Prazo — date picker opcional

**Botão:** "Salvar tarefa"

---

## 6. Regras de Negócio

### Módulo 0 — Onboarding

- **RO-01:** O onboarding executa exatamente uma vez. Após conclusão, `hasCompletedOnboarding: true` é salvo no AsyncStorage e nunca é resetado automaticamente.
- **RO-02:** O `deviceId` é um UUID v4 gerado na primeira abertura do app e persistido no AsyncStorage. Ele nunca muda no ciclo de vida do app (mesmo após logout na Fase 2, o deviceId permanece — só muda o `userId` associado ao auth).
- **RO-03:** O campo "porquê" aceita mínimo de 10 caracteres. Espaços em branco no início e fim devem ser removidos (trim) antes de validar e salvar.
- **RO-04:** O "porquê" salvo é exibido no topo da tela de hábitos em toda visita, como elemento fixo de motivação.

### Módulo 1 — Hábitos

#### Tipos de Hábito

- **RH-01:** `type: 'build'` representa um hábito a ser construído. Pode ter `frequencyType: 'once_daily'` ou `'multiple_daily'`.
- **RH-02:** `type: 'quit'` representa um vício a ser eliminado. O `frequencyType` é SEMPRE `'once_daily'`, independente de qualquer input. O formulário oculta o seletor de frequência.
- **RH-03:** Um hábito não pode mudar de `type` após criação. A propriedade `type` é imutável.

#### Registro Diário (HabitLog)

- **RH-04:** Para `once_daily build`: um único check por dia cria um HabitLog com `progress: 1` e `completedAt: now()`.
- **RH-05:** Para `multiple_daily`: cada check soma `incrementValue` ao `progress`. Quando `progress >= dailyTarget`, define `completedAt: now()`.
- **RH-06:** Para `quit (once_daily)`: o check diário "Não recaí hoje" cria um HabitLog com `progress: 1` e `completedAt: now()`.
- **RH-07:** Se um hábito `quit` não tiver HabitLog para o dia anterior (após meia-noite), o streak é zerado. O dia corrente ainda pode ser salvo.
- **RH-08:** O `progress` de um HabitLog nunca diminui. Uma vez marcado como concluído, o estado não pode ser revertido pela interface (sem "desmarcar").
- **RH-09:** A data do HabitLog (`date`) é sempre a data local do dispositivo no formato YYYY-MM-DD, não UTC.

#### Criação e Edição

- **RH-10:** Ao criar a partir de um template, todos os campos do template são usados como padrão, mas o usuário pode alterar qualquer campo antes de salvar.
- **RH-11:** O campo `startDate` determina a data a partir da qual o streak começa a ser calculado. Dias anteriores ao `startDate` são ignorados no cálculo.
- **RH-12:** Um hábito desativado (`isActive: false`) não aparece na lista diária, mas seus logs históricos são preservados.
- **RH-13:** Soft delete (`deletedAt IS NOT NULL`) remove definitivamente o hábito da interface. A recuperação não é suportada na Fase 1.

### Módulo 2 — Tarefas

- **RT-01:** Uma tarefa concluída (`isCompleted: true`) permanece na lista no filtro "Concluídas", mas não aparece em "Pendentes".
- **RT-02:** A prioridade pode ser alterada após a criação da tarefa.
- **RT-03:** Tarefas sem prazo aparecem após as tarefas com prazo no mesmo grupo de prioridade.
- **RT-04:** Soft delete via swipe remove a tarefa de todas as views imediatamente (otimistic update na store).
- **RT-05:** Uma tarefa deletada (deletedAt IS NOT NULL) nunca é exibida, independente do filtro ativo.

---

## 7. Streak Calculator

O cálculo de streak é o coração da motivação do app. Ele deve ser determinístico, baseado apenas nos HabitLogs existentes para o hábito.

### Arquivo: `/utils/streakCalculator.ts`

### Algoritmo para `build` (once_daily e multiple_daily)

```
Definição de "dia completo":
  - once_daily: existe HabitLog com progress >= 1 para aquela data
  - multiple_daily: existe HabitLog com progress >= dailyTarget para aquela data

Algoritmo:
1. Buscar todos os HabitLogs do hábito, ordenados por date DESC
2. Definir "data de referência" = hoje (data local do dispositivo)
3. Verificar se hoje já foi completado:
   - Se sim: streakAtivo = true, contador começa em 1
   - Se não: streakAtivo = false, contador começa em 0
     (mas o streak do dia anterior ainda conta — o usuário ainda pode completar hoje)
4. Retroceder dia a dia a partir de ontem:
   - Para cada dia, verificar se existe log completado
   - Se sim: incrementar contador
   - Se não: parar a contagem
5. Retornar o contador final

Casos especiais:
  - Dias anteriores ao startDate do hábito: ignorar (não quebram streak)
  - Hábito criado hoje: streak máximo possível é 1 (se já completou hoje)
  - Sem nenhum log: streak = 0
```

**Exemplo (build, once_daily):**
```
Logs (by date DESC): 30/03, 29/03, 28/03, [26/03 faltando], 25/03
Hoje = 30/03, já completado

Passo a passo:
  30/03 → completado → streak = 1
  29/03 → completado → streak = 2
  28/03 → completado → streak = 3
  27/03 → SEM LOG → parar

Resultado: streak = 3
```

---

### Algoritmo para `quit` (once_daily)

```
Definição de "dia sem recaída":
  - Existe HabitLog com progress >= 1 para aquela data
  - OU a data é futura (dias futuros não quebram streak)

Diferença crítica vs build:
  - Para hábitos build, não completar hoje ainda mantém o streak (o dia ainda está em curso)
  - Para hábitos quit, não completar ontem (após meia-noite) QUEBRA o streak imediatamente

Algoritmo:
1. Buscar todos os HabitLogs do hábito, ordenados por date DESC
2. Calcular "dias desde startDate" até ontem (inclusive)
3. Verificar se CADA dia entre startDate e ontem tem um log com progress >= 1
4. A sequência contínua mais recente (de ontem para trás) é o streak atual
5. Se hoje já foi checado: incluir hoje no contador

Casos especiais:
  - startDate = hoje: streak = 0 (ou 1 se já checou hoje)
  - Todos os dias checados desde startDate: streak = (hoje - startDate + 1) se checou hoje,
    ou (hoje - startDate) se ainda não checou hoje
  - Gap de 1 dia em qualquer ponto: streak = 0 (volta do zero)

Fórmula do contador exibido:
  "X dias sem [nome do hábito]"
  X = streak calculado acima
```

**Exemplo (quit):**
```
startDate = 01/03
Logs existentes: 30/03, 29/03, 28/03, 27/03... todos os dias até 01/03
Hoje = 30/03, já checado

Resultado: "30 dias sem [hábito]"

Se ontem (29/03) não tivesse log:
Resultado: streak = 0 → "0 dias sem [hábito]" (streak quebrou ontem)
```

---

### Interface TypeScript

```typescript
interface StreakResult {
  currentStreak: number;    // Número de dias consecutivos
  longestStreak: number;    // Maior streak histórico
  isActiveToday: boolean;   // Se o hábito já foi completado hoje
}

function calculateStreak(
  habit: Habit,
  logs: HabitLog[],
  today: string  // YYYY-MM-DD — injetado para testabilidade
): StreakResult

function isDayComplete(
  habit: Habit,
  log: HabitLog | undefined
): boolean
// once_daily: log?.progress >= 1 ?? false
// multiple_daily: log?.progress >= habit.dailyTarget! ?? false
```

**Importante:** A função `calculateStreak` recebe `today` como parâmetro (não usa `new Date()` internamente) para facilitar testes unitários e evitar comportamentos inesperados em mudanças de fuso horário.

---

## 8. Estrutura de Pastas

```
/
├── app/
│   ├── (onboarding)/
│   │   └── index.tsx              # Tela de onboarding (exibida uma única vez)
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Configuração da tab bar (hábitos | tarefas)
│   │   ├── habits/
│   │   │   ├── index.tsx          # Lista de hábitos do dia
│   │   │   ├── new.tsx            # Formulário de criação do zero
│   │   │   └── templates.tsx      # Grid de templates por categoria
│   │   └── tasks/
│   │       ├── index.tsx          # Lista de tarefas com filtros
│   │       └── new.tsx            # Formulário de nova tarefa
│   └── _layout.tsx                # Layout raiz — verifica onboarding
│
├── components/
│   ├── HabitCard.tsx              # Card de hábito na lista diária (≤ 150 linhas)
│   ├── HabitForm.tsx              # Formulário reutilizável (novo + template)
│   ├── HabitTemplateCard.tsx      # Card na tela de templates
│   ├── TaskCard.tsx               # Card de tarefa com swipe
│   ├── ProgressBar.tsx            # Barra de progresso (multiple_daily)
│   └── IconPicker.tsx             # Grid de seleção de ícones MaterialCommunityIcons
│
├── db/
│   ├── schema.ts                  # Definição das tabelas Drizzle (fonte de verdade)
│   ├── client.ts                  # Conexão SQLite com WAL mode + singleton
│   ├── migrations/                # Migrations geradas pelo Drizzle Kit
│   │   └── 0001_initial.sql
│   └── repositories/
│       ├── habitsRepository.ts    # Interface + SQLiteHabitsRepository
│       ├── habitLogsRepository.ts # Interface + SQLiteHabitLogsRepository
│       ├── habitTemplatesRepository.ts # Interface + JSONHabitTemplatesRepository
│       └── tasksRepository.ts     # Interface + SQLiteTasksRepository
│
├── store/
│   ├── useHabitsStore.ts          # Zustand slice: hábitos + logs de hoje
│   ├── useTasksStore.ts           # Zustand slice: tarefas + filtro ativo
│   └── useOnboardingStore.ts      # Zustand slice: deviceId, why, flag onboarding
│
├── types/
│   └── index.ts                   # Todas as interfaces TypeScript (SyncMetadata, Habit, etc.)
│
├── utils/
│   ├── uuid.ts                    # generateUUID(): string usando expo-crypto
│   ├── dateHelpers.ts             # Funções de data (today(), formatDate(), daysBetween())
│   ├── streakCalculator.ts        # calculateStreak(), isDayComplete()
│   └── deviceId.ts                # getOrCreateDeviceId() via AsyncStorage
│
└── data/
    └── habitTemplates.json        # Templates estáticos da Fase 1
```

### Notas sobre a estrutura

- **`db/schema.ts`** é a única fonte de verdade para estrutura de tabelas. Nenhum CREATE TABLE avulso.
- **`types/index.ts`** exporta todas as interfaces. Nenhuma interface deve ser definida inline em componente.
- **`components/`** — cada arquivo deve ter no máximo 150 linhas. Se ultrapassar, extrair sub-componente.
- **`utils/dateHelpers.ts`** centraliza toda manipulação de datas. Nunca usar `new Date()` diretamente em componentes ou stores.
- **`data/habitTemplates.json`** contém os templates com UUIDs v4 estáticos (pré-gerados e fixos).

---

## 9. Decisões Técnicas

### DT-01: UUID v4 em todos os registros (nunca autoincrement)

**Decisão:** Todos os IDs são UUID v4 gerados localmente via `expo-crypto`.

**Justificativa:** IDs sequenciais inteiros criam conflitos inevitáveis em sincronização multi-dispositivo. Com UUID v4, um registro criado offline tem um ID que não conflita com nenhum outro registro no servidor ou em outros dispositivos. Essa decisão viabiliza a Fase 2 sem migração de schema.

**Impacto:** Índices em SQLite são levemente maiores com strings UUID. Aceitável para o volume de dados esperado.

---

### DT-02: Soft delete obrigatório (nunca DELETE físico)

**Decisão:** Todo "deletar" define `deletedAt = now()`. O `DELETE` SQL nunca é executado.

**Justificativa:** Preserva histórico de logs. Permite auditoria. Viabiliza sync futura (o servidor precisa saber que um registro foi deletado, não simplesmente não receber mais atualizações dele). Logs de hábitos deletados ainda contribuem para estatísticas históricas na Fase 2.

**Impacto:** Queries sempre incluem `WHERE deletedAt IS NULL`. Índice em `deletedAt` é obrigatório para performance.

---

### DT-03: Templates como JSON estático na Fase 1

**Decisão:** Os templates de hábitos são um arquivo JSON em `/data/habitTemplates.json`, não uma tabela SQLite. Não há interface de administração na Fase 1.

**Justificativa:** Reduz escopo da Fase 1. Templates raramente mudam. A abstração do Repository (`JSONHabitTemplatesRepository`) garante que a mudança para SQLite/Supabase na Fase 2 não afete componentes ou stores.

**Contrato de migração:** Na Fase 2, criar `SQLiteHabitTemplatesRepository` (ou `SupabaseHabitTemplatesRepository`) que implementa a mesma interface. O JSON inicial popula a tabela via seed.

---

### DT-04: Hábitos quit são sempre once_daily

**Decisão:** Se `type === 'quit'`, o `frequencyType` é forçado para `'once_daily'` no repositório. O formulário oculta o seletor de frequência.

**Justificativa:** O modelo mental de "eliminar um vício" é binário no dia: você recaiu ou não recaiu. Contabilizar "quantas vezes fumou hoje" distorce a proposta do hábito quit, que é manter uma sequência de dias limpos.

**Implementação:** O `SQLiteHabitsRepository.create()` sempre sobrescreve `frequencyType` com `'once_daily'` quando `type === 'quit'`, independente do DTO recebido.

---

### DT-05: Data local do dispositivo para HabitLog.date

**Decisão:** O campo `date` em HabitLog usa a data local do dispositivo (YYYY-MM-DD), não UTC.

**Justificativa:** Um usuário que completa um hábito às 23h45 no horário de Brasília está no dia 30/03 para ele. Se usássemos UTC, estaríamos registrando como 01/04 (UTC-3). Isso quebraria o streak de forma injusta e confusa.

**Impacto:** Em sync com servidor (Fase 2), armazenar também o `timezone` do dispositivo junto ao log para auditoria. O servidor respeita a data local enviada pelo cliente.

---

### DT-06: `syncStatus: 'pending'` em todo INSERT/UPDATE

**Decisão:** Todo INSERT e UPDATE define `syncStatus: 'pending'`. O campo só muda para `'synced'` quando o servidor confirmar o recebimento (Fase 2).

**Justificativa:** Garante que nenhum dado local seja perdido em sincronizações parciais. A fila de `getPendingSync()` em cada repositório é o mecanismo de retry na Fase 2.

---

### DT-07: Zustand com slices por módulo

**Decisão:** Uma store Zustand por módulo, não uma store global única.

**Justificativa:** Minimiza re-renders desnecessários. Um componente da tela de tarefas não precisa re-renderizar quando um hábito é atualizado. Facilita debugging e testes isolados por módulo.

---

### DT-08: Componentes com máximo de 150 linhas

**Decisão:** Nenhum componente deve ultrapassar 150 linhas. Se ultrapassar, extrair sub-componente.

**Justificativa:** Manutenibilidade. Componentes grandes tendem a acumular responsabilidades. O limite force a decomposição em componentes com responsabilidade única.

---

### DT-09: Textos em Português Brasileiro

**Decisão:** Todos os textos visíveis ao usuário devem estar em Português Brasileiro (pt-BR).

**Justificativa:** Público-alvo primário é brasileiro. Não há internacionalização na Fase 1.

---

### DT-10: `// DEBUG:` para logs de desenvolvimento

**Decisão:** Logs de debug devem ser prefixados com `// DEBUG:` e comentados antes do commit.

**Justificativa:** Evita `console.log` acidental em produção sem impedir debug durante desenvolvimento. O prefixo facilita busca e remoção em lote.

---

## 10. Contratos Fase 2

> Esta seção define contratos e interfaces para a Fase 2. Nada aqui deve ser implementado agora.

### 10.1 Infraestrutura

- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions + Storage)
- **Frontend web:** Next.js 14 App Router (PWA)
- **Monorepo:** Turborepo com packages compartilhados (`packages/ui`, `packages/types`, `packages/utils`)
- **Admin:** Aplicação Next.js separada — apenas métricas agregadas (COUNT, AVG) — NUNCA dados individuais
- **Pagamentos:** Stripe (plano Free com limites + plano Pro ilimitado)

### 10.2 Schema Supabase

```sql
-- RLS obrigatória em TODAS as tabelas de usuário
-- Política padrão: auth.uid() = user_id

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habits_own" ON habits
  USING (auth.uid()::text = user_id);

-- habit_templates: sem RLS (dados públicos, gerenciados por admin)
-- Todas as outras tabelas: mesma política
```

### 10.3 Sincronização

**Estratégia:** Last-write-wins com detecção de conflitos.

```typescript
// Contrato do serviço de sync (Fase 2)
interface SyncService {
  push(records: SyncMetadata[]): Promise<SyncResult[]>;
  pull(userId: string, since: string): Promise<SyncMetadata[]>;
  resolveConflict(local: SyncMetadata, remote: SyncMetadata): SyncMetadata;
}

interface SyncResult {
  id: string;
  status: 'synced' | 'conflict';
  serverVersion?: SyncMetadata;
}
```

**Fluxo de sync:**
1. Chamar `getPendingSync()` em todos os repositórios
2. `push()` todos os registros pendentes para o Supabase
3. `pull()` atualizações do servidor desde o último sync
4. Resolver conflitos (última escrita vence por padrão; conflitos manuais para casos específicos)
5. Atualizar `syncStatus: 'synced'` nos registros confirmados

### 10.4 Autenticação (Fase 2)

```typescript
// Migração de deviceId para auth
interface AuthMigration {
  deviceId: string;       // UUID gerado na Fase 1
  authUserId: string;     // UUID do Supabase Auth
}
// Ao fazer login pela primeira vez:
// 1. Criar conta Supabase Auth
// 2. Associar deviceId ao novo authUserId
// 3. Migrar todos os registros locais (user_id = deviceId) para user_id = authUserId
// 4. Sincronizar dados locais com servidor
```

### 10.5 Admin Panel (Fase 2)

```typescript
// API do admin — APENAS dados agregados
interface AdminMetrics {
  totalUsers: number;
  dailyActiveUsers: number;
  avgHabitsPerUser: number;
  habitCompletionRate: number;     // AVG(logs_completed / total_habits)
  mostPopularTemplates: { templateId: string; count: number }[];
  // NUNCA: dados individuais de usuários
  // NUNCA: conteúdo de hábitos ou tarefas
}
```

### 10.6 Planos e Limites (Fase 2)

```typescript
interface PlanLimits {
  maxHabits: number;        // Free: 5 / Pro: ilimitado
  maxTasks: number;         // Free: 20 / Pro: ilimitado
  syncEnabled: boolean;     // Free: false / Pro: true
  exportEnabled: boolean;   // Free: false / Pro: true
}
```

---

## 11. Checklist de Implementação

A ordem abaixo foi definida para minimizar bloqueios: cada etapa depende apenas do que foi construído nas etapas anteriores.

### Fase 1 — Fundação

- [ ] **Etapa 1:** Criar `scope.md` — documento de arquitetura completo (este arquivo)
- [ ] **Etapa 2:** Setup Expo + instalação de dependências + criação da estrutura de pastas
  - `npx create-expo-app segundo-cerebro --template blank-typescript`
  - Instalar: drizzle-orm, drizzle-kit, expo-sqlite, nativewind, @expo/vector-icons, zustand, expo-crypto, @react-native-async-storage/async-storage
  - Criar todas as pastas conforme Seção 8
- [ ] **Etapa 3:** Schema Drizzle (`/db/schema.ts`) + cliente SQLite com WAL mode (`/db/client.ts`)
  - Definir tabelas: `habits`, `habit_logs`, `tasks`
  - SyncMetadata em todas as tabelas
  - `habit_templates` NÃO vai para SQLite na Fase 1
  - Gerar migration inicial com `drizzle-kit generate`
- [ ] **Etapa 4:** Utilitários (`/utils/`)
  - `uuid.ts`: `generateUUID()` via expo-crypto
  - `dateHelpers.ts`: `today()`, `formatDate()`, `daysBetween()`, `toLocalDateString()`
  - `deviceId.ts`: `getOrCreateDeviceId()` via AsyncStorage
  - `streakCalculator.ts`: `calculateStreak()`, `isDayComplete()` (com testes mentais dos exemplos da Seção 7)
- [ ] **Etapa 5:** Interfaces de repositório (`/types/index.ts` + contratos em `/db/repositories/`)
  - Definir: `HabitsRepository`, `HabitLogsRepository`, `HabitTemplatesRepository`, `TasksRepository`
  - Definir todos os DTOs: `CreateHabitDTO`, `UpdateHabitDTO`, `CreateTaskDTO`, etc.
- [ ] **Etapa 6:** Implementações SQLite
  - `SQLiteHabitsRepository`
  - `SQLiteHabitLogsRepository`
  - `JSONHabitTemplatesRepository` (lê do JSON)
  - `SQLiteTasksRepository`
  - Verificar: soft delete, syncStatus: 'pending', updatedAt automático

### Fase 2 — Onboarding e Estado

- [ ] **Etapa 7:** Fluxo de Onboarding completo
  - `/(onboarding)/index.tsx` com todos os elementos visuais
  - Integração com `getOrCreateDeviceId()`
  - Persistência no AsyncStorage (`why`, `hasCompletedOnboarding`)
  - Lógica de redirecionamento no `app/_layout.tsx`
- [ ] **Etapa 8:** Zustand Store — Hábitos (`/store/useHabitsStore.ts`)
  - State: `habits[]`, `todayLogs{}`, `isLoading`, `error`
  - Actions: `loadHabits()`, `createHabit()`, `checkHabit()`, `incrementHabit()`, `deleteHabit()`
  - Integração com `SQLiteHabitsRepository` e `SQLiteHabitLogsRepository`

### Fase 3 — Módulo de Hábitos

- [ ] **Etapa 9:** Componente `IconPicker` (`/components/IconPicker.tsx`)
  - Grid de ícones MaterialCommunityIcons
  - Estado de seleção visual
  - Callback `onSelect(iconName: string)`
- [ ] **Etapa 10:** Tela de Templates (`/(tabs)/habits/templates.tsx`)
  - Carregar templates do `JSONHabitTemplatesRepository`
  - Agrupar por categoria
  - Grid responsivo de `HabitTemplateCard`
  - Navegação para `HabitForm` pré-preenchido
- [ ] **Etapa 11:** `HabitForm` (`/components/HabitForm.tsx`)
  - Todos os campos conforme Seção 5 (Tela 3)
  - Lógica de ocultar frequência para quit
  - Preview "X checks por dia" para multiple_daily
  - Validações antes de submeter
  - Reaproveitável para criação nova e edição de template
- [ ] **Etapa 12:** Tela principal de Hábitos — `once_daily` (`/(tabs)/habits/index.tsx`)
  - Exibir "porquê" do usuário no topo
  - Listar hábitos ativos do dia
  - Check para `once_daily build`
  - Check "Não recaí hoje" para `quit`
  - Streak display em cada card
- [ ] **Etapa 13:** Lógica de progresso `multiple_daily`
  - Botão de incremento no `HabitCard`
  - `ProgressBar` component
  - Auto-complete ao atingir `dailyTarget`
  - Atualização otimística na store + persistência
- [ ] **Etapa 14:** Cálculo de Streak
  - Integrar `streakCalculator.ts` com a store de hábitos
  - Exibir streak atual em cada card
  - Calcular `longestStreak` para exibição no perfil futuro
  - Testar edge cases: primeiro dia, streak quebrado, hábito quit sem check ontem

### Fase 4 — Módulo de Tarefas

- [ ] **Etapa 15:** Zustand Store — Tarefas (`/store/useTasksStore.ts`)
  - State: `tasks[]`, `activeFilter`, `isLoading`
  - Actions: `loadTasks()`, `createTask()`, `completeTask()`, `deleteTask()`, `setFilter()`
  - Seletores computados: `pendingTasks`, `completedTasks`, `allTasks`
- [ ] **Etapa 16:** Tela de Tarefas com filtros e swipe (`/(tabs)/tasks/index.tsx`)
  - Filtros: Todas / Pendentes / Concluídas
  - `TaskCard` com swipe (biblioteca `react-native-gesture-handler`)
  - Swipe direita → completar / Swipe esquerda → deletar (soft delete)
  - Ordenação por prioridade + prazo
  - Formulário de nova tarefa (`/(tabs)/tasks/new.tsx`)

### Fase 5 — Navegação e Polimento

- [ ] **Etapa 17:** Tab bar de navegação
  - Configurar `/(tabs)/_layout.tsx`
  - Tab 1: Hábitos (ícone: `brain` ou `check-circle`)
  - Tab 2: Tarefas (ícone: `format-list-checks`)
  - Badges de pendências (opcional)
- [ ] **Etapa 18:** Revisão final — edge cases, qualidade e segurança
  - Verificar: todos os DELETEs são soft deletes
  - Verificar: todo INSERT tem `syncStatus: 'pending'`
  - Verificar: `updatedAt` atualizado em todos os UPDATEs
  - Verificar: `frequencyType: 'once_daily'` forçado para hábitos quit
  - Verificar: datas usando data local do dispositivo (não UTC)
  - Verificar: nenhum `any` no TypeScript
  - Verificar: todos os componentes com ≤ 150 linhas
  - Verificar: todos os textos em Português Brasileiro
  - Verificar: logs `// DEBUG:` comentados
  - Testar: onboarding aparece apenas uma vez
  - Testar: streak quebra corretamente para hábitos quit
  - Testar: hábitos com `startDate` no passado calculam streak corretamente
  - Testar: multiple_daily auto-completa ao atingir target

---

*Este documento é a fonte de verdade para a implementação do Segundo Cérebro. Em caso de dúvida sobre qualquer decisão técnica ou de produto, consultar este arquivo antes de qualquer implementação.*
