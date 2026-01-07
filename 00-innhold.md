# RabbitMQ Opplæringspakke
#type/opplæring #område/meldingskø

## Hvem er dette for?

Denne opplæringspakken er for deg som skal:
- Drifte RabbitMQ-clustere
- Sette opp køer og brukere for kunder
- Forstå arkitekturvalg og konsekvenser
- Feilsøke problemer i produksjon

## Læringsmål

Etter å ha gjennomgått denne pakken skal du kunne:
1. Forklare hva RabbitMQ er og når det brukes
2. Forstå de viktigste komponentene og hvordan de henger sammen
3. Ta informerte valg ved oppsett av køer og brukere
4. Identifisere og unngå vanlige feil
5. Feilsøke grunnleggende problemer

---

## Moduler

| # | Modul | Tid | Beskrivelse |
|---|-------|-----|-------------|
| 1 | [[01-hva-er-rabbitmq]] | 15 min | Oversikt og grunnleggende konsepter |
| 2 | [[02-arkitektur]] | 20 min | Komponenter og hvordan de henger sammen |
| 3 | [[03-koer-og-meldinger]] | 25 min | Queue-typer, meldingsflyt, kritiske valg |
| 4 | [[04-exchanges-og-routing]] | 20 min | Routing-mønstre og bindings |
| 5 | [[05-brukere-og-tilgang]] | 15 min | Autentisering, autorisasjon, vhosts |
| 6 | [[06-policies-og-konfig]] | 20 min | Policies, limits, operator policies |
| 7 | [[07-overvaking-og-feilsoking]] | 25 min | Metrikker, alerts, vanlige problemer |
| 8 | [[08-produksjonsoppsett]] | 20 min | Best practices for produksjon |

**Total tid:** ~2.5 timer

---

## Anbefalt rekkefølge

```
┌─────────────────────────────────────────────────────────────┐
│  GRUNNLAG (må forstås først)                                │
│  01 → 02 → 03                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  KONFIGURASJON (bygger på grunnlaget)                       │
│  04 → 05 → 06                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  DRIFT (praktisk anvendelse)                                │
│  07 → 08                                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Praktiske øvelser

Hver modul har praktiske øvelser som kan gjøres mot test-clusteret i [[Prosjekter/RabbitMQ|RabbitMQ-prosjektet]].

---

*Sist oppdatert: 2026-01-07*
