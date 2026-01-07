# Modul 6: Policies og konfigurasjon
#type/opplæring #område/meldingskø

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

```
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
```

---

## Policy-typer

### User Policy

Settes av brukere. Kan overstyres av operator policy.

```bash
rabbitmqctl set_policy min-policy \
  "^ordre-.*" \
  '{"max-length": 10000}' \
  --apply-to queues
```

### Operator Policy

Settes av drift. Kombineres med user policy, overstyrer ved konflikt.

```bash
rabbitmqctl set_operator_policy drift-defaults \
  ".*" \
  '{"max-length": 100000, "message-ttl": 604800000}' \
  --apply-to queues
```

---

## Policy-prioritet

```
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
```

---

## Viktige policy-parametere

### For køer

| Parameter | Betydning | Eksempel |
|-----------|-----------|----------|
| `max-length` | Maks antall meldinger | 100000 |
| `max-length-bytes` | Maks størrelse i bytes | 1073741824 (1GB) |
| `message-ttl` | Meldinger utløper (ms) | 604800000 (7d) |
| `overflow` | Ved full kø | drop-head, reject-publish |
| `dead-letter-exchange` | DLX | dlx |
| `dead-letter-routing-key` | Routing key til DLX | original |
| `delivery-limit` | Maks redelivery | 5 |
| `queue-mode` | lazy = på disk | lazy, default |

### For exchanges

| Parameter | Betydning | Eksempel |
|-----------|-----------|----------|
| `alternate-exchange` | Fallback exchange | unrouted |

---

## Overflow-håndtering

Hva skjer når køen er full?

```
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
```

---

## Dead Letter Exchange (DLX)

### Konfigurasjon

```bash
# Via policy
rabbitmqctl set_policy dlx-policy \
  ".*" \
  '{"dead-letter-exchange": "dlx"}' \
  --apply-to queues
```

### Når sendes meldinger til DLX?

| Årsak | Beskrivelse |
|-------|-------------|
| NACK/REJECT | Consumer avviser melding |
| TTL utløpt | Melding for gammel |
| Max-length | Kø full (med drop-head) |
| Delivery-limit | For mange redeliveries |

### DLX-oppsett

```
1. Opprett DLX exchange (fanout)
2. Opprett dead-letter kø
3. Bind køen til DLX
4. Sett policy på alle køer: dead-letter-exchange: dlx
```

---

## Operator Policies for drift

### Formål

Sette fallback-verdier som gjelder selv om kunden ikke har satt noe.

```
┌─────────────────────────────────────────────────────────────┐
│  OPERATOR POLICY: drift-defaults                            │
│                                                             │
│  Pattern: ".*"                                              │
│  Priority: 0 (lav)                                          │
│                                                             │
│  Definition:                                                │
│    max-length: 100000         (fallback)                    │
│    message-ttl: 604800000     (7 dager)                     │
│    overflow: reject-publish                                 │
│    dead-letter-exchange: dlx                                │
│                                                             │
│  Hvis kunde setter strengere verdi, vinner den.             │
└─────────────────────────────────────────────────────────────┘
```

### Eksempel

```bash
rabbitmqctl set_operator_policy drift-defaults \
  ".*" \
  '{
    "max-length": 100000,
    "message-ttl": 604800000,
    "overflow": "reject-publish",
    "dead-letter-exchange": "dlx"
  }' \
  --priority 0 \
  --apply-to queues
```

---

## Cluster-konfigurasjon

### rabbitmq.conf

```ini
# Minnegrense (når flow control starter)
vm_memory_high_watermark.relative = 0.6

# Diskgrense (når publisering stoppes)
disk_free_limit.absolute = 2GB

# Maks connections
# (per node)
# Ikke direkte konfigurerbart, men kan begrenses per vhost

# Maks channels per connection
channel_max = 128
```

### Viktige parametere

| Parameter | Default | Anbefaling |
|-----------|---------|------------|
| `vm_memory_high_watermark` | 0.4 | 0.6 |
| `disk_free_limit` | 50MB | 2x RAM |
| `channel_max` | 2047 | 128 |

---

## Limits per vhost

```bash
# Maks connections
rabbitmqctl set_vhost_limits -p /kunde-a \
  '{"max-connections": 100}'

# Maks køer
rabbitmqctl set_vhost_limits -p /kunde-a \
  '{"max-queues": 50}'
```

⚠️ **Merk:** Det finnes IKKE limits for minne/CPU per vhost!

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

## Eksempel: Komplett policy-oppsett

```bash
# 1. Operator policy (drift-defaults)
rabbitmqctl set_operator_policy drift-defaults \
  ".*" \
  '{
    "max-length": 100000,
    "message-ttl": 604800000,
    "overflow": "reject-publish",
    "dead-letter-exchange": "dlx",
    "delivery-limit": 5
  }' \
  --priority 0 \
  --apply-to queues

# 2. User policy for spesifikk kunde
rabbitmqctl set_policy ordre-policy \
  "^ordre-.*" \
  '{
    "max-length": 50000,
    "message-ttl": 86400000
  }' \
  --priority 10 \
  --apply-to queues
```

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

---

## Øvelse

1. Opprett en operator policy "test-defaults" med:
   - max-length: 1000
   - message-ttl: 60000 (1 min)

2. Opprett en kø "test-policy-kø"

3. Publiser 10 meldinger

4. Vent 1 minutt - hva skjer med meldingene?

5. Fyll køen til max-length - hva skjer med nye meldinger?

---

**Neste:** [[07-overvaking-og-feilsoking|Modul 7: Overvåking og feilsøking]]
