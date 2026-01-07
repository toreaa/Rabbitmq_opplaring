# Modul 7: Overvåking og feilsøking
#type/opplæring #område/meldingskø

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

### Meldingsrate

| Metrikk | Betydning |
|---------|-----------|
| Publish rate | Meldinger inn per sekund |
| Deliver rate | Meldinger ut per sekund |
| Ack rate | Bekreftelser per sekund |

---

## Management UI for overvåking

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Overview                                                   │
│                                                             │
│  Nodes:        3/3 running ✅                               │
│  Queues:       15                                           │
│  Connections:  42                                           │
│  Channels:     84                                           │
│                                                             │
│  Message rates:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Publish: 150/s  Deliver: 145/s  Ack: 145/s        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Queues-fanen

```
┌─────────────────────────────────────────────────────────────┐
│  Name          State    Ready   Unacked   Total   Incoming │
│  ─────────────────────────────────────────────────────────  │
│  ordre-in      running  1523    12        1535    150/s    │
│  ordre-dlq     running  89      0         89      2/s  ⚠️  │
│  betaling-in   idle     0       0         0       0/s      │
└─────────────────────────────────────────────────────────────┘

⚠️  DLQ med meldinger = noe feiler
```

---

## CLI-kommandoer

### Cluster-status

```bash
# Cluster-oversikt
rabbitmqctl cluster_status

# Node-helse
rabbitmqctl node_health_check

# Minne
rabbitmqctl status | grep memory
```

### Kø-status

```bash
# List køer med meldingsantall
rabbitmqctl list_queues name messages consumers

# Detaljer om én kø
rabbitmqctl list_queues name messages message_bytes consumers \
  --formatter pretty_table
```

### Connection-status

```bash
# Aktive connections
rabbitmqctl list_connections user vhost client_properties

# Channels
rabbitmqctl list_channels connection consumer_count messages_unacknowledged
```

---

## Prometheus-metrikker

### Aktivere prometheus plugin

```bash
rabbitmq-plugins enable rabbitmq_prometheus
```

### Viktige metrikker

```prometheus
# Kø-dybde
rabbitmq_queue_messages{queue="ordre-in"} 1523

# Minne
rabbitmq_process_resident_memory_bytes 524288000

# Disk
rabbitmq_disk_space_available_bytes 10737418240

# Connections
rabbitmq_connections_opened_total 1000
```

### Alerts (eksempler)

```yaml
# Kø vokser
- alert: QueueGrowing
  expr: rate(rabbitmq_queue_messages[5m]) > 100
  for: 10m
  annotations:
    summary: "Kø {{ $labels.queue }} vokser raskt"

# Høy minne
- alert: HighMemory
  expr: rabbitmq_process_resident_memory_bytes > 1e9
  for: 5m
  annotations:
    summary: "RabbitMQ bruker mye minne"

# DLQ har meldinger
- alert: DeadLetterMessages
  expr: rabbitmq_queue_messages{queue=~".*dlq.*"} > 0
  for: 5m
  annotations:
    summary: "Meldinger i dead letter queue"
```

---

## Vanlige problemer

### 1. Køen vokser ukontrollert

**Symptom:** Messages ready øker kontinuerlig

**Mulige årsaker:**
- Consumer nede
- Consumer tregere enn producer
- Consumer-feil (NACK loop)

**Diagnostikk:**
```bash
# Sjekk consumers
rabbitmqctl list_queues name consumers

# Sjekk consumer rate
# (Management UI → Queue → Message rates)
```

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

**Diagnostikk:**
```bash
# Sjekk bindings
rabbitmqctl list_bindings

# Sjekk alternate exchange
# (Management UI → Exchange → Details)

# Sjekk policy TTL
rabbitmqctl list_policies
```

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

**Diagnostikk:**
```bash
# Node-status
rabbitmqctl status

# Connections
rabbitmqctl list_connections

# Vhost limits
rabbitmqctl list_vhost_limits
```

**Løsning:**
- Start node
- Sjekk brannmur
- Øk connection limit
- Verifiser credentials

---

### 4. Memory alarm

**Symptom:** Publisering stopper, "memory alarm" i log

**Årsak:** Minnebruk over high watermark

**Diagnostikk:**
```bash
# Minnestatus
rabbitmqctl status | grep memory

# Køer sortert på minne
rabbitmqctl list_queues name memory --sort-by memory
```

**Løsning:**
- Konsumer meldinger
- Purge unødvendige køer
- Øk RAM på noder
- Bruk lazy queues (disk i stedet for minne)

---

### 5. Disk alarm

**Symptom:** Publisering stopper, "disk alarm" i log

**Årsak:** Disk under grense

**Diagnostikk:**
```bash
# Disk-status
rabbitmqctl status | grep disk

# Største køer
rabbitmqctl list_queues name messages_persistent_bytes --sort-by messages_persistent_bytes
```

**Løsning:**
- Rydd disk
- Konsumer gamle meldinger
- Sett lavere TTL (policy)

---

## Feilsøkings-sjekkliste

```
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
```

---

## Oppsummering

| Område | Viktigste metrikk |
|--------|-------------------|
| Cluster | Node status, memory, disk |
| Køer | Depth, consumers, DLQ |
| Meldinger | Ready, unacked, rates |
| Connections | Count, channels |

---

## Øvelse

1. Gå til Management UI → Overview
   - Hva er minnebruken?
   - Hvor mye disk er ledig?

2. Gå til Queues
   - Finn køen med flest meldinger
   - Har den consumers?

3. Kjør i terminal:
   ```bash
   rabbitmqctl list_queues name messages consumers
   ```

4. Simuler et problem:
   - Stopp consumers
   - Publiser meldinger
   - Observer køvekst

---

**Neste:** [[08-produksjonsoppsett|Modul 8: Produksjonsoppsett]]
