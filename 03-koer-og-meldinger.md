# Modul 3: Køer og meldinger
#type/opplæring #område/meldingskø

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

```
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
```

| Egenskap | Verdi |
|----------|-------|
| Replikering | Nei (kun på én node) |
| Feiltoleranse | Ingen |
| Ytelse | Høy |
| Bruk | **Kun** der tap er akseptabelt |

### Quorum Queue (anbefalt)

```
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
```

| Egenskap | Verdi |
|----------|-------|
| Replikering | Ja (alle noder) |
| Feiltoleranse | Tåler minoritet nede |
| Ytelse | Moderat |
| Bruk | **Standard for produksjon** |

### Stream Queue

```
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
```

| Egenskap | Verdi |
|----------|-------|
| Meldinger etter levering | Beholdes |
| Replay | Ja |
| Bruk | Logging, event sourcing |

---

## Valg av queue-type

```
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
```

---

## Meldingslivssyklus

```
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
```

---

## Acknowledgments (ACK)

**Kritisk for å unngå meldingstap!**

### Auto-ACK (farlig)

```
Consumer mottar melding → Melding slettes umiddelbart

⚠️  Hvis consumer krasjer under prosessering = MELDINGSTAP
```

### Manual ACK (anbefalt)

```
Consumer mottar melding → Prosesserer → Sender ACK → Melding slettes

✅  Hvis consumer krasjer = Melding redeliveres til annen consumer
```

### NACK og Reject

| Handling | Effekt |
|----------|--------|
| `ACK` | Melding prosessert OK, slett |
| `NACK` | Melding feilet, requeue eller DLX |
| `REJECT` | Avvis melding, ikke requeue |

---

## Kø-egenskaper

### Durable vs Transient

```
Durable (anbefalt):
┌─────────────────────────────────────────────────────────────┐
│  Kø-definisjon lagres på disk                               │
│  Overlever restart av RabbitMQ                              │
└─────────────────────────────────────────────────────────────┘

Transient:
┌─────────────────────────────────────────────────────────────┐
│  Kø forsvinner ved restart                                  │
│  Kun for midlertidige køer                                  │
└─────────────────────────────────────────────────────────────┘
```

### Persistent meldinger

```
Meldinger KAN være transient selv om køen er durable!

Producer må sette: delivery_mode = 2 (persistent)

Durable kø + Persistent melding = Overlever restart ✅
Durable kø + Transient melding = Melding tapt ved restart ⚠️
```

---

## Viktige kø-parametere

| Parameter | Betydning | Anbefaling |
|-----------|-----------|------------|
| `x-queue-type` | classic/quorum/stream | `quorum` |
| `x-max-length` | Maks antall meldinger | Sett alltid |
| `x-message-ttl` | Meldinger utløper | Sett alltid |
| `x-overflow` | Hva skjer ved full kø | `reject-publish` |
| `x-dead-letter-exchange` | Hvor feilede går | Sett alltid |
| `x-delivery-limit` | Maks redelivery | 5 |

---

## Dead Letter Exchange (DLX)

Meldinger som feiler sendes til DLX i stedet for å forsvinne.

```
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
```

**Alltid sett opp DLX!** Ellers forsvinner feilede meldinger.

---

## Vanlige feil

### 1. Meldingstap ved crash

```
❌ FEIL:
- Auto-ACK
- Classic queue
- Transient meldinger

✅ RIKTIG:
- Manual ACK
- Quorum queue
- Persistent meldinger (delivery_mode=2)
```

### 2. Køen vokser ukontrollert

```
❌ FEIL:
- Ingen max-length
- Ingen TTL
- Ingen DLX

✅ RIKTIG:
- x-max-length: 100000
- x-message-ttl: 604800000 (7 dager)
- x-dead-letter-exchange: dlx
```

### 3. Infinite redelivery loop

```
❌ FEIL:
- Consumer feiler alltid
- NACK med requeue
- Ingen delivery-limit

✅ RIKTIG:
- x-delivery-limit: 5
- DLX for feilede meldinger
- Overvåk DL queue
```

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

---

## Øvelse

1. Opprett en ny kø i Management UI med:
   - Type: quorum
   - Max-length: 1000
   - TTL: 1 time (3600000 ms)

2. Publiser 5 meldinger til køen

3. Se på kø-detaljene:
   - Messages ready
   - Messages unacked

4. Hent en melding med "Get messages" (Ack mode: Manual)

---

**Neste:** [[04-exchanges-og-routing|Modul 4: Exchanges og routing]]
