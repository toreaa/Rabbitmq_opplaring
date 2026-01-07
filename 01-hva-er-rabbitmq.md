# Modul 1: Hva er RabbitMQ?
#type/opplæring #område/meldingskø

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

```
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
```

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

```
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
```

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

---

## Øvelse

1. Åpne Management UI: http://localhost:15672
2. Se på Overview-fanen
3. Finn antall køer, meldinger og connections
4. Klikk på en kø og se meldingene

---

**Neste:** [[02-arkitektur|Modul 2: Arkitektur]]
