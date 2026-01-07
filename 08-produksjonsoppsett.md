# Modul 8: Produksjonsoppsett
#type/opplæring #område/meldingskø

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

```
□ 3+ noder (odde antall)
□ Noder på separate servere/availability zones
□ Erlang cookie synkronisert
□ Cluster-navn satt
```

### 2. Køer

```
□ Quorum queues som default
□ Operator policy for max-length, TTL, DLX
□ Dead letter exchange konfigurert
□ Navnekonvensjon dokumentert
```

### 3. Sikkerhet

```
□ Guest-bruker slettet
□ TLS på alle porter
□ Brannmur konfigurert
□ Permissions med minst mulig rettigheter
```

### 4. Overvåking

```
□ Prometheus-metrics eksponert
□ Alerting på kritiske metrikker
□ Logging til sentralt system
□ Dashboard for visualisering
```

### 5. Backup

```
□ Definisjon-backup (køer, exchanges, bindings)
□ Backup-rutine testet
□ Restore-rutine testet
```

---

## Sikkerhetskonfigurasjon

### TLS

```ini
# rabbitmq.conf

# AMQP med TLS
listeners.ssl.default = 5671
ssl_options.cacertfile = /path/to/ca.pem
ssl_options.certfile = /path/to/server.pem
ssl_options.keyfile = /path/to/server-key.pem
ssl_options.verify = verify_peer
ssl_options.fail_if_no_peer_cert = true

# Management med TLS
management.ssl.port = 15671
management.ssl.cacertfile = /path/to/ca.pem
management.ssl.certfile = /path/to/server.pem
management.ssl.keyfile = /path/to/server-key.pem

# Deaktiver ukrypterte porter
listeners.tcp = none
management.tcp.port = none
```

### Brannmur

| Port | Protokoll | Tilgang |
|------|-----------|---------|
| 5671 | AMQPS | Applikasjoner |
| 15671 | HTTPS | Admin |
| 25672 | Erlang | Kun cluster |
| 4369 | EPMD | Kun cluster |

### Slett guest-bruker

```bash
rabbitmqctl delete_user guest
```

---

## Kubernetes-oppsett

### RabbitMQ Cluster Operator

```yaml
apiVersion: rabbitmq.com/v1beta1
kind: RabbitmqCluster
metadata:
  name: prod-rabbit
spec:
  replicas: 3

  resources:
    requests:
      memory: 4Gi
      cpu: 2
    limits:
      memory: 4Gi
      cpu: 2

  persistence:
    storage: 50Gi
    storageClassName: fast-ssd

  rabbitmq:
    additionalConfig: |
      vm_memory_high_watermark.relative = 0.6
      disk_free_limit.absolute = 2GB
      channel_max = 128

  tls:
    secretName: rabbitmq-tls
    caSecretName: rabbitmq-ca
```

### Operator Policies via CRD

```yaml
apiVersion: rabbitmq.com/v1beta1
kind: OperatorPolicy
metadata:
  name: drift-defaults
spec:
  name: drift-defaults
  pattern: ".*"
  applyTo: queues
  priority: 0
  definition:
    max-length: 100000
    message-ttl: 604800000
    overflow: reject-publish
    dead-letter-exchange: dlx
  rabbitmqClusterReference:
    name: prod-rabbit
```

---

## Backup og restore

### Eksportere definisjoner

```bash
# CLI
rabbitmqctl export_definitions /path/to/backup.json

# API
curl -u admin:pass \
  "http://localhost:15672/api/definitions" \
  > backup.json
```

### Importere definisjoner

```bash
# CLI
rabbitmqctl import_definitions /path/to/backup.json

# API
curl -u admin:pass -X POST \
  "http://localhost:15672/api/definitions" \
  -H "Content-Type: application/json" \
  -d @backup.json
```

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

```
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
```

### Klient-konfigurasjon

```
# Connection string med flere noder
amqp://user:pass@node1:5672,node2:5672,node3:5672/vhost

# Klienten prøver neste node ved feil
```

---

## Kapasitetsplanlegging

### Beregn meldingsvolum

```
Meldinger per dag = Produsenter × Meldinger/time × Timer

Eksempel:
  10 produsenter × 1000 msg/time × 24 timer = 240.000 msg/dag
```

### Beregn lagringsbehov

```
Lagring = Meldinger × Gjennomsnittsstørrelse × Retensjonstid

Eksempel:
  240.000 msg × 1 KB × 7 dager = 1.68 GB

  + Buffer for peaks = 2x
  + Quorum replikering = 3x

  Total: ~10 GB per kø
```

### Beregn minne

```
Minne = Aktive meldinger × Størrelse × Overhead

Tommelfingerregel:
  1 million meldinger à 1 KB ≈ 2-4 GB RAM
```

---

## Oppgraderinger

### Rolling upgrade

```
1. Ta ut node 1 av cluster
2. Oppgrader node 1
3. Legg node 1 tilbake
4. Vent på synkronisering
5. Gjenta for node 2, 3...
```

### Versjonskrav

```
✅ Oppgrader én minor-versjon om gangen
   3.12 → 3.13 → 3.14

❌ Hopp ikke over versjoner
   3.12 → 3.14 (kan feile)
```

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

## Oppsummering av hele kurset

### Du har lært:

1. **Grunnleggende** - Hva RabbitMQ er og når det brukes
2. **Arkitektur** - Exchanges, queues, bindings, vhosts
3. **Køer** - Quorum vs classic, ACK, DLX
4. **Routing** - Direct, topic, fanout
5. **Brukere** - Permissions, tags, isolering
6. **Policies** - User vs operator, defaults
7. **Overvåking** - Metrikker, feilsøking
8. **Produksjon** - Cluster, sikkerhet, backup

### Kritiske valg å huske:

```
✅ Quorum queues
✅ Manual ACK
✅ Operator policies
✅ DLX
✅ TLS
✅ Overvåking
```

---

## Videre ressurser

- [[../sammendrag|RabbitMQ Sammendrag]]
- [[../drift-sikkerhet|Drift-sikkerhet]]
- [[../kunde-selvbetjening|Kunde-selvbetjening]]
- [RabbitMQ dokumentasjon](https://www.rabbitmq.com/docs)
- [RabbitMQ Best Practices](https://www.rabbitmq.com/docs/production-checklist)

---

**Gratulerer!** Du har fullført opplæringspakken.
