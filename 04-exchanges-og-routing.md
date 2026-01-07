# Modul 4: Exchanges og routing
#type/opplæring #område/meldingskø

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

```
Producer: routing_key = "ordre.opprettet"

Exchange (direct)
    │
    ├── Binding: "ordre.opprettet" → kø-ordre ✅ (match)
    ├── Binding: "ordre.kansellert" → kø-kansellering ❌
    └── Binding: "betaling.mottatt" → kø-betaling ❌
```

**Bruk:** Punkt-til-punkt, spesifikke hendelser.

---

### Topic Exchange

Pattern matching med wildcards.

```
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
```

**Bruk:** Kategorisert routing, fleksible mønstre.

---

### Fanout Exchange

Ignorer routing key, send til alle bindinger.

```
Producer: routing_key = (ignorert)

Exchange (fanout)
    │
    ├── Binding → kø-1 ✅
    ├── Binding → kø-2 ✅
    └── Binding → kø-3 ✅
```

**Bruk:** Broadcast, pub/sub.

---

### Headers Exchange

Match på headers i stedet for routing key.

```
Producer: headers = {type: "ordre", region: "norge"}

Exchange (headers)
    │
    ├── Binding: {type: "ordre"}              → kø-ordre ✅
    ├── Binding: {type: "ordre", x-match: all}→ kø-ordre ✅
    └── Binding: {region: "sverige"}          → kø-sverige ❌
```

**Bruk:** Kompleks routing basert på metadata.

---

## Valg av exchange-type

```
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
```

---

## Default Exchange

Det finnes en innebygd "default exchange" (tom streng).

```
Producer: exchange = "", routing_key = "min-kø"

Meldingen går direkte til køen "min-kø"
(forutsatt at køen finnes)
```

**Bruk:** Enkel testing, direkte kø-sending.

---

## Bindings

### Opprette binding

```
Exchange ──── routing_key/pattern ────► Queue

Eksempel:
  exchange: "hendelser"
  queue: "ordre-service"
  routing_key: "ordre.*"
```

### Flere bindings

En kø kan ha flere bindings:

```
Exchange: hendelser
    │
    ├── "ordre.*"    ────┐
    ├── "betaling.*" ────┼──► kø: ordre-service
    └── "faktura.*"  ────┘
```

---

## Routing-mønstre

### 1. Work Queue (lastfordeling)

```
Producer → Exchange → Queue → Consumer 1
                          └─→ Consumer 2
                          └─→ Consumer 3

Meldinger fordeles round-robin mellom consumers.
```

### 2. Publish/Subscribe

```
Producer → Exchange (fanout) → Queue 1 → Consumer A
                           └─→ Queue 2 → Consumer B
                           └─→ Queue 3 → Consumer C

Alle consumers får alle meldinger.
```

### 3. Topic-basert routing

```
Producer: "ordre.opprettet.oslo"
    │
    ▼
Exchange (topic)
    │
    ├── "ordre.#"        → Ordre-service (alle ordre)
    ├── "*.opprettet.*"  → Notifikasjon-service (alle opprettet)
    └── "*.*.oslo"       → Oslo-dashboard (alt fra oslo)
```

---

## Alternate Exchange

Hvis ingen binding matcher, send til alternate exchange.

```
Exchange: primær
    │
    ├── Binding: "ordre.*" → kø-ordre
    │
    └── Ingen match? → Alternate Exchange → kø-ukjent
```

**Konfigurasjon:**
```
arguments: {
  "alternate-exchange": "ukjent-meldinger"
}
```

---

## Dead Letter Exchange (repetisjon)

Feilede meldinger sendes til DLX.

```
Queue ──── feil ────► DLX ────► Dead Letter Queue

Feil inkluderer:
- NACK/REJECT
- TTL utløpt
- Max-length overskredet
- Delivery-limit nådd
```

---

## Beste praksis

| Praksis | Begrunnelse |
|---------|-------------|
| Bruk topic for fleksibilitet | Kan simulere direct og fanout |
| Navngi exchanges beskrivende | `ordre-hendelser`, ikke `ex1` |
| Sett opp alternate exchange | Fang opp umatchede meldinger |
| Dokumenter routing-mønster | Vanskelig å debugge uten |

---

## Vanlige feil

### 1. Melding forsvinner

```
❌ Årsak: Ingen binding matcher
✅ Løsning: Alternate exchange + overvåking
```

### 2. Feil exchange-type

```
❌ Topic exchange med eksakt key = Unødvendig overhead
✅ Bruk direct hvis du ikke trenger wildcards
```

### 3. For kompleks routing

```
❌ 50 bindings med kryptiske patterns
✅ Forenkling: Færre exchanges, tydeligere ansvar
```

---

## Oppsummering

| Type | Routing | Bruk |
|------|---------|------|
| Direct | Eksakt match | Punkt-til-punkt |
| Topic | Pattern (*/#) | Kategorisert |
| Fanout | Alle | Broadcast |
| Headers | Metadata | Kompleks |

---

## Øvelse

1. Opprett en topic exchange "test-events"

2. Opprett to køer:
   - "alle-ordre" med binding "ordre.#"
   - "opprettet" med binding "*.opprettet"

3. Publiser meldinger med:
   - routing_key = "ordre.opprettet"
   - routing_key = "ordre.kansellert"
   - routing_key = "betaling.opprettet"

4. Sjekk hvilke køer som mottok hvilke meldinger

---

**Neste:** [[05-brukere-og-tilgang|Modul 5: Brukere og tilgang]]
