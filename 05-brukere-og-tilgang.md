# Modul 5: Brukere og tilgang
#type/opplæring #område/meldingskø

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
| **Administrator** | Full tilgang, cluster-admin | `admin` |
| **Management** | UI-tilgang, egen vhost | `kunde-admin` |
| **Applikasjon** | Kun AMQP, ingen UI | `ordre-backend` |

### Opprette bruker (CLI)

```bash
# Opprett bruker
rabbitmqctl add_user <brukernavn> <passord>

# Sett tags (roller)
rabbitmqctl set_user_tags <brukernavn> management
```

### Opprette bruker (API)

```bash
curl -u admin:pass -X PUT \
  "http://localhost:15672/api/users/ny-bruker" \
  -H "Content-Type: application/json" \
  -d '{"password": "passord123", "tags": "management"}'
```

---

## Tags (roller)

| Tag | Tilgang |
|-----|---------|
| (ingen) | Kun AMQP, ingen Management UI |
| `management` | UI-tilgang til egne vhosts |
| `policymaker` | + kan definere policies |
| `monitoring` | + kan se alle vhosts |
| `administrator` | Full tilgang |

```
administrator
    │
    └── monitoring
            │
            └── policymaker
                    │
                    └── management
                            │
                            └── (ingen tag)
```

---

## Virtual Hosts (vhosts)

### Hva er en vhost?

Logisk isolering av ressurser:

```
┌─────────────────────────────────────────────────────────────┐
│                       RabbitMQ                              │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   vhost: /      │  │ vhost: /kunde-a │                  │
│  │                 │  │                 │                  │
│  │ - køer         │  │ - køer         │                  │
│  │ - exchanges    │  │ - exchanges    │                  │
│  │ - bindings     │  │ - bindings     │                  │
│  │ - brukere      │  │ - brukere      │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ⚠️  Deler: minne, CPU, disk, connections                  │
└─────────────────────────────────────────────────────────────┘
```

### Opprette vhost

```bash
# CLI
rabbitmqctl add_vhost /kunde-a

# API
curl -u admin:pass -X PUT \
  "http://localhost:15672/api/vhosts/%2Fkunde-a"
```

---

## Permissions

### Tre typer tilgang

| Permission | Betydning |
|------------|-----------|
| **configure** | Opprette/slette køer og exchanges |
| **write** | Publisere meldinger |
| **read** | Konsumere meldinger |

### Sette permissions

```bash
# CLI
rabbitmqctl set_permissions -p /kunde-a \
  bruker "^kunde-a-.*" "^kunde-a-.*" "^kunde-a-.*"

# Regex betyr: kun ressurser som starter med "kunde-a-"
```

### Eksempler

```
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
```

---

## Tilgangsmodell for NHN

### Ansvarsfordeling

```
┌─────────────────────────────────────────────────────────────┐
│  NHN (administrator)                                        │
│  - Oppretter vhosts                                         │
│  - Oppretter kunde-admin brukere                            │
│  - Setter operator policies                                 │
│  - Overvåker cluster                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Kunde (management)                                         │
│  - Oppretter køer/exchanges (med prefix)                    │
│  - Oppretter app-brukere (med prefix)                       │
│  - Ser egne metrikker                                       │
│  - Kan IKKE se andre kunder                                 │
└─────────────────────────────────────────────────────────────┘
```

### Navnekonvensjon

```
Brukere:    <team>-<appnavn>
            ordre-backend
            ordre-worker
            varsling-sender

Køer:       <team>-<formål>
            ordre-bestillinger
            ordre-dlq
            varsling-hendelser
```

### Permissions med prefix

```bash
# Kunde "ordre" får kun tilgang til egne ressurser
rabbitmqctl set_permissions -p / ordre-admin \
  "^ordre-.*" "^ordre-.*" "^ordre-.*"
```

---

## Connection limits

Begrens antall connections per bruker/vhost:

```bash
# Per vhost
rabbitmqctl set_vhost_limits -p /kunde-a \
  '{"max-connections": 100}'

# Per bruker
# (ikke innebygd - må håndteres i applikasjon)
```

---

## TLS/SSL

For produksjon, krypter trafikk:

```
┌──────────┐          TLS          ┌──────────┐
│  Client  │ ◄────────────────────► │ RabbitMQ │
└──────────┘                        └──────────┘

Port 5671 = AMQPS (kryptert)
Port 5672 = AMQP (ukryptert)
```

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

```
❌ configure: ".*" write: ".*" read: ".*"
   (for app-bruker)

✅ configure: "" write: "^min-kø$" read: "^min-kø$"
   (kun det appen trenger)
```

### 2. Gjenbruk av brukere

```
❌ Samme bruker for 5 applikasjoner
   (umulig å spore problemer)

✅ Én bruker per applikasjon
```

### 3. Guest-bruker i prod

```
❌ guest / guest (default)

✅ Slett guest-bruker
   rabbitmqctl delete_user guest
```

---

## Oppsummering

| Konsept | Funksjon |
|---------|----------|
| Tags | Rolle/UI-tilgang |
| Vhosts | Logisk isolering |
| Permissions | configure/write/read |
| Prefix | Navnekonvensjon for isolering |

---

## Øvelse

1. Opprett en bruker "test-app" uten tags

2. Sett permissions som kun tillater:
   - write til køer som starter med "test-"
   - read fra køer som starter med "test-"

3. Logg inn med brukeren i Management UI
   - Hva kan du se?
   - Hva kan du gjøre?

4. Prøv å opprette en kø som IKKE starter med "test-"
   - Hva skjer?

---

**Neste:** [[06-policies-og-konfig|Modul 6: Policies og konfigurasjon]]
