# Kaizen — Feature Inventory
> Atualizado em: 2026-04-04

---

## ✅ Funcionalidades implementadas

### 1. Onboarding
- Fluxo de 2 etapas: "Seu Porquê" (validação 10–500 chars) + permissão de notificações
- Persistência de `userId` (device ID estável via AsyncStorage)
- Preferências inicializadas na primeira abertura

### 2. Dashboard (Home)
- Saudação personalizada com nome do usuário
- Card "Meu Porquê" (editável via modal)
- 4 cards de resumo diário: hábitos, tarefas, pomodoros e minutos de foco
- Linha de hábitos rápidos (marca/desmarca com streak visível)
- Preview das 3 tarefas pendentes com verificação de subtarefas antes de concluir
- Pull-to-refresh
- Menu de perfil (modal)

### 3. Hábitos
- Criar hábito com todos os campos:
  - Tipo: construir / abandonar
  - Frequência: once_daily / multiple_daily (com unidade e meta de repetições)
  - Meta: dias corridos / intervalo de datas / para sempre
  - Lembrete: horário fixo / intervalo / ambos
  - Ícone customizável (picker com categorias)
- Registrar progresso (idempotente para once_daily, acumula para multiple_daily)
- Conclusão automática ao atingir meta de repetições (multiple_daily)
- Desfazer último log
- Calcular streak: corrente e melhor (suporta tipo build e quit)
- Renovação de meta ao expirar
- Editar hábito existente
- Excluir (soft delete + cancela notificações)
- Tela de sugestões com templates por categoria
- Notificações agendadas por hábito (fixed_time, interval, ambos)
- Som de conclusão

### 4. Tarefas
- Criar tarefa: título, descrição, prioridade (alta/média/baixa), data de entrega, categoria
- Subtarefas: adicionar/concluir/remover; conclusão do pai automática quando todas as subs estão feitas
- Filtros: Todas / Pendentes / Concluídas
- Seções por categoria (SectionList) ou lista plana quando sem categorias
- Ordenação: prioridade → data de entrega
- Concluir / reabrir / excluir tarefa (soft delete)
- Gestão de categorias: criar, editar, excluir (limpa referências nas tarefas vinculadas)
- Som de conclusão

### 5. Pomodoro
- Timer com fases: foco → pausa curta → (N ciclos) → pausa longa → done
- Fase `done` natural ao fim do último ciclo (sem reiniciar automaticamente)
- Duração configurável: foco, pausa curta, pausa longa, ciclos antes da pausa longa
- Vincular tarefa existente ou criar tarefa rápida (efêmera, não persistida)
- Painel de subtarefas durante a sessão
- Pular pausa
- Persistir sessão no banco ao concluir (startedAt, endedAt, cycles, focusMinutes)
- Notificação por fase com cancel/reschedule correto em pause/resume
- Tela sempre acesa durante sessão (KeepAwake)
- `pomodorosToday` e `focusMinutesToday` corretos no dashboard (query por data)
- Som de fim de fase

### 6. Perfil
- Avatar com iniciais
- Editar nome inline
- Stats: hábitos ativos, melhor streak, tarefas concluídas, minutos de foco totais

### 7. Configurações
- Sons: toggle geral + toggle Pomodoro
- Aparência: seleção de tema (claro / escuro / sistema) — persiste no AsyncStorage
- Resetar conta: deleta todos os dados + cancela notificações + volta ao onboarding

### 8. Design System
- `constants/theme.ts` — tokens completos (Colors light/dark, Typography, Spacing, Radius, BorderWidth)
- `hooks/useTheme.ts` — hook único; `useColorScheme()` seleciona paleta automaticamente
- Fontes: Plus Jakarta Sans (display) + DM Sans (body) via `expo-google-fonts`
- Bordas 0.5px em todos os cards; sem hardcode de cores em nenhum arquivo

### 9. Infraestrutura de dados
- SQLite local-first com Drizzle ORM (7 tabelas)
- Soft delete universal (exceto reset intencional)
- `syncStatus` nas tabelas (`pending / synced / conflict`) — pronto para sincronização futura
- Repositórios isolados por domínio

---

## 🔲 O que falta — por ordem de complexidade

### Baixa complexidade

| # | Feature | Status |
|---|---------|--------|
| 1 | **Tema dinâmico** | ✅ Concluído — `useTheme` lê `preferences.appearanceMode` da store; light/dark/system funcionam. |
| 2 | **Editar tarefa** | ✅ Concluído — `tasks/new.tsx` aceita `taskId` param; botão "Editar tarefa" no card expandido. |
| 3 | **Reordenar categorias** | ✅ Concluído — setas ↑↓ na tela de categorias; persiste campo `order` no banco. |

### Média complexidade

| # | Feature | Status |
|---|---------|--------|
| 4 | **Data de entrega — alerta de vencimento** | ✅ Concluído — badge "Atrasada · dd/mm" em vermelho no `TaskCard` para tarefas não concluídas com `dueDate` passado. |
| 5 | **Editar hábito + reescalonamento de notificações** | ✅ Concluído — `updateHabit` cancela IDs antigos e reagenda ao alterar campos de lembrete/nome; tela `new.tsx` aceita `habitId`; menu ⋮ no `HabitCard` oferece Editar / Excluir. |
| 6 | **Check-in grid 28 dias** | ✅ Concluído — `HabitCheckInGrid` mostra grade 4×7 (28 dias); carregada sob demanda no `HabitCard` ao abrir o chevron ▼. |
| 7 | **Busca e filtros de tarefas** | ✅ Concluído — barra de busca por título + filtros de prioridade (Alta/Média/Baixa) na tela de tarefas; estado no store via `searchQuery`/`filterPriority`. |

### Alta complexidade

| # | Feature | Descrição |
|---|---------|-----------|
| 8 | **Foto de perfil** | ✅ Concluído — picker câmera/galeria via `expo-image-picker`; imagem salva em `documentDirectory/avatar.jpg` via `expo-file-system`; `Avatar` exibe foto; badge ⊕ câmera no perfil; "Remover foto" disponível; limpa no reset. |
| 9 | **Sync + Auth (Supabase)** | ✅ Concluído — Auth: `lib/supabase.ts`, `store/useAuthStore.ts`, `app/(auth)/login.tsx`, `AuthGuard`. Sync bidirecional: `lib/syncService.ts` (push pendentes → Supabase, pull remoto → SQLite, last-write-wins por `updated_at`); 6 tabelas cobertas; SQL migration em `supabase/migrations/001_init.sql`. Sync automático ao login via `_layout.tsx`. Falta: rodar a migration no Supabase e configurar `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` no `.env`. |
| 10 | **Relatórios / Analytics** | ✅ Concluído — tela `app/analytics/` com KPIs + gráficos de barras (sem lib externa). Seções: Hábitos (consistência 30d, check-ins 7d, ranking por hábito), Tarefas (concluídas por semana), Foco (min/dia 7d, sessões 30d). Acessível pelo ProfileMenu. |
| 11 | **Assinatura Pro (Stripe)** | Botão "Conhecer Pro" já existe no perfil. Falta: tela de paywall, integração Stripe (ou RevenueCat), validação de entitlements, features gated. |
| 12 | **Widget nativo (iOS/Android)** | Exibir hábitos do dia e streak direto na homescreen. Requer módulo nativo com Expo Widgets (iOS 16+) ou `react-native-android-widget`. |
