# 0nutri — Plano de Desenvolvimento

## 1. Visão geral do produto

O **0nutri** será um sistema web privado, hospedado no homelab, para controle pessoal de dieta, peso, ingestão de água, evolução corporal e hábitos alimentares. O foco é ser simples, visual, rápido de usar no dia a dia e altamente personalizável.

O sistema não terá autenticação, pois será usado em ambiente privado/local/homelab. Porém, ele deve suportar múltiplas **personas**, funcionando como uma espécie de workspace: cada pessoa terá suas próprias metas, dieta, registros, métricas, histórico, preferências e configurações.

Exemplo de personas:

- Alex
- Karen

Cada persona terá:

- dieta individual
- peso inicial e meta
- histórico de pesagens
- meta de água
- histórico de ingestão de água
- alimentos/refeições configuráveis
- dashboard próprio
- preferências visuais e notificações internas

---

## 2. Objetivo principal

Criar uma aplicação web para responder rapidamente às perguntas do dia a dia:

- O que eu preciso comer agora?
- Qual é minha próxima refeição?
- Estou seguindo bem a dieta hoje?
- Bebi água suficiente até agora?
- Meu peso está evoluindo?
- Estou mais perto da minha meta?
- Quais dias fui mais consistente?
- Quais hábitos estão atrapalhando minha evolução?

---

## 3. Stack sugerida

Utilizar a stack já familiar:

### Frontend e backend

- Next.js com App Router
- TypeScript
- Server Actions ou Route Handlers
- TailwindCSS
- shadcn/ui
- React Hook Form
- Zod
- Recharts para gráficos
- date-fns para manipulação de datas
- lucide-react para ícones
- OpenAI SDK para geração de dietas e feedbacks com IA

### Banco de dados

- PostgreSQL
- Prisma ORM

### Infraestrutura

- Docker
- Docker Compose
- Hospedagem no homelab
- Deploy via EasyPanel ou container próprio
- Sem autenticação inicialmente

### Futuro opcional

- Redis para cache ou jobs internos
- PWA para instalar no celular
- Web Push/local notifications
- Integração com IA via OpenAI para montar dietas, gerar feedbacks e sugerir ajustes

---

## 4. Princípios de UX/UI

O 0nutri deve ser extremamente visual e simples.

### Direção visual

- Interface moderna, limpa e agradável
- Tema light como padrão
- Visual fitness/saúde, mas sem parecer app hospitalar
- Cores principais sugeridas:
  - branco/off-white para background principal
  - verde suave para progresso positivo e saúde
  - azul para água
  - roxo claro ou lilás como cor secundária
  - amarelo/laranja para alertas leves
  - vermelho discreto para atrasos ou pontos de atenção

### Experiência esperada

A pessoa deve abrir o sistema e em poucos segundos entender:

- refeição atual
- próxima refeição
- progresso da água
- peso atual
- meta
- status do dia

### Evitar

- telas muito poluídas
- cadastro complexo demais
- excesso de campos obrigatórios
- linguagem técnica demais
- experiência de app de academia genérico

---

## 5. Responsividade e experiência mobile-first

A aplicação será acessada majoritariamente pelo celular, então todo o design, fluxo e arquitetura visual devem ser pensados com abordagem **mobile-first**. O desktop deve existir como uma versão ampliada e confortável, mas a experiência principal precisa ser excelente em telas pequenas.

### Prioridades para mobile

- Interface leve, clara e rápida de usar com uma mão.
- Dashboard inicial com as informações mais importantes sem exigir muito scroll.
- Cards grandes, bem espaçados e com alto contraste em tema light.
- Botões principais com área de toque confortável, idealmente acima de 44px de altura.
- Evitar tabelas complexas em telas pequenas; usar cards, listas e agrupamentos por período.
- Reduzir a quantidade de texto em telas operacionais do dia a dia.
- Usar ícones, barras de progresso e indicadores visuais para facilitar leitura rápida.
- Garantir boa legibilidade em ambientes claros, já que o app pode ser usado fora de casa ou na cozinha.

### Navegação no celular

A navegação mobile deve ser simples e fixa na parte inferior da tela, como um app nativo.

Sugestão de tabs principais:

- Hoje
- Dieta
- Água
- Progresso
- Persona/Configurações

A tela **Hoje** deve ser o centro da experiência, mostrando:

- refeição atual
- próxima refeição
- progresso de água
- status da meta diária
- botão rápido para registrar água
- botão rápido para marcar refeição como concluída
- alerta visual quando estiver atrasado em alguma refeição ou muito abaixo da meta de água

### Ações rápidas

No mobile, as ações mais usadas devem estar a no máximo 1 ou 2 toques de distância:

- registrar copo de água
- registrar garrafa de água
- marcar refeição como concluída
- ver próxima refeição
- trocar persona
- adicionar peso do dia
- abrir plano alimentar do dia

Sugestão: criar um botão flutuante ou uma área fixa de ações rápidas na tela inicial.

### Layout por breakpoint

#### Mobile

- Layout em uma única coluna.
- Cards empilhados.
- Gráficos simplificados.
- Menus inferiores.
- Foco em uso diário e registro rápido.

#### Tablet

- Layout em duas colunas quando fizer sentido.
- Dashboard com cards lado a lado.
- Melhor aproveitamento de gráficos.

#### Desktop

- Layout com sidebar lateral.
- Dashboard mais analítico.
- Gráficos maiores.
- Configurações e cadastros mais completos em telas amplas.

### Componentes responsivos importantes

