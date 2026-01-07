import { MODULES } from './progress'

// Module content - converted from markdown files
export const moduleContent: Record<string, string> = {
  '01-hva-er-rabbitmq': `
# Modul 1: Hva er RabbitMQ?

**Tid:** 15 minutter

---

## Læringsmål

Etter denne modulen skal du kunne:
- Forklare hva en meldingskø er
- Beskrive når RabbitMQ er riktig valg
- Forstå forskjellen på synkron og asynkron kommunikasjon

---

## Hva er en meldingskø?

En meldingskø er et mellomledd mellom systemer som sender og mottar data.

\`\`\`
UTEN MELDINGSKØ (synkront):
┌──────────┐         ┌──────────┐
│ System A │ ──────► │ System B │
└──────────┘         └──────────┘
     │
     └── A må vente på svar fra B
         Hvis B er nede, feiler A


MED MELDINGSKØ (asynkront):
┌──────────┐    ┌─────────┐    ┌──────────┐
│ System A │ ─► │ Kø      │ ─► │ System B │
└──────────┘    └─────────┘    └──────────┘
     │               │
     │               └── Meldingen venter trygt
     └── A er ferdig med en gang
         Hvis B er nede, ligger meldingen i køen
\`\`\`

---

## Hvorfor meldingskø?

| Problem | Løsning med meldingskø |
|---------|------------------------|
| System B er tregt | A slipper å vente |
| System B er nede | Meldingen venter i køen |
| Mange samtidige forespørsler | Køen buffer trafikk |
| Systemer på ulike tidspunkter | Asynkron kommunikasjon |
| Én-til-mange distribusjon | Publish/subscribe |

---

## Hva er RabbitMQ?

RabbitMQ er en **message broker** - et program som:
- Tar imot meldinger fra produsenter
- Lagrer meldinger i køer
- Leverer meldinger til konsumenter

\`\`\`
┌───────────────────────────────────────────────────────────┐
│                       RabbitMQ                            │
│                                                           │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│  │ Exchange │ ─► │ Queue 1  │ ─► │Consumer 1│            │
│  │          │    └──────────┘    └──────────┘            │
│  │          │    ┌──────────┐    ┌──────────┐            │
│  │          │ ─► │ Queue 2  │ ─► │Consumer 2│            │
│  └──────────┘    └──────────┘    └──────────┘            │
│        ▲                                                  │
│        │                                                  │
└────────┼──────────────────────────────────────────────────┘
         │
    ┌──────────┐
    │ Producer │
    └──────────┘
\`\`\`

---

## Når bruke RabbitMQ?

### Gode bruksområder

| Scenario | Eksempel |
|----------|----------|
| **Arbeidskøer** | Prosessere bestillinger i bakgrunnen |
| **Hendelsesdistribusjon** | Varsle flere systemer om en endring |
| **Request/Reply** | Asynkron RPC mellom tjenester |
| **Lastfordeling** | Fordele arbeid på flere workers |
| **Bufring** | Ta imot trafikk selv om mottaker er treg |

### Mindre egnet for

| Scenario | Bedre alternativ |
|----------|------------------|
| Sanntids streaming av store datamengder | Kafka |
| Event sourcing med replay | Kafka |
| Multi-tenant med delt infrastruktur | Kafka (har ekte kvoter) |
| Enkel pub/sub i skyen | Cloud-native (SNS, Pub/Sub) |

---

## RabbitMQ vs Kafka

| Egenskap | RabbitMQ | Kafka |
|----------|----------|-------|
| **Modell** | Message queue | Event log |
| **Meldinger etter levering** | Slettes | Beholdes |
| **Replay** | Nei | Ja |
| **Routing** | Avansert | Enkel |
| **Protokoll** | AMQP, MQTT, STOMP | Kafka-native |
| **Ressurskvoter per tenant** | Nei | Ja |

**Tommelfingerregel:**
- RabbitMQ: "Gjør denne jobben for meg"
- Kafka: "Her er hva som skjedde"

---

## Nøkkelbegreper

| Begrep | Forklaring |
|--------|------------|
| **Producer** | Sender meldinger |
| **Consumer** | Mottar meldinger |
| **Queue** | Lagrer meldinger |
| **Exchange** | Router meldinger til køer |
| **Binding** | Kobling mellom exchange og kø |
| **Message** | Selve dataen som sendes |
| **Broker** | RabbitMQ-serveren |

---

## Oppsummering

- RabbitMQ er en meldingskø som muliggjør asynkron kommunikasjon
- Meldinger lagres trygt til de er prosessert
- Best egnet for arbeidskøer og hendelsesdistribusjon
- Kafka er bedre for streaming og multi-tenant
`,

  '02-arkitektur': `
# Modul 2: Arkitektur

**Tid:** 20 minutter

---

## Læringsmål

Etter denne modulen skal du kunne:
- Tegne opp RabbitMQ-arkitekturen
- Forklare hva hver komponent gjør
- Forstå hvordan meldinger flyter gjennom systemet

---

## Oversikt

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                         RabbitMQ Broker                             │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      Virtual Host (/)                        │   │
│   │                                                             │   │
│   │    Producer                                    Consumer     │   │
│   │       │                                           ▲         │   │
│   │       ▼                                           │         │   │
│   │  ┌──────────┐   Binding    ┌──────────┐          │         │   │
│   │  │ Exchange │ ──────────►  │  Queue   │ ─────────┘         │   │
│   │  └──────────┘              └──────────┘                     │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## Komponenter

### 1. Broker (Node)

Selve RabbitMQ-serveren. Kan kjøre alene eller i cluster.

\`\`\`
Enkelt-node:                    Cluster (anbefalt for prod):
┌──────────┐                    ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Node 1  │                    │  Node 1  │ │  Node 2  │ │  Node 3  │
└──────────┘                    └──────────┘ └──────────┘ └──────────┘
                                      └───────────┴───────────┘
                                              Cluster
\`\`\`

**Viktig:** Alltid odde antall noder (3, 5, 7) for quorum-avstemning.

---

### 2. Virtual Host (vhost)

Logisk isolering innenfor én broker. Tenk på det som separate "databaser".

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                       RabbitMQ Broker                       │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   vhost: /      │  │ vhost: /kunde-a │  │ vhost: /test│  │
│  │                 │  │                 │  │             │  │
│  │  køer, exch...  │  │  køer, exch...  │  │ køer, exch..│  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
\`\`\`

**Begrensning:** Vhosts isolerer IKKE ressursbruk (minne, CPU, disk).

---

### 3. Exchange

Mottar meldinger og router dem til køer basert på regler.

| Type | Routing | Bruksområde |
|------|---------|-------------|
| **direct** | Eksakt match på routing key | Punkt-til-punkt |
| **topic** | Pattern match (*, #) | Kategorisert routing |
| **fanout** | Alle bindinger | Broadcast |
| **headers** | Header-matching | Kompleks routing |

\`\`\`
Direct:     ordre.opprettet  →  kø-ordre (eksakt match)

Topic:      ordre.*          →  kø-ordre (pattern)
            ordre.#          →  kø-alle-ordre (wildcard)

Fanout:     (alle)           →  kø-1, kø-2, kø-3 (broadcast)
\`\`\`

---

### 4. Queue

Lagrer meldinger til de er prosessert.

\`\`\`
┌───────────────────────────────────────────────────────────┐
│                         Queue                             │
│                                                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ Msg │ │ Msg │ │ Msg │ │ Msg │ │ Msg │  ◄── Nye inn  │
│  │  1  │ │  2  │ │  3  │ │  4  │ │  5  │               │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘               │
│     │                                                     │
│     └── Gamle ut (FIFO)                                  │
└───────────────────────────────────────────────────────────┘
\`\`\`

**Queue-typer (kritisk valg!):**

| Type | Holdbarhet | Ytelse | Bruk |
|------|------------|--------|------|
| **Classic** | Enkelt-node | Høy | Kun hvis ytelse > pålitelighet |
| **Quorum** | Replikert | Moderat | **Standard for produksjon** |
| **Stream** | Log-basert | Høy | Replay, mange konsumenter |

---

### 5. Binding

Kobler exchange til kø med regler.

\`\`\`
Exchange ──── routing_key: "ordre.*" ────► Queue

Binding sier: "Meldinger som matcher dette mønsteret,
               send til denne køen"
\`\`\`

---

### 6. Connection og Channel

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      Applikasjon                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Connection (TCP)                        │   │
│  │                                                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │   │
│  │  │Channel 1│  │Channel 2│  │Channel 3│             │   │
│  │  └─────────┘  └─────────┘  └─────────┘             │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        RabbitMQ Broker
\`\`\`

- **Connection:** TCP-forbindelse (tungt å opprette)
- **Channel:** Lett multipleksing innenfor connection

**Best practice:** Én connection per applikasjon, én channel per tråd.

---

## Meldingsflyt

\`\`\`
1. Producer sender melding til Exchange
                │
                ▼
2. Exchange evaluerer routing key mot bindings
                │
                ▼
3. Melding kopieres til matchende køer
                │
                ▼
4. Melding lagres i kø (disk eller minne)
                │
                ▼
5. Consumer henter melding fra kø
                │
                ▼
6. Consumer sender ACK (acknowledgment)
                │
                ▼
7. Melding slettes fra kø
\`\`\`

---

## Cluster-arkitektur

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                        RabbitMQ Cluster                             │
│                                                                     │
│   ┌───────────┐      ┌───────────┐      ┌───────────┐              │
│   │  Node 1   │◄────►│  Node 2   │◄────►│  Node 3   │              │
│   │  (leader) │      │ (follower)│      │ (follower)│              │
│   └───────────┘      └───────────┘      └───────────┘              │
│         │                  │                  │                     │
│         └──────────────────┼──────────────────┘                     │
│                            │                                        │
│                    Quorum Queue                                     │
│                    (replikert)                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

**Quorum queues:**
- Data replikeres til alle noder
- Mister man én node, fortsetter køen
- Krever flertall (quorum) for operasjoner

---

## Kritiske arkitekturbeslutninger

| Beslutning | Anbefaling | Hvorfor |
|------------|------------|---------|
| Cluster-størrelse | 3 eller 5 noder | Quorum + feiltoleranse |
| Queue-type | Quorum | Tåler node-feil |
| Vhosts | Én per kunde | Logisk isolering |
| Connections | Pool/gjenbruk | Ressurssparing |

---

## Oppsummering

- **Broker** = RabbitMQ-server (node)
- **Vhost** = Logisk isolering (ikke ressursisolering!)
- **Exchange** = Router meldinger
- **Queue** = Lagrer meldinger
- **Binding** = Regler for routing
- **Quorum queues** = Standard for produksjon
`,

  '03-koer-og-meldinger': `
# Modul 3: Køer og meldinger

**Tid:** 25 minutter

---

## Læringsmål

Etter denne modulen skal du kunne:
- Velge riktig queue-type for ulike scenarioer
- Forstå meldingslivssyklus og acknowledgments
- Konfigurere køer for pålitelighet vs ytelse
- Unngå vanlige feil som fører til meldingstap

---

## Queue-typer

Dette er det **viktigste valget** du tar ved oppsett.

### Classic Queue

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Classic Queue                            │
│                                                             │
│   Node 1 (master)     Node 2           Node 3              │
│   ┌─────────────┐                                          │
│   │ Queue data  │     (ingen kopi)    (ingen kopi)         │
│   └─────────────┘                                          │
│                                                             │
│   ⚠️  Hvis Node 1 dør = MELDINGSTAP                        │
└─────────────────────────────────────────────────────────────┘
\`\`\`

| Egenskap | Verdi |
|----------|-------|
| Replikering | Nei (kun på én node) |
| Feiltoleranse | Ingen |
| Ytelse | Høy |
| Bruk | **Kun** der tap er akseptabelt |

### Quorum Queue (anbefalt)

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Quorum Queue                             │
│                                                             │
│   Node 1 (leader)    Node 2 (follower)  Node 3 (follower)  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │ Queue data  │    │ Queue data  │    │ Queue data  │    │
│   └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                             │
│   ✅  Hvis Node 1 dør = Node 2 tar over, ingen tap         │
└─────────────────────────────────────────────────────────────┘
\`\`\`

| Egenskap | Verdi |
|----------|-------|
| Replikering | Ja (alle noder) |
| Feiltoleranse | Tåler minoritet nede |
| Ytelse | Moderat |
| Bruk | **Standard for produksjon** |

### Stream Queue

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Stream Queue                             │
│                                                             │
│   ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐             │
│   │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  ◄── Append │
│   └─────┴─────┴─────┴─────┴─────┴─────┴─────┘             │
│      ▲           ▲                    ▲                    │
│      │           │                    │                    │
│   Consumer A  Consumer B          Consumer C              │
│   (offset 1)  (offset 3)          (offset 6)              │
│                                                             │
│   ✅  Flere konsumenter kan lese samme meldinger           │
│   ✅  Replay fra vilkårlig offset                          │
└─────────────────────────────────────────────────────────────┘
\`\`\`

| Egenskap | Verdi |
|----------|-------|
| Meldinger etter levering | Beholdes |
| Replay | Ja |
| Bruk | Logging, event sourcing |

---

## Valg av queue-type

\`\`\`
Trenger du meldingene etter prosessering?
│
├─► JA → Stream Queue
│
└─► NEI
    │
    ├─► Er meldingstap akseptabelt?
    │   │
    │   ├─► JA → Classic Queue (høy ytelse)
    │   │
    │   └─► NEI → Quorum Queue ✅ (anbefalt)
\`\`\`

---

## Meldingslivssyklus

\`\`\`
┌──────────┐
│ Producer │
└────┬─────┘
     │ 1. Publish
     ▼
┌──────────┐
│ Exchange │
└────┬─────┘
     │ 2. Route
     ▼
┌──────────┐
│  Queue   │ ◄── 3. Lagret (persistent hvis durable)
└────┬─────┘
     │ 4. Deliver
     ▼
┌──────────┐
│ Consumer │
└────┬─────┘
     │ 5. Process
     │
     │ 6. ACK ──────────────────────┐
     │                              │
     ▼                              ▼
┌──────────┐                   ┌──────────┐
│  Ferdig  │                   │  Queue   │
└──────────┘                   │ (slettet)│
                               └──────────┘
\`\`\`

---

## Acknowledgments (ACK)

**Kritisk for å unngå meldingstap!**

### Auto-ACK (farlig)

\`\`\`
Consumer mottar melding → Melding slettes umiddelbart

⚠️  Hvis consumer krasjer under prosessering = MELDINGSTAP
\`\`\`

### Manual ACK (anbefalt)

\`\`\`
Consumer mottar melding → Prosesserer → Sender ACK → Melding slettes

✅  Hvis consumer krasjer = Melding redeliveres til annen consumer
\`\`\`

### NACK og Reject

| Handling | Effekt |
|----------|--------|
| \`ACK\` | Melding prosessert OK, slett |
| \`NACK\` | Melding feilet, requeue eller DLX |
| \`REJECT\` | Avvis melding, ikke requeue |

---

## Viktige kø-parametere

| Parameter | Betydning | Anbefaling |
|-----------|-----------|------------|
| \`x-queue-type\` | classic/quorum/stream | \`quorum\` |
| \`x-max-length\` | Maks antall meldinger | Sett alltid |
| \`x-message-ttl\` | Meldinger utløper | Sett alltid |
| \`x-overflow\` | Hva skjer ved full kø | \`reject-publish\` |
| \`x-dead-letter-exchange\` | Hvor feilede går | Sett alltid |
| \`x-delivery-limit\` | Maks redelivery | 5 |

---

## Dead Letter Exchange (DLX)

Meldinger som feiler sendes til DLX i stedet for å forsvinne.

\`\`\`
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Queue   │ ──► │   DLX    │ ──► │ DL Queue │
└──────────┘     └──────────┘     └──────────┘
                      ▲
                      │
              Meldinger som:
              - NACK uten requeue
              - Utløpt TTL
              - Overskredet delivery-limit
              - Køen er full
\`\`\`

**Alltid sett opp DLX!** Ellers forsvinner feilede meldinger.

---

## Vanlige feil

### 1. Meldingstap ved crash

\`\`\`
❌ FEIL:
- Auto-ACK
- Classic queue
- Transient meldinger

✅ RIKTIG:
- Manual ACK
- Quorum queue
- Persistent meldinger (delivery_mode=2)
\`\`\`

### 2. Køen vokser ukontrollert

\`\`\`
❌ FEIL:
- Ingen max-length
- Ingen TTL
- Ingen DLX

✅ RIKTIG:
- x-max-length: 100000
- x-message-ttl: 604800000 (7 dager)
- x-dead-letter-exchange: dlx
\`\`\`

### 3. Infinite redelivery loop

\`\`\`
❌ FEIL:
- Consumer feiler alltid
- NACK med requeue
- Ingen delivery-limit

✅ RIKTIG:
- x-delivery-limit: 5
- DLX for feilede meldinger
- Overvåk DL queue
\`\`\`

---

## Oppsummering

| Valg | Anbefaling |
|------|------------|
| Queue-type | Quorum |
| Durable | Ja |
| Persistent meldinger | Ja |
| ACK-modus | Manual |
| Max-length | Sett alltid |
| TTL | Sett alltid |
| DLX | Sett alltid |
`,

  '04-exchanges-og-routing': `
# Modul 4: Exchanges og routing

**Tid:** 20 minutter

---

## Læringsmål

Etter denne modulen skal du kunne:
- Velge riktig exchange-type for ulike scenarioer
- Sette opp bindings med routing keys
- Designe routing-topologier

---

## Exchange-typer

### Direct Exchange

Eksakt match på routing key.

\`\`\`
Producer: routing_key = "ordre.opprettet"

Exchange (direct)
    │
    ├── Binding: "ordre.opprettet" → kø-ordre ✅ (match)
    ├── Binding: "ordre.kansellert" → kø-kansellering ❌
    └── Binding: "betaling.mottatt" → kø-betaling ❌
\`\`\`

**Bruk:** Punkt-til-punkt, spesifikke hendelser.

---

### Topic Exchange

Pattern matching med wildcards.

\`\`\`
Wildcards:
  *  = Eksakt ett ord
  #  = Null eller flere ord

Producer: routing_key = "ordre.opprettet.norge"

Exchange (topic)
    │
    ├── Binding: "ordre.*.*"        → kø-ordre ✅
    ├── Binding: "ordre.#"          → kø-alle-ordre ✅
    ├── Binding: "*.opprettet.*"    → kø-opprettet ✅
    └── Binding: "betaling.#"       → kø-betaling ❌
\`\`\`

**Bruk:** Kategorisert routing, fleksible mønstre.

---

### Fanout Exchange

Ignorer routing key, send til alle bindinger.

\`\`\`
Producer: routing_key = (ignorert)

Exchange (fanout)
    │
    ├── Binding → kø-1 ✅
    ├── Binding → kø-2 ✅
    └── Binding → kø-3 ✅
\`\`\`

**Bruk:** Broadcast, pub/sub.

---

### Headers Exchange

Match på headers i stedet for routing key.

\`\`\`
Producer: headers = {type: "ordre", region: "norge"}

Exchange (headers)
    │
    ├── Binding: {type: "ordre"}              → kø-ordre ✅
    ├── Binding: {type: "ordre", x-match: all}→ kø-ordre ✅
    └── Binding: {region: "sverige"}          → kø-sverige ❌
\`\`\`

**Bruk:** Kompleks routing basert på metadata.

---

## Valg av exchange-type

\`\`\`
Én mottaker per melding?
│
├─► JA → Direct Exchange
│
└─► NEI (flere mottakere)
    │
    ├─► Alle skal ha alle meldinger?
    │   │
    │   └─► JA → Fanout Exchange
    │
    └─► Noen skal ha noen meldinger?
        │
        ├─► Basert på kategori/hierarki?
        │   │
        │   └─► JA → Topic Exchange
        │
        └─► Basert på metadata?
            │
            └─► JA → Headers Exchange
\`\`\`

---

## Default Exchange

Det finnes en innebygd "default exchange" (tom streng).

\`\`\`
Producer: exchange = "", routing_key = "min-kø"

Meldingen går direkte til køen "min-kø"
(forutsatt at køen finnes)
\`\`\`

**Bruk:** Enkel testing, direkte kø-sending.

---

## Routing-mønstre

### 1. Work Queue (lastfordeling)

\`\`\`
Producer → Exchange → Queue → Consumer 1
                          └─→ Consumer 2
                          └─→ Consumer 3

Meldinger fordeles round-robin mellom consumers.
\`\`\`

### 2. Publish/Subscribe

\`\`\`
Producer → Exchange (fanout) → Queue 1 → Consumer A
                           └─→ Queue 2 → Consumer B
                           └─→ Queue 3 → Consumer C

Alle consumers får alle meldinger.
\`\`\`

### 3. Topic-basert routing

\`\`\`
Producer: "ordre.opprettet.oslo"
    │
    ▼
Exchange (topic)
    │
    ├── "ordre.#"        → Ordre-service (alle ordre)
    ├── "*.opprettet.*"  → Notifikasjon-service (alle opprettet)
    └── "*.*.oslo"       → Oslo-dashboard (alt fra oslo)
\`\`\`

---

## Alternate Exchange

Hvis ingen binding matcher, send til alternate exchange.

\`\`\`
Exchange: primær
    │
    ├── Binding: "ordre.*" → kø-ordre
    │
    └── Ingen match? → Alternate Exchange → kø-ukjent
\`\`\`

---

## Beste praksis

| Praksis | Begrunnelse |
|---------|-------------|
| Bruk topic for fleksibilitet | Kan simulere direct og fanout |
| Navngi exchanges beskrivende | \`ordre-hendelser\`, ikke \`ex1\` |
| Sett opp alternate exchange | Fang opp umatchede meldinger |
| Dokumenter routing-mønster | Vanskelig å debugge uten |

---

## Oppsummering

| Type | Routing | Bruk |
|------|---------|------|
| Direct | Eksakt match | Punkt-til-punkt |
| Topic | Pattern (*/#) | Kategorisert |
| Fanout | Alle | Broadcast |
| Headers | Metadata | Kompleks |
`,

  '05-brukere-og-tilgang': `
# Modul 5: Brukere og tilgang

**Tid:** 15 minutter

---

## Læringsmål

Etter denne modulen skal du kunne:
- Opprette brukere med riktige rettigheter
- Forstå vhosts og isolering
- Sette opp tilgangskontroll for kunder

---

## Autentisering

### Brukertyper

| Type | Bruk | Eksempel |
|------|------|----------|
| **Administrator** | Full tilgang, cluster-admin | \`admin\` |
| **Management** | UI-tilgang, egen vhost | \`kunde-admin\` |
| **Applikasjon** | Kun AMQP, ingen UI | \`ordre-backend\` |

### Opprette bruker (CLI)

\`\`\`bash
# Opprett bruker
rabbitmqctl add_user <brukernavn> <passord>

# Sett tags (roller)
rabbitmqctl set_user_tags <brukernavn> management
\`\`\`

---

## Tags (roller)

| Tag | Tilgang |
|-----|---------|
| (ingen) | Kun AMQP, ingen Management UI |
| \`management\` | UI-tilgang til egne vhosts |
| \`policymaker\` | + kan definere policies |
| \`monitoring\` | + kan se alle vhosts |
| \`administrator\` | Full tilgang |

\`\`\`
administrator
    │
    └── monitoring
            │
            └── policymaker
                    │
                    └── management
                            │
                            └── (ingen tag)
\`\`\`

---

## Permissions

### Tre typer tilgang

| Permission | Betydning |
|------------|-----------|
| **configure** | Opprette/slette køer og exchanges |
| **write** | Publisere meldinger |
| **read** | Konsumere meldinger |

### Eksempler

\`\`\`
# Full tilgang til alt i vhost
configure: ".*"
write: ".*"
read: ".*"

# Kun egne ressurser (anbefalt for kunder)
configure: "^min-app-.*"
write: "^min-app-.*"
read: "^min-app-.*"

# Kun lese fra spesifikk kø
configure: ""
write: ""
read: "^hendelser$"
\`\`\`

---

## Beste praksis

| Praksis | Begrunnelse |
|---------|-------------|
| Én bruker per applikasjon | Sporbarhet |
| Navneprefix per team | Isolering |
| Minst mulig rettigheter | Sikkerhet |
| Separate app/admin brukere | Sikkerhet |
| Aldri bruk guest i prod | Default-passord |

---

## Vanlige feil

### 1. For vide permissions

\`\`\`
❌ configure: ".*" write: ".*" read: ".*"
   (for app-bruker)

✅ configure: "" write: "^min-kø$" read: "^min-kø$"
   (kun det appen trenger)
\`\`\`

### 2. Gjenbruk av brukere

\`\`\`
❌ Samme bruker for 5 applikasjoner
   (umulig å spore problemer)

✅ Én bruker per applikasjon
\`\`\`

### 3. Guest-bruker i prod

\`\`\`
❌ guest / guest (default)

✅ Slett guest-bruker
   rabbitmqctl delete_user guest
\`\`\`

---

## Oppsummering

| Konsept | Funksjon |
|---------|----------|
| Tags | Rolle/UI-tilgang |
| Vhosts | Logisk isolering |
| Permissions | configure/write/read |
| Prefix | Navnekonvensjon for isolering |
`,

  '06-policies-og-konfig': `
# Modul 6: Policies og konfigurasjon

**Tid:** 20 minutter

---

## Læringsmål

Etter denne modulen skal du kunne:
- Forstå forskjellen på user policies og operator policies
- Sette opp policies for TTL, max-length, DLX
- Bruke operator policies for drift-defaults

---

## Hva er policies?

Policies lar deg sette regler på køer/exchanges uten å endre koden.

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        Policy                               │
│                                                             │
│   Pattern: "ordre-.*"                                       │
│   Apply to: queues                                          │
│   Definition:                                               │
│     - max-length: 10000                                     │
│     - message-ttl: 86400000                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              Alle køer som matcher "ordre-.*"
              får disse innstillingene automatisk
\`\`\`

---

## Policy-typer

### User Policy

Settes av brukere. Kan overstyres av operator policy.

\`\`\`bash
rabbitmqctl set_policy min-policy \\
  "^ordre-.*" \\
  '{"max-length": 10000}' \\
  --apply-to queues
\`\`\`

### Operator Policy

Settes av drift. Kombineres med user policy, overstyrer ved konflikt.

\`\`\`bash
rabbitmqctl set_operator_policy drift-defaults \\
  ".*" \\
  '{"max-length": 100000, "message-ttl": 604800000}' \\
  --apply-to queues
\`\`\`

---

## Policy-prioritet

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  Effektiv konfigurasjon = User Policy + Operator Policy     │
│                                                             │
│  Ved konflikt: Den strengeste verdien vinner                │
│                                                             │
│  Eksempel:                                                  │
│    User policy:     max-length: 50000                       │
│    Operator policy: max-length: 100000                      │
│    Effektiv:        max-length: 50000 (strengest)           │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## Viktige policy-parametere

### For køer

| Parameter | Betydning | Eksempel |
|-----------|-----------|----------|
| \`max-length\` | Maks antall meldinger | 100000 |
| \`max-length-bytes\` | Maks størrelse i bytes | 1073741824 (1GB) |
| \`message-ttl\` | Meldinger utløper (ms) | 604800000 (7d) |
| \`overflow\` | Ved full kø | drop-head, reject-publish |
| \`dead-letter-exchange\` | DLX | dlx |
| \`delivery-limit\` | Maks redelivery | 5 |

---

## Overflow-håndtering

\`\`\`
overflow: drop-head
┌─────────────────────────────────────────────────────────────┐
│  Eldste melding droppes, ny kommer inn                      │
│                                                             │
│  ⚠️  Meldinger kan forsvinne uten varsel                    │
│  Bruk: Når nyeste data er viktigst                         │
└─────────────────────────────────────────────────────────────┘

overflow: reject-publish
┌─────────────────────────────────────────────────────────────┐
│  Ny melding avvises, producer får feil                      │
│                                                             │
│  ✅  Ingen tap, producer vet at noe er galt                 │
│  Bruk: Når ingen meldinger skal gå tapt (anbefalt)         │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## Beste praksis

| Praksis | Begrunnelse |
|---------|-------------|
| Operator policy for defaults | Sikkerhetsnett |
| Alltid sett max-length | Forhindre minneproblemer |
| Alltid sett TTL | Forhindre uendelig vekst |
| Alltid sett DLX | Fang feilede meldinger |
| reject-publish overflow | Producer får beskjed |

---

## Oppsummering

| Konsept | Funksjon |
|---------|----------|
| User policy | Bruker-definerte regler |
| Operator policy | Drift-defaults (fallback) |
| max-length | Begrens køstørrelse |
| TTL | Utløpstid for meldinger |
| DLX | Fang feilede meldinger |
| overflow | Håndtering av full kø |
`,

  '07-overvaking-og-feilsoking': `
# Modul 7: Overvåking og feilsøking

**Tid:** 25 minutter

---

## Læringsmål

Etter denne modulen skal du kunne:
- Identifisere viktige metrikker å overvåke
- Diagnostisere vanlige problemer
- Bruke Management UI og CLI for feilsøking

---

## Viktige metrikker

### Cluster-helse

| Metrikk | Kritisk nivå | Betydning |
|---------|--------------|-----------|
| Node status | Rød | Node nede |
| Disk free | < 2x RAM | Publisering stopper |
| Memory | > 60% | Flow control starter |
| File descriptors | > 80% | Connection-problemer |

### Kø-helse

| Metrikk | Varsel | Betydning |
|---------|--------|-----------|
| Queue depth | Vokser | Consumer henger etter |
| Messages ready | Mange | Ikke konsumert |
| Messages unacked | Mange | Consumer treg |
| Consumer count | 0 | Ingen lytter |

---

## CLI-kommandoer

### Cluster-status

\`\`\`bash
# Cluster-oversikt
rabbitmqctl cluster_status

# Node-helse
rabbitmqctl node_health_check

# Minne
rabbitmqctl status | grep memory
\`\`\`

### Kø-status

\`\`\`bash
# List køer med meldingsantall
rabbitmqctl list_queues name messages consumers

# Detaljer om én kø
rabbitmqctl list_queues name messages message_bytes consumers \\
  --formatter pretty_table
\`\`\`

---

## Vanlige problemer

### 1. Køen vokser ukontrollert

**Symptom:** Messages ready øker kontinuerlig

**Mulige årsaker:**
- Consumer nede
- Consumer tregere enn producer
- Consumer-feil (NACK loop)

**Løsning:**
- Start flere consumers
- Øk consumer throughput
- Sjekk consumer-logs for feil

---

### 2. Meldinger forsvinner

**Symptom:** Meldinger aldri mottas

**Mulige årsaker:**
- Feil routing key
- Ingen binding matcher
- TTL utløpt
- Kø full (drop-head)

**Løsning:**
- Sjekk routing key mot bindings
- Sett opp alternate exchange
- Sjekk DLX for utløpte meldinger

---

### 3. Connection refused

**Symptom:** Klient kan ikke koble til

**Mulige årsaker:**
- Node nede
- Port blokkert
- Max connections nådd
- Feil credentials

**Løsning:**
- Start node
- Sjekk brannmur
- Øk connection limit
- Verifiser credentials

---

### 4. Memory alarm

**Symptom:** Publisering stopper, "memory alarm" i log

**Årsak:** Minnebruk over high watermark

**Løsning:**
- Konsumer meldinger
- Purge unødvendige køer
- Øk RAM på noder
- Bruk lazy queues

---

### 5. Disk alarm

**Symptom:** Publisering stopper, "disk alarm" i log

**Årsak:** Disk under grense

**Løsning:**
- Rydd disk
- Konsumer gamle meldinger
- Sett lavere TTL (policy)

---

## Feilsøkings-sjekkliste

\`\`\`
□ Er alle noder oppe?
  rabbitmqctl cluster_status

□ Er det minnealarm?
  rabbitmqctl status | grep alarms

□ Er det diskalarm?
  rabbitmqctl status | grep alarms

□ Har køen consumers?
  rabbitmqctl list_queues name consumers

□ Vokser køen?
  (sjekk over tid)

□ Er det meldinger i DLQ?
  rabbitmqctl list_queues name messages | grep dlq

□ Matcher routing key bindings?
  rabbitmqctl list_bindings
\`\`\`

---

## Oppsummering

| Område | Viktigste metrikk |
|--------|-------------------|
| Cluster | Node status, memory, disk |
| Køer | Depth, consumers, DLQ |
| Meldinger | Ready, unacked, rates |
| Connections | Count, channels |
`,

  '08-produksjonsoppsett': `
# Modul 8: Produksjonsoppsett

**Tid:** 20 minutter

---

## Læringsmål

Etter denne modulen skal du kunne:
- Sette opp et produksjonsklart RabbitMQ-cluster
- Anvende sikkerhetsprinsipper
- Planlegge kapasitet og backup

---

## Cluster-dimensjonering

### Antall noder

| Noder | Feiltoleranse | Bruk |
|-------|---------------|------|
| 1 | Ingen | Kun test |
| 3 | 1 node | Standard prod |
| 5 | 2 noder | Høy tilgjengelighet |
| 7 | 3 noder | Kritiske systemer |

**Regel:** Alltid odde antall for quorum-avstemning.

### Ressurser per node

| Profil | RAM | CPU | Disk |
|--------|-----|-----|------|
| Liten (< 500 msg/s) | 4 GB | 2 | 50 GB SSD |
| Medium (500-5000 msg/s) | 8 GB | 4 | 100 GB SSD |
| Stor (> 5000 msg/s) | 16 GB | 8 | 200 GB SSD |

**Disk-regel:** Minimum 2x RAM for disk_free_limit.

---

## Produksjons-sjekkliste

### 1. Cluster

\`\`\`
□ 3+ noder (odde antall)
□ Noder på separate servere/availability zones
□ Erlang cookie synkronisert
□ Cluster-navn satt
\`\`\`

### 2. Køer

\`\`\`
□ Quorum queues som default
□ Operator policy for max-length, TTL, DLX
□ Dead letter exchange konfigurert
□ Navnekonvensjon dokumentert
\`\`\`

### 3. Sikkerhet

\`\`\`
□ Guest-bruker slettet
□ TLS på alle porter
□ Brannmur konfigurert
□ Permissions med minst mulig rettigheter
\`\`\`

### 4. Overvåking

\`\`\`
□ Prometheus-metrics eksponert
□ Alerting på kritiske metrikker
□ Logging til sentralt system
□ Dashboard for visualisering
\`\`\`

---

## Sikkerhetskonfigurasjon

### TLS Porter

| Port | Protokoll | Tilgang |
|------|-----------|---------|
| 5671 | AMQPS | Applikasjoner |
| 15671 | HTTPS | Admin |
| 25672 | Erlang | Kun cluster |
| 4369 | EPMD | Kun cluster |

### Slett guest-bruker

\`\`\`bash
rabbitmqctl delete_user guest
\`\`\`

---

## Backup og restore

### Eksportere definisjoner

\`\`\`bash
# CLI
rabbitmqctl export_definitions /path/to/backup.json

# API
curl -u admin:pass \\
  "http://localhost:15672/api/definitions" \\
  > backup.json
\`\`\`

### Hva inkluderes i definisjoner?

| Inkludert | Ikke inkludert |
|-----------|----------------|
| Brukere | Meldinger |
| Vhosts | Minnedata |
| Permissions | Runtime-state |
| Køer (struktur) | |
| Exchanges | |
| Bindings | |
| Policies | |

---

## High Availability

### Quorum queues

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Quorum Queue                             │
│                                                             │
│   Node 1 (leader)    Node 2           Node 3               │
│   ┌─────────────┐    ┌─────────────┐  ┌─────────────┐      │
│   │   Data      │ ◄─►│   Data      │◄─►│   Data      │      │
│   │   Log       │    │   Log       │   │   Log       │      │
│   └─────────────┘    └─────────────┘   └─────────────┘      │
│                                                             │
│   Ved feil på Node 1:                                       │
│   - Node 2 eller 3 blir ny leader                          │
│   - Ingen meldingstap                                       │
│   - Automatisk failover                                     │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## Oppgraderinger

### Rolling upgrade

\`\`\`
1. Ta ut node 1 av cluster
2. Oppgrader node 1
3. Legg node 1 tilbake
4. Vent på synkronisering
5. Gjenta for node 2, 3...
\`\`\`

### Versjonskrav

\`\`\`
✅ Oppgrader én minor-versjon om gangen
   3.12 → 3.13 → 3.14

❌ Hopp ikke over versjoner
   3.12 → 3.14 (kan feile)
\`\`\`

---

## Beste praksis oppsummert

| Område | Best practice |
|--------|---------------|
| **Cluster** | 3+ noder, separate AZ |
| **Køer** | Quorum som default |
| **Sikkerhet** | TLS, slett guest, minst rettigheter |
| **Policies** | Operator policy for defaults |
| **Overvåking** | Prometheus + Grafana + alerts |
| **Backup** | Daglig definisjon-eksport |
| **Oppgradering** | Rolling, én versjon om gangen |

---

## Gratulerer!

Du har fullført RabbitMQ opplæringskurset! 🎉

Du har lært:
1. **Grunnleggende** - Hva RabbitMQ er og når det brukes
2. **Arkitektur** - Exchanges, queues, bindings, vhosts
3. **Køer** - Quorum vs classic, ACK, DLX
4. **Routing** - Direct, topic, fanout
5. **Brukere** - Permissions, tags, isolering
6. **Policies** - User vs operator, defaults
7. **Overvåking** - Metrikker, feilsøking
8. **Produksjon** - Cluster, sikkerhet, backup
`
}

export function getModuleContent(slug: string): string | null {
  return moduleContent[slug] || null
}

export function getModuleBySlug(slug: string) {
  return MODULES.find(m => m.slug === slug)
}
