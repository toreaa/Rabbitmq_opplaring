export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number // 0-indexed
  explanation?: string
  sectionId?: string // ID for å linke til relevant seksjon i innholdet
  sectionTitle?: string // Tittel på seksjonen for visning
}

export interface ModuleQuiz {
  moduleSlug: string
  questions: QuizQuestion[]
}

export const quizzes: Record<string, QuizQuestion[]> = {
  '01-hva-er-rabbitmq': [
    {
      question: 'Hva er hovedfordelen med å bruke en meldingskø?',
      options: [
        'System A må vente på svar fra System B',
        'Asynkron kommunikasjon - System A er ferdig med en gang',
        'Meldinger slettes umiddelbart',
        'Direkte kobling mellom systemer'
      ],
      correctAnswer: 1,
      explanation: 'Med en meldingskø kan System A sende meldingen og fortsette arbeidet uten å vente på at System B behandler den.',
      sectionId: 'hva-er-en-meldingsko',
      sectionTitle: 'Hva er en meldingskø?'
    },
    {
      question: 'Hva skjer med meldinger hvis mottakersystemet er nede?',
      options: [
        'Meldingene går tapt',
        'Senderen får en feilmelding',
        'Meldingene venter trygt i køen',
        'Systemet krasjer'
      ],
      correctAnswer: 2,
      explanation: 'En av hovedfordelene med meldingskøer er at meldinger lagres trygt til mottakeren er klar.',
      sectionId: 'hvorfor-meldingsko',
      sectionTitle: 'Hvorfor meldingskø?'
    },
    {
      question: 'Når er Kafka et bedre valg enn RabbitMQ?',
      options: [
        'For enkle arbeidskøer',
        'For punkt-til-punkt kommunikasjon',
        'For sanntids streaming og event replay',
        'For avansert routing'
      ],
      correctAnswer: 2,
      explanation: 'Kafka er bedre for streaming, event sourcing og tilfeller der du trenger å kunne spille av hendelser på nytt.',
      sectionId: 'rabbitmq-vs-kafka',
      sectionTitle: 'RabbitMQ vs Kafka'
    },
    {
      question: 'Hva er en "Exchange" i RabbitMQ?',
      options: [
        'En type melding',
        'En komponent som router meldinger til køer',
        'En bruker med spesielle rettigheter',
        'En backup-mekanisme'
      ],
      correctAnswer: 1,
      explanation: 'Exchange mottar meldinger fra produsenter og router dem til riktige køer basert på regler.',
      sectionId: 'nokkelbegreper',
      sectionTitle: 'Nøkkelbegreper'
    },
    {
      question: 'Hva er forskjellen mellom RabbitMQ og Kafka sin modell?',
      options: [
        'RabbitMQ sletter meldinger etter levering, Kafka beholder dem',
        'Kafka sletter meldinger etter levering, RabbitMQ beholder dem',
        'Det er ingen forskjell',
        'RabbitMQ støtter ikke køer'
      ],
      correctAnswer: 0,
      explanation: 'RabbitMQ er en message queue (sletter etter levering), mens Kafka er en event log (beholder meldinger).',
      sectionId: 'rabbitmq-vs-kafka',
      sectionTitle: 'RabbitMQ vs Kafka'
    }
  ],

  '02-arkitektur': [
    {
      question: 'Hvorfor bør du ha et odde antall noder i et RabbitMQ-cluster?',
      options: [
        'Det er raskere',
        'For quorum-avstemning ved feil',
        'Det bruker mindre minne',
        'Det er enklere å konfigurere'
      ],
      correctAnswer: 1,
      explanation: 'Odde antall noder sikrer at flertallet kan avgjøre beslutninger ved quorum-avstemning.',
      sectionId: 'broker-node',
      sectionTitle: 'Broker (Node)'
    },
    {
      question: 'Hva isolerer IKKE en Virtual Host (vhost)?',
      options: [
        'Køer',
        'Exchanges',
        'Brukere',
        'Minne og CPU-ressurser'
      ],
      correctAnswer: 3,
      explanation: 'Vhosts gir logisk isolering av køer, exchanges og brukere, men deler fysiske ressurser som minne og CPU.',
      sectionId: 'virtual-host-vhost',
      sectionTitle: 'Virtual Host (vhost)'
    },
    {
      question: 'Hva er best practice for connections og channels?',
      options: [
        'Én connection per melding',
        'Én connection per applikasjon, én channel per tråd',
        'Én channel per applikasjon',
        'Så mange connections som mulig'
      ],
      correctAnswer: 1,
      explanation: 'Connections er tunge å opprette. Best practice er å gjenbruke én connection og ha én channel per tråd.',
      sectionId: 'connection-og-channel',
      sectionTitle: 'Connection og Channel'
    },
    {
      question: 'Hvilken queue-type er anbefalt for produksjon?',
      options: [
        'Classic Queue',
        'Stream Queue',
        'Quorum Queue',
        'Temporary Queue'
      ],
      correctAnswer: 2,
      explanation: 'Quorum queues replikerer data til alle noder og tåler node-feil, noe som gjør dem ideelle for produksjon.',
      sectionId: 'queue',
      sectionTitle: 'Queue'
    },
    {
      question: 'Hva er en "Binding" i RabbitMQ?',
      options: [
        'En TCP-forbindelse',
        'En kobling mellom exchange og kø med routing-regler',
        'En type melding',
        'En bruker-rettighet'
      ],
      correctAnswer: 1,
      explanation: 'Bindings definerer reglene for hvordan meldinger rutes fra exchanges til køer.',
      sectionId: 'binding',
      sectionTitle: 'Binding'
    },
    {
      question: 'I et 3-node cluster, hvor mange noder kan være nede samtidig uten datatap med quorum queues?',
      options: [
        '0 noder',
        '1 node',
        '2 noder',
        '3 noder'
      ],
      correctAnswer: 1,
      explanation: 'Med 3 noder kan 1 node være nede (2 av 3 er fortsatt oppe = flertall/quorum).',
      sectionId: 'cluster-arkitektur',
      sectionTitle: 'Cluster-arkitektur'
    }
  ],

  '03-koer-og-meldinger': [
    {
      question: 'Hva skjer med en melding i en Classic Queue hvis noden dør?',
      options: [
        'Meldingen flyttes automatisk',
        'Meldingen går tapt',
        'Meldingen sendes på nytt',
        'Meldingen lagres i backup'
      ],
      correctAnswer: 1,
      explanation: 'Classic queues har ingen replikering - data finnes kun på én node og går tapt ved node-feil.'
    },
    {
      question: 'Hva er forskjellen på Auto-ACK og Manual ACK?',
      options: [
        'Auto-ACK er sikrere',
        'Manual ACK gir risiko for meldingstap',
        'Auto-ACK kan føre til meldingstap ved crash',
        'Det er ingen forskjell'
      ],
      correctAnswer: 2,
      explanation: 'Med Auto-ACK slettes meldingen før prosessering er ferdig. Manual ACK sikrer at meldingen kun slettes etter vellykket behandling.'
    },
    {
      question: 'Hva må til for at meldinger overlever en RabbitMQ restart?',
      options: [
        'Kun durable kø',
        'Kun persistent melding',
        'Durable kø OG persistent melding (delivery_mode=2)',
        'Stream queue'
      ],
      correctAnswer: 2,
      explanation: 'Både køen må være durable OG meldingen må ha delivery_mode=2 for å overleve restart.'
    },
    {
      question: 'Hva gjør x-dead-letter-exchange parameteren?',
      options: [
        'Sletter gamle meldinger',
        'Sender feilede meldinger til en annen exchange',
        'Stopper køen',
        'Øker ytelsen'
      ],
      correctAnswer: 1,
      explanation: 'DLX (Dead Letter Exchange) fanger opp meldinger som feiler, utløper, eller avvises.'
    },
    {
      question: 'Når bruker man en Stream Queue?',
      options: [
        'Når ytelse er viktigst',
        'Når man trenger replay og flere konsumenter kan lese samme meldinger',
        'Når meldinger er små',
        'Når man har få konsumenter'
      ],
      correctAnswer: 1,
      explanation: 'Stream queues beholder meldinger og lar flere konsumenter lese fra ulike offsets - perfekt for replay.'
    },
    {
      question: 'Hva betyr x-overflow: reject-publish?',
      options: [
        'Eldste melding droppes',
        'Ny melding avvises og producer får beskjed',
        'Køen utvides automatisk',
        'Meldingen sendes til DLX'
      ],
      correctAnswer: 1,
      explanation: 'reject-publish stopper nye meldinger fra å komme inn når køen er full, og gir producer beskjed.'
    },
    {
      question: 'Hva er x-delivery-limit brukt til?',
      options: [
        'Begrense køstørrelse',
        'Begrense antall redeliveries før melding sendes til DLX',
        'Begrense antall konsumenter',
        'Begrense meldingsstørrelse'
      ],
      correctAnswer: 1,
      explanation: 'delivery-limit forhindrer infinite redelivery loops ved å sende meldingen til DLX etter X forsøk.'
    },
    {
      question: 'Hva er anbefalt ACK-modus for produksjon?',
      options: [
        'Auto-ACK for best ytelse',
        'Manual ACK for sikkerhet',
        'Ingen ACK',
        'Batch ACK'
      ],
      correctAnswer: 1,
      explanation: 'Manual ACK sikrer at meldinger ikke går tapt selv om consumer krasjer under prosessering.'
    }
  ],

  '04-exchanges-og-routing': [
    {
      question: 'Hvilken exchange-type sender meldinger til alle bindede køer?',
      options: [
        'Direct',
        'Topic',
        'Fanout',
        'Headers'
      ],
      correctAnswer: 2,
      explanation: 'Fanout exchange ignorerer routing key og sender meldingen til alle køer som er bundet til den.'
    },
    {
      question: 'Hva betyr wildcard "#" i en topic exchange binding?',
      options: [
        'Eksakt ett ord',
        'Null eller flere ord',
        'Alle bokstaver',
        'Ingen match'
      ],
      correctAnswer: 1,
      explanation: '# matcher null eller flere ord, mens * matcher eksakt ett ord i routing key.'
    },
    {
      question: 'Hva skjer hvis ingen binding matcher en melding?',
      options: [
        'Meldingen venter',
        'Meldingen forsvinner (med mindre alternate-exchange er satt)',
        'Producer får feilmelding',
        'Meldingen sendes til alle køer'
      ],
      correctAnswer: 1,
      explanation: 'Uten match og uten alternate-exchange konfigurert, forsvinner meldingen stille.'
    },
    {
      question: 'Når bør du bruke Direct exchange i stedet for Topic?',
      options: [
        'Alltid',
        'Når du trenger wildcards',
        'Når du har eksakt match uten behov for patterns',
        'Aldri'
      ],
      correctAnswer: 2,
      explanation: 'Direct er mer effektiv enn topic når du kun trenger eksakt match på routing key.'
    },
    {
      question: 'Hva er "default exchange"?',
      options: [
        'En fanout exchange',
        'En exchange med tom streng som navn - sender direkte til kø',
        'Den første exchange som opprettes',
        'En backup exchange'
      ],
      correctAnswer: 1,
      explanation: 'Default exchange (tom streng) lar deg sende meldinger direkte til en kø ved å bruke kø-navnet som routing key.'
    },
    {
      question: 'Hva er formålet med Alternate Exchange?',
      options: [
        'Backup ved node-feil',
        'Fange opp meldinger som ikke matcher noen binding',
        'Øke ytelsen',
        'Kryptere meldinger'
      ],
      correctAnswer: 1,
      explanation: 'Alternate Exchange fungerer som en fallback for meldinger som ikke matcher noen binding i primær exchange.'
    }
  ],

  '05-brukere-og-tilgang': [
    {
      question: 'Hvilken tag gir en bruker full tilgang til RabbitMQ?',
      options: [
        'management',
        'policymaker',
        'monitoring',
        'administrator'
      ],
      correctAnswer: 3,
      explanation: 'administrator-tag gir full tilgang til alle funksjoner inkludert cluster-admin.'
    },
    {
      question: 'Hva betyr permissions configure: "^min-app-.*"?',
      options: [
        'Tilgang til alle ressurser',
        'Kun tilgang til å opprette ressurser som starter med "min-app-"',
        'Tilgang til min-app mappen',
        'Ingen tilgang'
      ],
      correctAnswer: 1,
      explanation: 'Regex-mønsteret begrenser configure-tilgang til kun ressurser som matcher "^min-app-.*".'
    },
    {
      question: 'Hva er best practice for brukere i produksjon?',
      options: [
        'Én felles bruker for alle applikasjoner',
        'Bruke guest-brukeren',
        'Én bruker per applikasjon med minimale rettigheter',
        'Kun administrator-brukere'
      ],
      correctAnswer: 2,
      explanation: 'Separate brukere per applikasjon gir sporbarhet og bedre sikkerhet med minimale rettigheter.'
    },
    {
      question: 'Hva bør du gjøre med guest-brukeren i produksjon?',
      options: [
        'Endre passordet',
        'Gi den administrator-rettigheter',
        'Slette den',
        'La den være'
      ],
      correctAnswer: 2,
      explanation: 'Guest-brukeren har kjent default-passord og bør slettes i produksjon for å unngå sikkerhetsrisiko.'
    },
    {
      question: 'Hvilke tre typer permissions finnes i RabbitMQ?',
      options: [
        'read, write, delete',
        'configure, write, read',
        'create, update, delete',
        'admin, user, guest'
      ],
      correctAnswer: 1,
      explanation: 'De tre permission-typene er: configure (opprette/slette), write (publisere), read (konsumere).'
    }
  ],

  '06-policies-og-konfig': [
    {
      question: 'Hva er forskjellen på User Policy og Operator Policy?',
      options: [
        'Ingen forskjell',
        'Operator policy overstyrer user policy ved konflikt',
        'User policy overstyrer operator policy',
        'Operator policy kan kun settes av brukere'
      ],
      correctAnswer: 1,
      explanation: 'Operator policies settes av drift og kombineres med user policies - den strengeste verdien vinner ved konflikt.'
    },
    {
      question: 'Hva skjer når overflow er satt til "drop-head"?',
      options: [
        'Ny melding avvises',
        'Eldste melding droppes for å gi plass til ny',
        'Køen utvides',
        'Producer får feilmelding'
      ],
      correctAnswer: 1,
      explanation: 'drop-head fjerner den eldste meldingen for å gi plass til nye. Dette kan føre til datatap uten varsel.'
    },
    {
      question: 'Hvorfor bør du alltid sette operator policy med max-length?',
      options: [
        'For bedre ytelse',
        'For å forhindre at køer vokser ukontrollert og tar opp alt minne',
        'For å spare disk',
        'Det er påkrevd'
      ],
      correctAnswer: 1,
      explanation: 'Uten max-length kan køer vokse ukontrollert og forårsake minneproblemer på hele clusteret.'
    },
    {
      question: 'Hva er vm_memory_high_watermark?',
      options: [
        'Maksimum køstørrelse',
        'Grensen for når flow control starter og publisering bremses',
        'Minimum minne',
        'Disk-grense'
      ],
      correctAnswer: 1,
      explanation: 'Når minnebruk når high watermark (default 40%), starter flow control og publisering bremses.'
    },
    {
      question: 'Hva er anbefalt overflow-strategi for produksjon?',
      options: [
        'drop-head - for best ytelse',
        'reject-publish - producer får beskjed om at køen er full',
        'ignore - la køen vokse',
        'delete - slett køen'
      ],
      correctAnswer: 1,
      explanation: 'reject-publish sikrer at ingen meldinger går tapt og at producer blir informert om problemet.'
    },
    {
      question: 'Hva gjør delivery-limit i en policy?',
      options: [
        'Begrenser meldingsstørrelse',
        'Begrenser antall ganger en melding kan redeliveres før den sendes til DLX',
        'Begrenser antall køer',
        'Begrenser antall connections'
      ],
      correctAnswer: 1,
      explanation: 'delivery-limit forhindrer at feilende meldinger gjenleveres i det uendelige.'
    }
  ],

  '07-overvaking-og-feilsoking': [
    {
      question: 'Hva indikerer det når "Messages ready" vokser kontinuerlig?',
      options: [
        'Alt fungerer normalt',
        'Consumer henger etter eller er nede',
        'Producer har stoppet',
        'Køen er slettet'
      ],
      correctAnswer: 1,
      explanation: 'Voksende "Messages ready" betyr at meldinger ikke blir konsumert - consumer kan være treg eller nede.'
    },
    {
      question: 'Hva skjer når disk_free_limit nås?',
      options: [
        'Ingen ting',
        'Publisering stopper helt',
        'Køer slettes',
        'Noden restarter'
      ],
      correctAnswer: 1,
      explanation: 'Når disk er under grensen, stopper RabbitMQ all publisering for å forhindre fullstendig diskfylling.'
    },
    {
      question: 'Hva bør du gjøre hvis du ser meldinger i en DLQ (dead letter queue)?',
      options: [
        'Ignorere dem',
        'Slette køen',
        'Undersøke hvorfor meldinger feiler og fiks root cause',
        'Øke TTL'
      ],
      correctAnswer: 2,
      explanation: 'Meldinger i DLQ indikerer feil - undersøk årsaken (consumer-feil, timeout, etc.) og fiks problemet.'
    },
    {
      question: 'Hvilken kommando viser køer med antall meldinger og consumers?',
      options: [
        'rabbitmqctl status',
        'rabbitmqctl list_queues name messages consumers',
        'rabbitmqctl cluster_status',
        'rabbitmqctl list_connections'
      ],
      correctAnswer: 1,
      explanation: 'list_queues med name, messages og consumers-kolonnene gir oversikt over kø-status.'
    },
    {
      question: 'Hva kan forårsake "memory alarm" i RabbitMQ?',
      options: [
        'For få køer',
        'Køer med mange meldinger som bruker mer minne enn high watermark',
        'For mange brukere',
        'Feil passord'
      ],
      correctAnswer: 1,
      explanation: 'Memory alarm utløses når minnebruk overstiger vm_memory_high_watermark - ofte pga. store køer.'
    },
    {
      question: 'Hva er det første du bør sjekke ved connection refused?',
      options: [
        'Kø-størrelse',
        'Om noden er oppe og porter er åpne',
        'Meldingsrate',
        'Exchange-type'
      ],
      correctAnswer: 1,
      explanation: 'Ved connection refused, sjekk først om noden kjører (rabbitmqctl status) og at porter ikke er blokkert.'
    }
  ],

  '08-produksjonsoppsett': [
    {
      question: 'Hvor mange noder anbefales minimum for produksjon?',
      options: [
        '1 node',
        '2 noder',
        '3 noder',
        '4 noder'
      ],
      correctAnswer: 2,
      explanation: '3 noder gir feiltoleranse (tåler 1 node nede) og muliggjør quorum-avstemning.'
    },
    {
      question: 'Hva bør disk_free_limit settes til i produksjon?',
      options: [
        '50 MB (default)',
        '1 GB',
        'Minimum 2x RAM',
        '10 MB'
      ],
      correctAnswer: 2,
      explanation: 'disk_free_limit bør være minst 2x RAM for å ha nok plass til å skrive ut minnedata ved behov.'
    },
    {
      question: 'Hva inkluderes IKKE i en definitions-eksport?',
      options: [
        'Brukere',
        'Køer (struktur)',
        'Meldingsinnhold',
        'Policies'
      ],
      correctAnswer: 2,
      explanation: 'Definitions-eksport inkluderer struktur (køer, exchanges, brukere, policies) men IKKE meldingsdata.'
    },
    {
      question: 'Hva er riktig fremgangsmåte for oppgradering av RabbitMQ?',
      options: [
        'Oppgrader alle noder samtidig',
        'Hopp over versjoner for å spare tid',
        'Rolling upgrade - én minor-versjon om gangen',
        'Slett clusteret og lag nytt'
      ],
      correctAnswer: 2,
      explanation: 'Rolling upgrade med én minor-versjon om gangen sikrer stabilitet og unngår inkompatibilitet.'
    },
    {
      question: 'Hvilken port brukes for kryptert AMQP (AMQPS)?',
      options: [
        '5672',
        '5671',
        '15672',
        '25672'
      ],
      correctAnswer: 1,
      explanation: 'Port 5671 er standard for AMQPS (TLS-kryptert), mens 5672 er ukryptert AMQP.'
    },
    {
      question: 'Hva er fordelen med quorum queues i et cluster?',
      options: [
        'Høyere ytelse',
        'Automatisk failover uten meldingstap ved node-feil',
        'Mindre diskbruk',
        'Enklere konfigurasjon'
      ],
      correctAnswer: 1,
      explanation: 'Quorum queues replikerer data til alle noder og velger automatisk ny leader ved feil - ingen meldingstap.'
    }
  ]
}