- `MobileBottomNav` para navegação inferior.
- `ResponsivePageHeader` com título, persona ativa e ações.
- `TodayMealCard` otimizado para celular.
- `WaterQuickActions` com botões de 200ml, 300ml, 500ml e valor personalizado.
- `PersonaSwitcher` acessível rapidamente no topo ou em bottom sheet.
- `MobileSheet` para formulários rápidos, evitando telas muito longas.
- `ResponsiveChartCard` que troca gráfico completo por resumo visual em telas pequenas.

### Boas práticas de implementação

- Usar TailwindCSS com classes mobile-first.
- Evitar larguras fixas.
- Usar `max-w`, `w-full`, `grid`, `flex`, `min-h-screen` e espaçamentos consistentes.
- Testar todas as telas em largura próxima de 360px, 390px e 430px.
- Garantir que modais grandes se comportem como bottom sheets no mobile.
- Evitar hover como comportamento essencial, pois celular não possui hover.
- Usar estados visuais claros para toque, loading e sucesso.

### PWA como incremento recomendado

Como o app será usado muito pelo celular, vale preparar a aplicação para funcionar como **PWA**:

- permitir instalar o app na tela inicial do celular
- ícone personalizado do 0nutri
- splash screen simples
- cache básico de assets
- funcionamento parcial mesmo sem internet local momentânea
- experiência parecida com aplicativo nativo

Isso é especialmente útil porque o 0nutri será usado várias vezes por dia para pequenas ações, como registrar água ou consultar a próxima refeição.

---

## 6. Estrutura principal de navegação

Sugestão de menu:

1. **Hoje**
2. **Dieta**
3. **Montar Dieta com IA**
4. **Água**
5. **Peso**
6. **Progresso**
7. **Personas**
8. **Configurações**

---

## 7. Conceito de personas/workspaces

Como não haverá autenticação, o sistema deve iniciar com uma persona selecionada.

### Funcionalidades de persona

- Criar persona
- Editar persona
- Selecionar persona ativa
- Trocar persona rapidamente pelo topo da interface
- Cada persona possui dados completamente separados

### Campos da persona

- nome
- avatar ou emoji
- sexo opcional
- altura
- peso inicial
- peso atual calculado pelo último registro
- peso meta
- data de início
- meta diária de água em ml
- objetivo principal:
  - perder gordura
  - ganhar massa
  - manutenção
  - saúde geral
- sexo opcional
- idade opcional
- região/cidade onde reside
- rotina de trabalho
- rotina de sono
- restrições alimentares
- alergias
- preferências alimentares
- alimentos que não gosta
- orçamento aproximado para dieta
- nível de atividade:
  - sedentário
  - leve
  - moderado
  - intenso
- preferência visual:
  - cor da persona
  - emoji/ícone

---

## 8. Dashboard “Hoje”

Essa será a tela principal do app.

### Objetivo

Mostrar em uma única tela tudo que importa para o dia atual.

### Componentes principais

#### 7.1 Header da persona

Exibir:

- nome da persona ativa
- avatar/emoji
- botão de troca de persona
- data atual
- status do dia

Exemplo de status:

> Alex, você está indo bem hoje. Já concluiu 2 de 5 refeições e consumiu 1,4L de água.

#### 7.2 Card da refeição atual

Detectar com base no horário atual qual refeição está mais próxima.

Exibir:

- nome da refeição
- horário planejado
- alimentos e quantidades
- observações
- botão “Marcar como feita”
- botão “Pular”
- botão “Trocar opção”

Exemplo:

**Almoço — 12:30**

- 120g arroz cozido
- 180g frango grelhado
- legumes à vontade
- salada

Ações:

- Marcar como feita
- Ver alternativas
- Adicionar observação

#### 7.3 Próximas refeições

Lista das próximas refeições do dia:

- horário
- nome
- resumo
- status

Status possíveis:

- pendente
- feita
- pulada
- atrasada
- parcialmente feita

#### 7.4 Progresso da água

Card com:

- meta diária
- consumido até agora
- porcentagem
- feedback textual
- botões rápidos:
  - +200ml
  - +300ml
  - +500ml
  - valor personalizado

Feedbacks possíveis:

- “Você está no ritmo certo.”
- “Você está um pouco atrás da meta para este horário.”
- “Ótimo, você já bateu sua meta de água hoje.”

#### 7.5 Peso e meta

Card com:

- peso atual
- peso inicial
- peso meta
- diferença desde o início
- quanto falta para a meta
- tendência dos últimos 7 dias

Exemplo:

- Peso inicial: 81,95kg
- Peso atual: 80,80kg
- Meta: 72kg
- Progresso: -1,15kg
- Faltam: 8,8kg

#### 7.6 Consistência do dia

Um score simples de 0 a 100 baseado em:

- refeições realizadas
- água consumida
- registro de peso no dia, quando aplicável
- aderência ao plano

Exemplo:

> Consistência de hoje: 82%

---

## 9. Cadastro de dieta

A dieta deve ser configurável por persona.

### Estrutura

Uma dieta será composta por:

- nome
- descrição
- objetivo
- data de início
- ativa/inativa
- refeições

### Refeições

Cada refeição terá:

- nome
- horário sugerido
- descrição
- opções de refeição
- observações
- ordem de exibição

Exemplo de refeições:

- Café da manhã
- Lanche da manhã
- Almoço
- Lanche da tarde
- Jantar
- Ceia

### Opções por refeição

Cada refeição deve permitir múltiplas opções.

Exemplo:

**Café da manhã**

Opção 1:

- 3 ovos inteiros
- 1 fatia pão integral
- café sem açúcar

Opção 2:

- tapioca 50g
- 2 ovos
- queijo branco 30g

Opção 3:

- omelete com 3 ovos
- banana 100g
- canela

### Campos da opção

- nome da opção
- descrição
- alimentos
- calorias estimadas opcional
- proteína opcional
- carboidratos opcional
- gordura opcional
- observações

