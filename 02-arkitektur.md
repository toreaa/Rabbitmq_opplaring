# Modul 2: Arkitektur
#type/opplæring #område/meldingskø

**Tid:** 20 minutter

---

## Læringsmål

Etter denne modulen skal du kunne:
- Tegne opp RabbitMQ-arkitekturen
- Forklare hva hver komponent gjør
- Forstå hvordan meldinger flyter gjennom systemet

---

## Oversikt

```
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
```

---

## Komponenter

### 1. Broker (Node)

Selve RabbitMQ-serveren. Kan kjøre alene eller i cluster.

```
Enkelt-node:                    Cluster (anbefalt for prod):
┌──────────┐                    ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Node 1  │                    │  Node 1  │ │  Node 2  │ │  Node 3  │
└──────────┘                    └──────────┘ └──────────┘ └──────────┘
                                      └───────────┴───────────┘
                                              Cluster
```

**Viktig:** Alltid odde antall noder (3, 5, 7) for quorum-avstemning.

---

### 2. Virtual Host (vhost)

Logisk isolering innenfor én broker. Tenk på det som separate "databaser".

```
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
```

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

```
Direct:     ordre.opprettet  →  kø-ordre (eksakt match)

Topic:      ordre.*          →  kø-ordre (pattern)
            ordre.#          →  kø-alle-ordre (wildcard)

Fanout:     (alle)           →  kø-1, kø-2, kø-3 (broadcast)
```

---

### 4. Queue

Lagrer meldinger til de er prosessert.

```
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
```

**Queue-typer (kritisk valg!):**

| Type | Holdbarhet | Ytelse | Bruk |
|------|------------|--------|------|
| **Classic** | Enkelt-node | Høy | Kun hvis ytelse > pålitelighet |
| **Quorum** | Replikert | Moderat | **Standard for produksjon** |
| **Stream** | Log-basert | Høy | Replay, mange konsumenter |

---

### 5. Binding

Kobler exchange til kø med regler.

```
Exchange ──── routing_key: "ordre.*" ────► Queue

Binding sier: "Meldinger som matcher dette mønsteret,
               send til denne køen"
```

---

### 6. Connection og Channel

```
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
```

- **Connection:** TCP-forbindelse (tungt å opprette)
- **Channel:** Lett multipleksing innenfor connection

**Best practice:** Én connection per applikasjon, én channel per tråd.

---

## Meldingsflyt

```
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
```

---

## Cluster-arkitektur

```
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
```

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

---

## Øvelse

1. Gå til Management UI → Exchanges
2. Finn `amq.direct`, `amq.topic`, `amq.fanout`
3. Se på bindings for en exchange
4. Gå til Queues og se på queue-detaljer

---

**Neste:** [[03-koer-og-meldinger|Modul 3: Køer og meldinger]]