### Alimentos

Cada alimento terá:

- nome
- quantidade
- unidade
- observação

Exemplos:

- arroz cozido — 120g
- frango grelhado — 180g
- banana — 100g
- água — 300ml

---

## 10. Montar Dieta com IA

Esta será uma funcionalidade central do 0nutri. A aplicação deve permitir que cada persona preencha um questionário completo e, com base nessas informações, a OpenAI gere uma dieta estruturada, personalizada e importável para o cadastro de dieta da persona.

### Objetivo

Criar uma experiência simples onde o usuário possa clicar em **Montar Dieta**, responder perguntas essenciais e receber um plano alimentar organizado por refeições, horários, opções e quantidades.

A dieta gerada pela IA não deve substituir acompanhamento profissional. A interface deve exibir um aviso discreto informando que o plano é uma sugestão gerada por IA para organização pessoal e que condições médicas exigem orientação profissional.

### Fluxo principal

1. Usuário seleciona a persona ativa.
2. Acessa `/ai-diet` ou botão **Montar Dieta**.
3. Preenche ou revisa o perfil nutricional da persona.
4. Informa objetivo e preferências.
5. Clica em **Gerar dieta com IA**.
6. A IA retorna uma dieta estruturada em JSON.
7. O usuário visualiza a dieta antes de salvar.
8. O usuário pode editar manualmente qualquer refeição/opção.
9. O usuário clica em **Importar para minha dieta**.
10. O sistema cria uma nova Diet ativa ou salva como rascunho.

### Questionário para montar dieta

O formulário deve ser dividido em etapas para não ficar cansativo.

#### Etapa 1 — Dados corporais

- nome da persona
- idade
- sexo opcional
- altura em cm
- peso atual
- peso meta
- objetivo principal:
  - perder gordura
  - ganhar massa muscular
  - manutenção
  - saúde geral
  - reduzir retenção/inchaço
- prazo desejado opcional

#### Etapa 2 — Rotina

- horário que acorda
- horário que dorme
- horários preferidos para refeições
- trabalha em casa ou fora
- nível de atividade física
- faz musculação?
- faz caminhada/cardio?
- quantidade de refeições desejada por dia
- maior dificuldade atual:
  - fome à noite
  - beliscar
  - doces
  - delivery
  - falta de tempo
  - retenção líquida
  - não sabe o que comer

#### Etapa 3 — Preferências alimentares

- região/cidade onde reside
- alimentos comuns preferidos
- alimentos que não gosta
- alergias
- intolerâncias
- restrições médicas conhecidas
- restrições religiosas/culturais, se houver
- orçamento aproximado:
  - econômico
  - normal
  - flexível
- preferência de preparo:
  - marmitas
  - refeições rápidas
  - comida caseira
  - poucas receitas diferentes
- alimentos base desejados:
  - arroz
  - feijão/lentilha
  - frango
  - ovos
  - carne
  - peixe
  - batata
  - mandioca
  - frutas
  - castanhas
  - iogurte

#### Etapa 4 — Configurações da dieta

- quantidade de opções por refeição: 1, 2 ou 3
- mostrar calorias estimadas
- mostrar macros estimados
- incluir substituições
- incluir lista de compras
- incluir observações de preparo
- ativar dieta automaticamente após importar

### Resultado esperado da IA

A IA deve retornar uma dieta no formato estruturado, pronta para ser validada com Zod e convertida para entidades `Diet`, `Meal`, `MealOption` e `FoodItem`.

Exemplo de estrutura esperada:

```json
{
  "dietName": "Dieta para perda de gordura — Alex",
  "objective": "Perda de gordura com redução de retenção",
  "estimatedCalories": 2000,
  "notes": [
    "Priorizar água ao longo do dia",
    "Evitar ultraprocessados e excesso de sódio"
  ],
  "meals": [
    {
      "name": "Café da manhã",
      "scheduledAt": "08:00",
      "options": [
        {
          "name": "Opção 1",
          "calories": 380,
          "proteinGrams": 24,
          "carbsGrams": 32,
          "fatGrams": 18,
          "foodItems": [
            { "name": "ovos inteiros", "quantity": 3, "unit": "unidades" },
            { "name": "pão integral", "quantity": 40, "unit": "g" },
            { "name": "banana", "quantity": 100, "unit": "g" }
          ]
        }
      ]
    }
  ],
  "shoppingList": [
    { "name": "ovos", "quantity": "30 unidades" },
    { "name": "frango", "quantity": "1,5 kg" }
  ],
  "warnings": [
    "Caso exista condição médica, procure um nutricionista."
  ]
}
```

### Regras de segurança e qualidade da IA

A IA deve:

- evitar promessas de cura ou resultados garantidos
- não recomendar dietas extremas
- não prescrever tratamento médico
- respeitar alergias e intolerâncias informadas
- respeitar alimentos que a persona não gosta
- usar alimentos comuns na região informada
- priorizar comida simples e acessível no Brasil
- gerar quantidades realistas
- explicar de forma simples o raciocínio geral da dieta
- sempre retornar JSON validável

A IA não deve:

- sugerir jejum extremo sem contexto
- sugerir cortar grupos alimentares sem necessidade
- indicar suplementos como obrigatórios
- sugerir metas agressivas demais
- substituir avaliação profissional

### UX da tela Montar Dieta

A tela deve ter:

- formulário em etapas
- indicador de progresso
- botão para salvar perfil nutricional da persona
- botão para gerar dieta
- estado de loading elegante
- preview da dieta gerada
- cards por refeição
- botão para editar item antes de importar
- botão **Importar dieta**
- botão **Gerar novamente**
- histórico de dietas geradas

### Funcionalidades adicionais úteis

- Salvar questionário como perfil nutricional da persona
- Permitir duplicar uma dieta gerada
- Permitir comparar dieta atual vs dieta gerada
- Permitir gerar apenas substituições para uma refeição
- Permitir pedir “versão mais barata” da dieta
- Permitir pedir “versão com menos tempo de preparo”
- Permitir gerar lista de compras semanal

---

## 11. Controle diário de refeições

O sistema precisa registrar o que aconteceu em cada dia.

### Funcionalidades

- Marcar refeição como feita
- Marcar como pulada
- Marcar como parcialmente feita
- Selecionar qual opção foi consumida
- Adicionar observação
- Registrar horário real
- Permitir desfazer

### Histórico

Para cada dia, salvar:

- persona
- dieta ativa
- refeições planejadas
- refeições concluídas
- refeições puladas
- opção escolhida
- observações
- score de aderência

### Ideia extra

Adicionar um campo rápido:

> “Como foi essa refeição?”

Opções:

- tranquilo
- fiquei com fome
- comi mais do que deveria
- troquei por outra coisa
- não consegui fazer

Isso ajuda a entender padrões depois.

---

## 12. Controle de água

### Objetivo

Permitir registrar rapidamente a ingestão de água ao longo do dia.

### Funcionalidades

- Definir meta diária por persona
- Registrar consumo por botões rápidos
- Registrar valor manual
- Visualizar progresso diário
- Visualizar histórico
- Feedback proporcional ao horário do dia

### Botões rápidos

- +100ml
- +200ml
- +300ml
- +500ml
- +700ml

### Feedback inteligente

O app deve comparar o consumo atual com o horário do dia.

Exemplo:

Se a meta é 3000ml e já são 15h, o sistema pode estimar que o usuário deveria ter consumido algo próximo de 1800ml até esse horário.

Feedbacks:

- “Você está no ritmo ideal.”
- “Você está um pouco atrás, tente beber mais 500ml até o fim da tarde.”
- “Excelente, você já passou de 80% da meta.”
- “Cuidado para não concentrar muita água só à noite.”

### Gráficos de água

- consumo dos últimos 7 dias
- média diária
- dias que bateu a meta
- melhor sequência de dias

---

## 13. Cadastro de peso

### Funcionalidades

- Registrar peso por data
- Permitir múltiplos registros, mas usar o último do dia como oficial
- Exibir evolução
- Exibir diferença em relação ao início
- Exibir diferença em relação à meta
- Permitir notas

### Campos

- personaId
- peso
- data
- observação opcional

### Observações úteis

Exemplos:

- “Pesei depois do almoço”
- “Final de semana com refeição livre”
- “Retido hoje”
- “Comecei caminhada”

### Gráficos

- peso ao longo do tempo
- média móvel de 7 dias
- progresso até a meta
- perda/ganho por semana

### Ideia importante

Não focar apenas no peso do dia. Mostrar tendência.

Exemplo:

> Seu peso subiu 400g hoje, mas a tendência dos últimos 7 dias continua caindo.

Isso evita ansiedade com retenção líquida.

---

## 14. Tela de progresso

### Objetivo

Mostrar uma visão mais ampla da evolução.

### Cards principais

- peso inicial
- peso atual
- peso meta
- diferença total
- média semanal de peso
- dias seguindo dieta
- média de água
- aderência média
- melhor sequência

### Gráficos sugeridos

1. Peso diário
2. Média móvel de peso
3. Consumo de água diário
4. Aderência à dieta
5. Refeições feitas vs puladas
6. Evolução semanal

### Insights automáticos

Gerar mensagens simples com base nos dados:

- “Você costuma beber menos água aos finais de semana.”
- “Sua aderência é melhor nos dias em que registra o café da manhã.”
- “Você perdeu 1,2kg desde o início.”
- “Nos últimos 7 dias, sua média de água foi 2,6L.”
- “Seu peso está estável, mas sua consistência melhorou.”

---

## 15. Configurações globais

### Configurações possíveis

- tema claro como padrão, com dark mode opcional no futuro
- unidade de peso padrão
- unidade de água padrão
- horário inicial do dia
- horário final do dia
- exibir ou ocultar calorias
- exibir ou ocultar macros
- backup/exportação dos dados
- reset de dados

---

## 16. Personalização por persona

Cada persona deve poder configurar:

- nome
- avatar/emoji
- cor principal
- meta de peso
- meta de água
- refeições ativas
- horários das refeições
- dieta ativa
- objetivo principal
- preferências de feedback

---

## 17. Ideias extras para incrementar o produto

### 16.1 Modo “próxima ação”

Um card no topo dizendo exatamente o que fazer agora.

Exemplos:

- “Beba 300ml de água agora.”
- “Sua próxima refeição é o almoço em 40 minutos.”
- “Você ainda precisa registrar seu peso hoje.”
- “Você está atrasado na água. Tente beber 500ml até 16h.”

### 16.2 Checklist diário

Checklist simples:

- registrar peso
- tomar café da manhã
- beber 1L até meio-dia
- cumprir almoço
- bater meta de água
- fechar o dia

### 16.3 Modo marmita

Tela para planejar marmitas da semana.

Campos:

- refeição
- quantidade de porções
- proteína
- carboidrato
- legumes
- observações

Exemplo:

> Preparar 5 marmitas com frango, arroz e legumes.

### 15.4 Lista de compras automática

Com base na dieta cadastrada, gerar uma lista de compras.

Exemplo:

- ovos
- frango
- arroz
- banana
- iogurte
- castanhas
- legumes

No futuro, calcular quantidades aproximadas para 7 dias.

### 15.5 Banco de alimentos favoritos

Cadastrar alimentos usados frequentemente:

- arroz cozido
- frango grelhado
- ovo
- banana
- batata
- legumes
- iogurte
- castanhas

Isso facilita montar novas dietas.

### 15.6 Refeição livre controlada

Registrar refeição livre:

- data
- tipo
- observação
- impacto percebido

Exemplo:

- pizza
- hambúrguer
- sushi
- churrasco

O sistema pode mostrar:

> Refeição livre registrada. Volte para o plano na próxima refeição.

### 15.7 Humor e fome

Registrar rapidamente:

- nível de fome
- energia
- humor
- compulsão

Escala de 1 a 5.

Isso permite identificar padrões:

- fome maior à noite
- baixa energia em dias com pouca água
- compulsão após pular refeição

### 16.8 Fotos de evolução

Permitir registrar fotos por data.

Campos:

- frente
- lado
- costas
- observação

Como é homelab, pode armazenar localmente em volume Docker.

### 16.9 Fechamento do dia

No fim do dia, uma tela simples:

- como foi o dia?
- cumpriu refeições?
- bateu água?
- algo atrapalhou?
- nota do dia

### 16.10 Feedback com IA no futuro

Uma funcionalidade opcional futura:

- analisar semana
- gerar resumo motivacional
- identificar padrões
- sugerir ajustes

Exemplo:

> Esta semana você manteve boa aderência nas refeições, mas ficou abaixo da meta de água em 4 dos 7 dias. O maior ponto de melhoria é antecipar o consumo de água pela manhã.

---

## 18. Modelagem inicial do banco de dados

### Entidades principais

- Persona
- Diet
- Meal
- MealOption
- FoodItem
- DailyMealLog
- WaterLog
- WeightLog
- DailySummary
- AppSettings
- FavoriteFood
- ProgressPhoto
- NutritionProfile
- AiDietGeneration

---

## 19. Schema Prisma sugerido

```prisma
model Persona {
  id              String   @id @default(cuid())
  name            String
  avatar          String?
  color           String?
  age             Int?
  sex             String?
  heightCm        Int?
  initialWeightKg Float?
  targetWeightKg  Float?
  dailyWaterMl    Int      @default(3000)
  goal            String?
  activityLevel   String?
  region          String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  diets           Diet[]
  weightLogs      WeightLog[]
  waterLogs       WaterLog[]
  dailyMealLogs   DailyMealLog[]
  dailySummaries  DailySummary[]
  favoriteFoods   FavoriteFood[]
  progressPhotos  ProgressPhoto[]
  nutritionProfile NutritionProfile?
  aiDietGenerations AiDietGeneration[]
}

model NutritionProfile {
  id                    String   @id @default(cuid())
  personaId             String   @unique
  wakeTime              String?
  sleepTime             String?
  workRoutine           String?
  trainingRoutine       String?
  desiredMealsPerDay    Int?
  mainDifficulty        String?
  foodPreferences       String[] @default([])
  dislikedFoods         String[] @default([])
  allergies             String[] @default([])
  intolerances          String[] @default([])
  medicalRestrictions   String?
  budgetLevel           String?
  preparationPreference String?
  preferredFoods        String[] @default([])
  showCalories          Boolean  @default(false)
  showMacros            Boolean  @default(false)
  includeShoppingList   Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  persona               Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
}

model AiDietGeneration {
  id              String   @id @default(cuid())
  personaId       String
  promptVersion   String?
  status          String   @default("draft")
  inputSnapshot   Json
  outputJson      Json?
  importedDietId  String?
  errorMessage    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  persona         Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
  importedDiet    Diet?    @relation(fields: [importedDietId], references: [id], onDelete: SetNull)
}


model Diet {
  id          String   @id @default(cuid())
  personaId   String
  name        String
  description String?
  objective   String?
  isActive    Boolean  @default(false)
  startDate   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  persona     Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
  meals       Meal[]
  aiGenerations AiDietGeneration[]
}

model Meal {
  id          String   @id @default(cuid())
  dietId      String
  name        String
  description String?
  scheduledAt String
  sortOrder   Int      @default(0)
  isOptional  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  diet        Diet     @relation(fields: [dietId], references: [id], onDelete: Cascade)
  options     MealOption[]
  logs        DailyMealLog[]
}

model MealOption {
  id              String   @id @default(cuid())
  mealId          String
  name            String
  description     String?
  calories        Int?
  proteinGrams    Float?
  carbsGrams      Float?
  fatGrams        Float?
  notes           String?
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  meal            Meal     @relation(fields: [mealId], references: [id], onDelete: Cascade)
  foodItems       FoodItem[]
  logs            DailyMealLog[]
}

model FoodItem {
  id            String   @id @default(cuid())
  mealOptionId  String
  name          String
  quantity      Float?
  unit          String?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  mealOption    MealOption @relation(fields: [mealOptionId], references: [id], onDelete: Cascade)
}

model DailyMealLog {
  id              String   @id @default(cuid())
  personaId       String
  mealId          String
  mealOptionId    String?
  date            DateTime
  status          String
  completedAt     DateTime?
  hungerLevel     Int?
  feeling         String?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  persona         Persona    @relation(fields: [personaId], references: [id], onDelete: Cascade)
  meal            Meal       @relation(fields: [mealId], references: [id], onDelete: Cascade)
  mealOption      MealOption? @relation(fields: [mealOptionId], references: [id], onDelete: SetNull)
}

model WaterLog {
  id         String   @id @default(cuid())
  personaId  String
  amountMl   Int
  loggedAt   DateTime @default(now())
  date       DateTime
  notes      String?
  createdAt  DateTime @default(now())

  persona    Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
}

model WeightLog {
  id          String   @id @default(cuid())
  personaId   String
  weightKg    Float
  date        DateTime
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  persona     Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
}

model DailySummary {
  id               String   @id @default(cuid())
  personaId        String
  date             DateTime
  mealsScore       Int?
  waterScore       Int?
  overallScore     Int?
  energyLevel      Int?
  moodLevel        Int?
  hungerLevel      Int?
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  persona          Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)

  @@unique([personaId, date])
}

model FavoriteFood {
  id             String   @id @default(cuid())
  personaId      String
  name           String
  defaultQuantity Float?
  defaultUnit    String?
  calories       Int?
  proteinGrams   Float?
  carbsGrams     Float?
  fatGrams       Float?
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  persona        Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
}

model ProgressPhoto {
  id          String   @id @default(cuid())
  personaId   String
  imageUrl    String
  type        String?
  date        DateTime
  notes       String?
  createdAt   DateTime @default(now())

  persona     Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
}

model AppSettings {
  id               String   @id @default(cuid())
  activePersonaId  String?
  theme            String   @default("light")
  showCalories     Boolean  @default(false)
  showMacros       Boolean  @default(false)
  dayStartTime     String   @default("06:00")
  dayEndTime       String   @default("23:00")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

---

## 20. Rotas e telas sugeridas

### `/`

Redireciona para `/today`.

### `/today`

Dashboard principal do dia.

### `/diet`

Visualização da dieta ativa.

### `/diet/edit`

Criação e edição da dieta.

### `/ai-diet`

Questionário nutricional, geração de dieta com OpenAI, preview e importação da dieta para a persona ativa.

### `/water`

Controle detalhado de água.

### `/weight`

Cadastro e histórico de peso.

### `/progress`

Gráficos e evolução.

### `/personas`

Gerenciamento de personas.

### `/settings`

Configurações globais.

---

## 21. Componentes principais

### Componentes de layout

- `AppShell`
- `Sidebar`
- `MobileNav`
- `TopBar`
- `PersonaSwitcher`
- `PageHeader`

### Componentes do dashboard

- `TodayOverview`
- `CurrentMealCard`
- `UpcomingMealsList`
- `WaterProgressCard`
- `WeightProgressCard`
- `DailyConsistencyCard`
- `NextActionCard`

### Componentes de dieta

- `DietEditor`
- `MealForm`
- `MealOptionForm`
- `FoodItemInput`
- `MealTimeline`

### Componentes de IA/nutrição

- `AiDietWizard`
- `NutritionProfileForm`
- `AiDietPreview`
- `GeneratedMealCard`
- `ImportDietButton`
- `AiDietHistory`
- `ShoppingListPreview`

### Componentes de água

- `WaterQuickAdd`
- `WaterProgressRing`
- `WaterHistoryChart`
- `WaterFeedbackMessage`

### Componentes de peso

- `WeightForm`
- `WeightTrendChart`
- `WeightGoalProgress`
- `WeightLogTable`

### Componentes de progresso

- `ProgressOverviewCards`
- `AdherenceChart`
- `MealsCompletionChart`
- `WeeklySummary`
- `InsightCard`

---

## 22. Lógica de negócio importante

### 21.1 Detectar refeição atual

Com base no horário atual:

- listar refeições do dia ordenadas por horário
- identificar a próxima refeição não concluída
- se uma refeição já passou do horário e não foi marcada, exibir como atrasada

### 21.2 Calcular progresso de água

```ts
const progress = consumedMl / dailyGoalMl;
```

### 21.3 Calcular água esperada até o horário atual

Exemplo:

- início do dia: 06:00
- fim do dia: 23:00
- meta: 3000ml
- horário atual: 15:00

Calcular porcentagem do dia já passado e comparar com porcentagem da água consumida.

### 21.4 Calcular tendência de peso

Não usar apenas o peso mais recente.

Criar:

- peso atual = último registro
- média 7 dias = média dos últimos registros disponíveis
- diferença total = peso atual - peso inicial
- falta para meta = peso atual - peso meta

### 21.5 Gerar dieta com IA

Fluxo técnico sugerido:

1. Buscar persona ativa e `NutritionProfile`.
2. Montar um `inputSnapshot` com todos os dados usados na geração.
3. Enviar para a OpenAI usando resposta estruturada em JSON.
4. Validar retorno com Zod.
5. Salvar `AiDietGeneration` com `outputJson`.
6. Exibir preview editável.
7. Ao importar, converter JSON em `Diet`, `Meal`, `MealOption` e `FoodItem`.
8. Marcar a dieta importada como ativa, caso o usuário escolha essa opção.

Usar `OPENAI_API_KEY` via variável de ambiente. Nunca expor a chave no client. Toda chamada deve ocorrer no server.

### 21.6 Calcular score diário

Exemplo simples:

- refeições: 60 pontos
- água: 30 pontos
- registro diário/check-in: 10 pontos

```ts
const mealsScore = completedMeals / totalMeals * 60;
const waterScore = Math.min(consumedWater / waterGoal, 1) * 30;
const checkinScore = hasDailySummary ? 10 : 0;
const totalScore = mealsScore + waterScore + checkinScore;
```

---

## 23. Seed inicial com dieta do Alex

Criar um seed inicial opcional com a dieta abaixo.

### Persona

- Nome: Alex
- Altura: 170cm
- Peso inicial: 81.95kg
- Meta inicial: 72kg
- Água diária: 3000ml
- Objetivo: perder gordura

### Café da manhã

Opção 1:

- 3 ovos inteiros — 150g
- pão integral — 40g
- café sem açúcar

Opção 2:

- omelete com 3 ovos — 150g
- banana — 100g
- canela

Opção 3:

- tapioca — 50g
- 2 ovos — 100g
- queijo branco — 30g

### Lanche da manhã

Opção 1:

- banana — 100g
- 4 castanhas

Opção 2:

- maçã — 1 unidade média
- damasco seco — 3 unidades

Opção 3:

- iogurte natural — 170g
- chia — 10g

### Almoço

Opção 1:

- arroz branco cozido — 120g
- frango grelhado — 180g
- legumes/salada à vontade
- azeite — 1 colher pequena

Opção 2:

- arroz cozido — 100g
- lentilha — 80g
- patinho moído — 180g
- salada

Opção 3:

- batata inglesa cozida — 200g
- frango — 180g
- brócolis/cenoura

### Lanche da tarde

Opção 1:

- 2 ovos cozidos — 100g
- café sem açúcar

Opção 2:

- iogurte natural — 170g
- 4 castanhas

Opção 3:

- whey — 30g
- banana pequena — 80g

### Jantar

Opção 1:

- omelete com 3 ovos — 150g
- tomate
- cebola
- salada

Opção 2:

- frango grelhado — 180g
- legumes refogados
- abóbora — 120g

Opção 3:

- sopa com frango desfiado — 150g
- legumes
- batata — 80g

### Ceia

Opção 1:

- iogurte natural — 170g

Opção 2:

- 2 ovos cozidos — 100g

Opção 3:

- gelatina zero

---

## 24. Roadmap de desenvolvimento

### Fase 1 — MVP essencial

Objetivo: permitir uso diário real.

Entregas:

- setup do projeto Next.js
- Docker Compose com PostgreSQL
- Prisma configurado
- cadastro de personas
- troca de persona ativa
- cadastro de dieta/refeições/opções
- perfil nutricional da persona
- primeira versão do Montar Dieta com IA
- importação da dieta gerada pela IA
- dashboard “Hoje”
- marcar refeições como feitas/puladas
- registrar água
- registrar peso
- gráficos básicos de peso e água

### Fase 2 — Melhor experiência diária

Entregas:

- card de próxima ação
- feedback inteligente de água
- score diário
- histórico diário
- checklist do dia
- responsividade mobile refinada
- PWA para instalar no celular

### Fase 3 — Progresso e insights

Entregas:

- tela de progresso completa
- média móvel de peso
- aderência semanal
- insights automáticos
- comparação entre semanas
- fechamento do dia

### Fase 4 — Recursos avançados

Entregas:

- fotos de evolução
- lista de compras
- modo marmita
- banco de alimentos favoritos
- exportação/backup JSON
- importação de backup

### Fase 5 — IA avançada

Entregas:

- resumo semanal com IA
- análise de padrões
- sugestões de ajuste
- mensagens motivacionais personalizadas
- gerar substituições para uma refeição específica
- gerar lista de compras automática
- gerar versão econômica ou versão com menos preparo da dieta

---

## 25. Requisitos não funcionais

### Performance

- carregamento rápido
- boa experiência mobile
- evitar queries pesadas desnecessárias
- usar Server Components quando fizer sentido

### Privacidade

- dados ficam no homelab
- sem autenticação inicialmente
- única dependência externa prevista no MVP: OpenAI para geração de dietas

### Backup

Como os dados são pessoais, adicionar desde cedo:

- exportar dados em JSON
- documentar backup do volume do Postgres

### Responsividade

O app deve ser pensado principalmente para celular.

Uso provável:

- registrar água pelo celular
- consultar próxima refeição
- marcar refeições
- registrar peso

Desktop será útil para configuração e análise.

---

## 26. Estrutura sugerida de pastas

```txt
src/
  app/
    today/
    diet/
    ai-diet/
    water/
    weight/
    progress/
    personas/
    settings/
    api/
  components/
    layout/
    today/
    diet/
    ai-diet/
    water/
    weight/
    progress/
    personas/
    ui/
  lib/
    prisma.ts
    dates.ts
    water.ts
    weight.ts
    score.ts
  server/
    actions/
      personas.ts
      diet.ts
      ai-diet.ts
      meals.ts
      water.ts
      weight.ts
      settings.ts
  schemas/
    persona.ts
    diet.ts
    nutrition-profile.ts
    ai-diet.ts
    water.ts
    weight.ts
  types/
  styles/
prisma/
  schema.prisma
  seed.ts
```

---

## 27. Variáveis de ambiente

Criar `.env` com:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/zeronutri
OPENAI_API_KEY=coloque_sua_chave_aqui
```

A chave da OpenAI deve ser usada apenas no server. Nunca chamar a OpenAI diretamente pelo client/browser.

---

## 28. Docker Compose sugerido

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: 0nutri-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/zeronutri
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17-alpine
    container_name: 0nutri-db
    restart: unless-stopped
    ports:
      - "5434:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: zeronutri
    volumes:
      - zeronutri_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d zeronutri"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  zeronutri_postgres_data:
```

---

## 29. Dockerfile sugerido

```Dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

> Importante: configurar `output: 'standalone'` no `next.config.ts`.

---

## 30. Prompt principal para o Claude Code

Use o prompt abaixo no Claude Code para iniciar o desenvolvimento.

```md
Você é um desenvolvedor fullstack sênior especialista em Next.js App Router, TypeScript, PostgreSQL, Prisma, Docker, TailwindCSS e shadcn/ui.

Vamos construir um sistema chamado 0nutri.

Contexto:
O 0nutri é um sistema web privado, hospedado em homelab, para controle de dieta, ingestão de água, peso, progresso e métricas pessoais. Ele será usado por mim e pela minha esposa. Como será usado em ambiente privado, não teremos autenticação no MVP. Em vez disso, teremos personas/workspaces. Cada persona terá dados próprios, dieta própria, meta de peso, meta de água, histórico e configurações individuais.

Stack obrigatória:
- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- TailwindCSS
- shadcn/ui
- Recharts
- React Hook Form
- Zod
- OpenAI SDK
- Docker e Docker Compose
- npm, nunca yarn

Objetivo do MVP:
Criar uma aplicação funcional e bonita, com foco mobile, onde eu consiga:
- cadastrar personas
- alternar persona ativa
- cadastrar dieta com refeições, opções e alimentos pesados
- preencher perfil nutricional da persona
- montar dieta com IA usando OpenAI
- visualizar preview da dieta gerada
- importar a dieta gerada para a persona
- visualizar o que devo comer hoje
- ver a refeição atual e próximas refeições
- marcar refeições como feitas, puladas ou parcialmente feitas
- registrar ingestão de água com botões rápidos
- receber feedback sobre consumo de água baseado no horário do dia
- cadastrar peso por data
- visualizar gráficos simples de peso e água
- acompanhar progresso até a meta

Requisitos importantes:
- Interface light, moderna, intuitiva e responsiva
- Deve parecer um app pessoal premium, não um CRUD genérico
- A tela principal deve ser /today
- A experiência deve ser muito rápida para uso diário no celular
- Não criar autenticação
- Dados separados por persona
- Criar seed inicial com uma persona chamada Alex e a dieta base fornecida no plano
- Criar estrutura limpa, componentizada e fácil de evoluir
- Usar Server Actions ou Route Handlers conforme fizer mais sentido
- Validar formulários com Zod
- Usar Prisma para toda persistência
- Preparar Docker Compose com app e Postgres
- Implementar a funcionalidade Montar Dieta com IA via OpenAI
- Usar resposta estruturada/JSON validado com Zod
- Salvar o input e output das gerações para auditoria e histórico
- Permitir importar a dieta gerada para as tabelas reais da aplicação

Regras para IA:
- Não prometer cura ou resultado garantido
- Não sugerir dietas extremas
- Respeitar alergias, intolerâncias e preferências
- Priorizar alimentos comuns do Brasil e da região informada
- Exibir aviso de que é uma sugestão gerada por IA e não substitui nutricionista

Comece analisando este plano e depois implemente em fases:
1. Setup base do projeto, Prisma, Docker e layout
2. Modelagem e migrations
3. Personas e troca de persona ativa
4. Dieta/refeições/opções/alimentos
5. Perfil nutricional + Montar Dieta com IA + Importação
6. Dashboard Hoje
7. Água
8. Peso
9. Gráficos e progresso
10. Seed inicial
11. Polimento visual e responsividade

Antes de implementar, crie um checklist técnico curto do que será feito. Depois siga com a implementação.
```

---

## 31. Prompt para agente de UI/UX

```md
Você é um designer e frontend engineer especialista em interfaces modernas para apps SaaS, dashboards pessoais, health apps, fitness apps e produtos mobile-first.

Você domina:
- Next.js
- React
- TypeScript
- TailwindCSS
- shadcn/ui
- Framer Motion
- Recharts
- Design systems modernos
- UX para dashboards e aplicativos de acompanhamento diário

Sua missão é criar uma interface sensacional para o sistema 0nutri.

Contexto:
O 0nutri é um app privado de dieta, peso, ingestão de água e progresso corporal. Ele será usado diariamente no celular. A interface precisa ser linda, rápida e extremamente clara. O usuário deve bater o olho e entender o que precisa fazer agora.

Direção visual:
- light mode como padrão
- visual premium, moderno, limpo e tecnológico
- background claro com cards bem destacados
- cards com bom espaçamento
- cantos arredondados
- microinterações suaves
- gráficos bonitos
- foco em clareza
- verde para progresso/saúde
- azul para água
- lilás/roxo claro como detalhes
- estados visuais claros para sucesso, alerta e atraso

Evite:
- visual genérico de CRUD
- tabelas demais na tela mobile
- textos longos sem necessidade
- excesso de campos ao mesmo tempo
- poluição visual

Telas principais:
- Dashboard Hoje
- Dieta
- Montar Dieta com IA
- Água
- Peso
- Progresso
- Personas
- Configurações

Prioridade máxima:
A tela /today precisa ser excelente. Ela deve mostrar:
- persona ativa
- próxima ação recomendada
- refeição atual
- próximas refeições
- progresso da água
- peso atual e meta
- consistência do dia

Pense em uma experiência parecida com um app pessoal premium de saúde, mas com identidade própria e sem parecer genérico.

Sempre que criar componentes, pense primeiro no mobile e depois no desktop.
```

---

## 32. Critérios de aceite do MVP

O MVP estará pronto quando:

- for possível rodar com Docker Compose
- o banco subir corretamente
- o app conectar no Postgres
- houver pelo menos uma persona criada via seed
- for possível trocar persona ativa
- for possível cadastrar e editar uma dieta
- for possível preencher perfil nutricional da persona
- for possível gerar uma dieta com IA via OpenAI
- for possível visualizar preview e importar dieta gerada
- for possível visualizar a dieta do dia
- for possível marcar refeições
- for possível registrar água
- houver feedback visual de consumo de água
- for possível registrar peso
- houver gráfico de peso
- houver gráfico de água
- a interface estiver responsiva para celular
- o app estiver pronto para deploy no homelab/EasyPanel

---

## 33. Observações finais

O 0nutri deve começar simples, mas com base sólida para evoluir.

O mais importante não é ter contagem perfeita de calorias no início. O mais importante é criar um app que ajude no comportamento diário:

- lembrar o que comer
- beber água
- registrar peso
- manter consistência
- visualizar progresso
- reduzir ansiedade com oscilações
- facilitar o uso para mais de uma pessoa

A evolução ideal é transformar o 0nutri em um painel pessoal de saúde e dieta, privado, bonito e útil o suficiente para ser aberto todos os dias.
