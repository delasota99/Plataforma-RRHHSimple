/*
 * PARÁMETROS LEGALES — archivo único.
 * Todo lo que cambia con el tiempo (convenio, tablas, festivos, plan de igualdad…)
 * vive aquí y solo aquí. Cada bloque indica su fuente oficial y su vigencia.
 * Para actualizar: cambia el valor, la fuente y la fecha de verificación.
 */
window.RRHH_PARAMS = {

  convenio: {
    nombre: 'Convenio colectivo estatal para las industrias de alimentos compuestos para animales',
    codigo: '99000275011981',
    boe: 'BOE-A-2021-19283',
    publicado: '2021-11-23',
    vigencia: '2021-2025 (en ultraactividad hasta nuevo convenio)',
    verificado: '2026-10-20'
  },

  vacaciones: {
    diasLaborables: 22,              // art. 12 convenio
    fuente: 'Convenio, art. 12 · ET, art. 38'
  },

  jornada: {
    horasAnuales: 1760,              // art. 10 convenio
    horasSemanalesReferencia: 40,
    fuente: 'Convenio, art. 10'
  },

  pagasExtra: {
    numero: 4, diasCadaUna: 30,      // art. 24 convenio
    // Práctica de la empresa (confirmada por Fernando, 20/10/2026):
    prorrateadas: 2,                 // se cobran prorrateadas en la nómina mensual
    noProrrateadas: [
      { nombre: 'Paga de junio',     devengoDesde: '01-01', devengoHasta: '06-30' },
      { nombre: 'Paga de diciembre', devengoDesde: '07-01', devengoHasta: '12-31' }
    ],
    fuente: 'Convenio, art. 24'
  },

  preavisoBajaVoluntaria: {          // art. 29 convenio
    unMes: ['Técnico', 'Auxiliar de laboratorio', 'Informática', 'Administrativo', 'Comercial', 'Encargado/a de producción'],
    ochoDias: ['Producción (excepto encargados)', 'Mantenimiento y transporte', 'Subalterno'],
    // Por categoría (tablas): un mes para grupos A, B, C, D, E y el encargado de producción (F2); ocho días para el resto.
    unMesCategorias: ['A', 'B', 'C', 'D', 'E', 'F2'],
    sancion: 'Un día de salario por cada día de retraso en el aviso',
    fuente: 'Convenio, art. 29'
  },

  /* Tablas salariales definitivas 2025 (sin tablas 2026 publicadas: se aplican estas). */
  tablas: {
    anio: 2025,
    fuente: 'BOE-A-2026-3361 (13/02/2026) · tablas definitivas 2025',
    nota: 'Para 2026 no hay tablas publicadas: se aplican las de 2025 por ultraactividad. Puede haber atrasos cuando se publiquen.',
    diasAbonadosSalarioDiario: 485,
    pagasSalarioMensual: 16,
    primaAsistenciaDia: 9.50,        // provisional 2025
    categorias: [
      { id:'A1', grupo:'Personal técnico', nombre:'Titulado Superior', mes:1611.29, anual:25780.64 },
      { id:'A2', grupo:'Personal técnico', nombre:'Titulado Grado Medio', mes:1558.58, anual:24937.28 },
      { id:'A3', grupo:'Personal técnico', nombre:'No Titulado', mes:1457.39, anual:23318.24 },
      { id:'A4', grupo:'Personal técnico', nombre:'Control de Calidad', mes:1419.34, anual:22709.44 },
      { id:'B1', grupo:'Personal auxiliar de laboratorio', nombre:'Auxiliar de Laboratorio', mes:1313.70, anual:21019.20 },
      { id:'C1', grupo:'Personal de informática', nombre:'Jefe/a de Equipo de Informática', mes:1558.58, anual:24937.28 },
      { id:'C2', grupo:'Personal de informática', nombre:'Analista', mes:1457.39, anual:23318.24 },
      { id:'C3', grupo:'Personal de informática', nombre:'Jefe/a de Explotación', mes:1431.58, anual:22905.28 },
      { id:'C4', grupo:'Personal de informática', nombre:'Programador/a', mes:1397.56, anual:22360.96 },
      { id:'C5', grupo:'Personal de informática', nombre:'Operador/a', mes:1344.22, anual:21507.52 },
      { id:'D1', grupo:'Personal administrativo', nombre:'Jefe/a Administrativo', mes:1558.58, anual:24937.28 },
      { id:'D2', grupo:'Personal administrativo', nombre:'Oficial Administrativo/a 1.ª', mes:1457.39, anual:23318.24 },
      { id:'D3', grupo:'Personal administrativo', nombre:'Oficial Administrativo/a 2.ª', mes:1397.56, anual:22360.96 },
      { id:'D4', grupo:'Personal administrativo', nombre:'Auxiliar Administrativo/a', mes:1313.70, anual:21019.20 },
      { id:'E1', grupo:'Personal comercial', nombre:'Jefe/a de Ventas y/o Compras', mes:1558.58, anual:24937.28 },
      { id:'E2', grupo:'Personal comercial', nombre:'Jefe/a de Zona', mes:1457.39, anual:23318.24 },
      { id:'E3', grupo:'Personal comercial', nombre:'Promotor/a de Ventas', mes:1397.56, anual:22360.96 },
      { id:'F1', grupo:'Personal de producción', nombre:'Jefe/a de Fábrica', mes:1558.58, anual:24937.28 },
      { id:'F2', grupo:'Personal de producción', nombre:'Encargado/a', dia:46.85, anual:22722.25 },
      { id:'F3', grupo:'Personal de producción', nombre:'Palista, maquinista, oficial carro mezclador', dia:46.85, anual:22722.25 },
      { id:'F4', grupo:'Personal de producción', nombre:'Personal Oficial 1.ª', dia:45.33, anual:21985.05 },
      { id:'F5', grupo:'Personal de producción', nombre:'Personal Oficial 2.ª', dia:44.48, anual:21572.80 },
      { id:'F6', grupo:'Personal de producción', nombre:'Especialista', dia:43.80, anual:21243.00 },
      { id:'F7', grupo:'Personal de producción', nombre:'Personal Peón', dia:43.03, anual:20869.55 },
      { id:'G1', grupo:'Personal de mantenimiento y transporte', nombre:'Encargado/a', dia:46.85, anual:22722.25 },
      { id:'G2', grupo:'Personal de mantenimiento y transporte', nombre:'Personal 1.ª Chófer', dia:45.88, anual:22251.80 },
      { id:'G3', grupo:'Personal de mantenimiento y transporte', nombre:'Personal 1.ª (resto de especialidades)', dia:45.33, anual:21985.05 },
      { id:'G4', grupo:'Personal de mantenimiento y transporte', nombre:'Personal Oficial 2.ª', dia:44.48, anual:21572.80 },
      { id:'G5', grupo:'Personal de mantenimiento y transporte', nombre:'Personal Ayudante', dia:43.80, anual:21243.00 },
      { id:'H1', grupo:'Personal subalterno', nombre:'Ordenanza', mes:1313.68, anual:21018.88 },
      { id:'H2', grupo:'Personal subalterno', nombre:'Personal de Vigilancia', mes:1304.77, anual:20876.32 },
      { id:'H3', grupo:'Personal subalterno', nombre:'Personal de Limpieza', dia:43.03, anual:20869.55 }
    ]
  },

  /* Centros de trabajo de la empresa. Los de fábrica añaden pasos específicos en las altas. */
  centros: ['Fábrica (Talavera)', 'Oficina (Madrid)'],

  /* Datos para las plantillas de documentos. */
  empresa: {
    nombre: 'Liptosa',
    nombreMayusculas: 'LIPTOSA',
    firmante: 'Fernando',
    cargo: 'Responsable de Recursos Humanos',
    firmaCorta: 'Fernando — RRHH',
    centrosTexto: { 'Fábrica (Talavera)': 'Talavera de la Reina', 'Oficina (Madrid)': 'Madrid' },
    enlaceModelo145: 'https://www.mugeju.es/sites/default/files/archivos/impresos/prestaciones/Modelo_145_rellenable.pdf',
    validezOfertaDias: 7
  },
  planIgualdad: {
    aprobado: '2024-12-17',
    vigenteHasta: '2028-12-16',
    firmantes: 'CCOO y UGT-FICA',
    registro: 'Ministerio de Trabajo y Economía Social'
  },

  /* Departamentos de la empresa (desplegable en empleados y altas). */
  departamentos: ['Fábrica', 'Comercial', 'Administración y Finanzas', 'Homologación y Registros'],

  /* Puesto de la empresa → categoría (confirmado por Fernando, 20/10/2026). Editable en Ajustes (fase 5). */
  puestos: [
    { puesto:'Administrativo/a Contable', categoria:'D2' },
    { puesto:'Aux. Comercial', categoria:'D4' },
    { puesto:'Carretillero/a', categoria:'F4', alternativas:['F5'] },
    { puesto:'Comercial', categoria:'E2', alternativas:['E3'] },
    { puesto:'Mantenimiento', categoria:'G3' },
    { puesto:'Producción', categoria:'F6', alternativas:['F4','F5','F7'] },
    { puesto:'Product Manager', categoria:'A1' },
    { puesto:'Técnico/a de Calidad', categoria:'A4', alternativas:['A2'] },
    { puesto:'Técnico/a de logística', categoria:'A3' },
    { puesto:'Técnico/a de Regulación y etiquetado', categoria:'A2' },
    { puesto:'Técnico/a PRL', categoria:'A2' }
  ],

  /* INDEMNIZACIONES por extinción del contrato. Salario diario = bruto anual ÷ 365; mensualidad = bruto anual ÷ 12.
     Periodos inferiores al año: prorrateo por meses, y la fracción de mes cuenta como mes completo. */
  indemnizacion: {
    reforma2012: '2012-02-12',       // DT 11.ª ET: servicios anteriores, 45 días/año
    tipos: {
      improcedente: { nombre: 'Despido improcedente', dias: 33, topeMensualidades: 24, art: 'ET, art. 56.1 y DT 11.ª' },
      objetivo:     { nombre: 'Despido objetivo o colectivo (ERE)', dias: 20, topeMensualidades: 12, art: 'ET, arts. 51.4 y 53.1.b' },
      temporal:     { nombre: 'Fin de contrato temporal', dias: 12, topeMensualidades: null, art: 'ET, art. 49.1.c' },
      modificacion: { nombre: 'Extinción por modificación sustancial', dias: 20, topeMensualidades: 9, art: 'ET, art. 41.3' },
      traslado:     { nombre: 'Extinción por traslado', dias: 20, topeMensualidades: 12, art: 'ET, art. 40.1' }
    },
    anterior2012: { dias: 45, topeDias: 720, topeMensualidades: 42 },
    verificado: '2026-10-21'
  },

  /* PERMISOS RETRIBUIDOS: convenio (art. 14) frente a ET (art. 37). Se aplica el más favorable.
     dias: base · desplaz: días extra si hay desplazamiento · lejos: extra si la celebración es a más de 100 km. */
  permisos: [
    { id:'matrimonio', nombre:'Matrimonio o registro de pareja de hecho', unidad:'días naturales',
      et:{ dias:15, art:'ET 37.3.a' }, conv:{ dias:15, art:'Convenio 14.1.a' },
      nota:'Puede sumarse a las vacaciones (convenio). La pareja estable con convivencia acreditada tiene los mismos derechos (convenio 14.4).' },
    { id:'enfermedad', nombre:'Accidente o enfermedad grave, hospitalización o intervención con reposo de un familiar', unidad:'días', desplazamiento:true,
      et:{ dias:5, desplaz:0, art:'ET 37.3.b', quien:'Cónyuge, pareja de hecho, parientes hasta 2.º grado (consanguinidad o afinidad) y convivientes que necesiten cuidado' },
      conv:{ dias:3, desplaz:3, art:'Convenio 14.1.b', quien:'Cónyuge, hijos, padres y suegros, nietos, abuelos y hermanos' },
      nota:'El ET no aclara si son naturales o laborables; el convenio fija el inicio en el primer día laborable. No tiene que empezar el mismo día del hecho causante y puede disfrutarse mientras persista (STS 126/2026, de 4 de febrero).' },
    { id:'fallecimiento', nombre:'Fallecimiento de un familiar', unidad:'días', desplazamiento:true,
      et:{ dias:2, desplaz:2, art:'ET 37.3.b bis', quien:'Cónyuge, pareja de hecho y parientes hasta 2.º grado' },
      conv:{ dias:3, desplaz:3, art:'Convenio 14.1.b', quien:'Cónyuge, hijos, padres y suegros, nietos, abuelos y hermanos' },
      nota:'Con desplazamiento, los días extra son el tiempo necesario para el viaje, con un máximo de 3 (convenio).' },
    { id:'traslado', nombre:'Traslado del domicilio habitual', unidad:'días',
      et:{ dias:1, art:'ET 37.3.c' }, conv:{ dias:2, art:'Convenio 14.1.c' } },
    { id:'bodaFamiliar', nombre:'Boda de padres, hijos o hermanos', unidad:'día', lejos:true,
      conv:{ dias:1, lejos:1, art:'Convenio 14.1.f' },
      nota:'El día de la celebración. Se amplía un día más si es a más de 100 km y el viaje lo requiere. El ET no lo regula.' },
    { id:'consulta', nombre:'Acompañar a consulta médica a hijos o familiares de 1.er grado', unidad:'horas',
      conv:{ dias:6, art:'Convenio 14.1.g', texto:'Hasta 2 horas por ocasión y 3 ocasiones al año (6 horas). Pueden unificarse en una sola vez.' },
      nota:'Fuera de esas 6 horas, el permiso no es retribuido. Si ambos cónyuges trabajan en la empresa, solo uno de ellos lo tiene retribuido.' },
    { id:'fuerzaMayor', nombre:'Fuerza mayor familiar (urgencia por enfermedad o accidente)', unidad:'días al año',
      et:{ dias:4, art:'ET 37.9', texto:'Las horas equivalentes a 4 días al año, retribuidas.' },
      nota:'Para motivos urgentes e imprevisibles que exijan la presencia inmediata. Debe acreditarse el motivo si se pide.' },
    { id:'catastrofe', nombre:'Imposibilidad de acceder al trabajo por catástrofe o riesgo grave', unidad:'días',
      et:{ dias:4, art:'ET 37.3.g', texto:'Hasta 4 días; después, mientras duren las circunstancias (con posible ERTE de fuerza mayor).' } },
    { id:'deber', nombre:'Deber inexcusable de carácter público y personal (incluido votar)', unidad:'tiempo',
      et:{ texto:'El tiempo indispensable.', art:'ET 37.3.d' }, conv:{ texto:'El tiempo indispensable.', art:'Convenio 14.1.d' },
      nota:'Si impide trabajar más del 20 % de las horas en 3 meses, la empresa puede pasar a la persona a excedencia forzosa. Lo que se cobre por ese deber se descuenta del salario.' },
    { id:'examenes', nombre:'Exámenes', unidad:'tiempo',
      conv:{ texto:'El tiempo necesario para concurrir.', art:'Convenio 14.1.e' }, et:{ texto:'Permiso para exámenes (ET 23.1.a).', art:'ET 23.1.a' } },
    { id:'prenatal', nombre:'Exámenes prenatales, preparación al parto y trámites de adopción o acogimiento', unidad:'tiempo',
      et:{ texto:'El tiempo indispensable, si deben hacerse en horario de trabajo.', art:'ET 37.3.f' } },
    { id:'lactancia', nombre:'Cuidado del lactante (hasta los 9 meses)', unidad:'opciones',
      et:{ texto:'1 hora diaria (divisible en dos fracciones) o media hora de reducción; acumulable según convenio.', art:'ET 37.4' },
      conv:{ dias:14, texto:'Acumulable en 14 días laborables completos, a continuación del permiso por nacimiento. Avisar con 14 días de antelación.', art:'Convenio 14.6' },
      nota:'Derecho individual de cada progenitor. Si ambos lo ejercen con la misma duración y régimen, puede ampliarse hasta los 12 meses, con reducción proporcional del salario desde los 9 meses. Parto múltiple: se incrementa en proporción.' },
    { id:'prematuro', nombre:'Nacimiento prematuro u hospitalización tras el parto', unidad:'horas', resumen:'1 h al día',
      et:{ texto:'1 hora diaria de ausencia retribuida y reducción de hasta 2 horas con reducción proporcional del salario.', art:'ET 37.5' } },
    { id:'asuntos', nombre:'Asuntos propios que no admiten demora', unidad:'sin retribución', resumen:'No retribuido',
      conv:{ texto:'Licencia sin retribución. Petición por escrito; la empresa resuelve en un máximo de 2 días.', art:'Convenio 14.3' } },
    { id:'parental', nombre:'Permiso parental (hasta que el menor cumpla 8 años)', unidad:'semanas',
      et:{ dias:8, texto:'Hasta 8 semanas por hijo, continuas o discontinuas, a jornada completa o parcial. Preaviso de 10 días.', art:'ET 48 bis' },
      nota:'No retribuido por la empresa. Es distinto de las 2 semanas del permiso por nacimiento hasta los 8 años.' }
  ],

  /* REDUCCIÓN DE JORNADA por guarda legal (ET 37.6, en la redacción con efectos del 23/10/2026; convenio 14.1.h). */
  reduccionJornada: { min: 1/8, max: 1/2, edadMenor: 12, fuente: 'ET 37.6 (efectos 23/10/2026: RDL 31/2026 y Ley 4/2026) · Convenio 14.1.h' },

  /* NACIMIENTO Y CUIDADO DEL MENOR (ET 48.4, 48.6 y 48 bis; RDL 9/2025, en vigor desde el 31/07/2025). */
  nacimiento: {
    biparental:  { total: 19, obligatorias: 6, hasta12meses: 11, hasta8anios: 2 },
    monoparental:{ total: 32, obligatorias: 6, hasta12meses: 22, hasta8anios: 4 },
    ampliacionDiscapacidad: 1,       // semanas por progenitor (2 en total, una para cada uno)
    ampliacionPorHijoAdicional: 1,   // semanas por progenitor por cada hijo a partir del segundo
    hospitalizacionMinDias: 7, hospitalizacionMaxSemanas: 13,
    anticipoMadreMaxSemanas: 4,
    lactanciaMeses: 9, lactanciaAcumuladaDias: 14, parentalSemanas: 8, parentalHastaAnios: 8, guardaLegalHastaAnios: 12,
    fuente: 'ET arts. 48.4, 48.6 y 48 bis · RDL 9/2025 (BOE 30/07/2025) · Convenio 14.5 y 14.6',
    verificado: '2026-10-21'
  },

  /*
   * FESTIVOS. Cada año: nacionales comunes + capas (comunidad + municipio).
   * En cada capa, "dias" es la lista completa de la comunidad tal como la publica su boletín;
   * la plataforma marca como "autonómico" lo que no está en la lista nacional.
   * Para añadir un año nuevo: copia un bloque, cambia fechas y fuentes. Los locales se publican más tarde.
   */
  capasFestivos: {
    madrid: { nombre: 'Madrid', comunidad: 'Comunidad de Madrid', municipio: 'Madrid capital' },
    clm:    { nombre: 'Talavera', comunidad: 'Castilla-La Mancha', municipio: 'Talavera de la Reina' },
    cv:     { nombre: 'Valencia', comunidad: 'Comunitat Valenciana', municipio: 'València' }
  },
  festivos: {
    2026: {
      fuente: 'BOE-A-2025-21667 (Resolución de 17/10/2025, BOE 28/10/2025)',
      nacionales: [
        ['2026-01-01','Año Nuevo'], ['2026-01-06','Epifanía del Señor'], ['2026-04-03','Viernes Santo'],
        ['2026-05-01','Fiesta del Trabajo'], ['2026-08-15','Asunción de la Virgen'], ['2026-10-12','Fiesta Nacional de España'],
        ['2026-12-08','Inmaculada Concepción'], ['2026-12-25','Natividad del Señor']
      ],
      nota: '1 de noviembre y 6 de diciembre caen en domingo: cada comunidad decide si los traslada.',
      capas: {
        madrid: {
          fuente: 'Decreto 75/2025, de 24 de septiembre (BOCM 25/09/2025)',
          dias: [['2026-01-01','Año Nuevo'],['2026-01-06','Epifanía del Señor'],['2026-04-02','Jueves Santo'],['2026-04-03','Viernes Santo'],['2026-05-01','Fiesta del Trabajo'],['2026-05-02','Fiesta de la Comunidad de Madrid'],['2026-08-15','Asunción de la Virgen'],['2026-10-12','Fiesta Nacional de España'],['2026-11-02','Todos los Santos (trasladado)'],['2026-12-07','Día de la Constitución (trasladado)'],['2026-12-08','Inmaculada Concepción'],['2026-12-25','Natividad del Señor']],
          local: { fuente: 'Pleno del Ayuntamiento de Madrid, 30/09/2025', dias: [['2026-05-15','San Isidro Labrador'],['2026-11-09','Nuestra Señora de la Almudena']] }
        },
        clm: {
          fuente: 'Decreto 44/2025, de 17 de junio (DOCM)',
          dias: [['2026-01-01','Año Nuevo'],['2026-01-06','Epifanía del Señor'],['2026-04-02','Jueves Santo'],['2026-04-03','Viernes Santo'],['2026-04-06','Lunes de Pascua (sustituye a San José)'],['2026-05-01','Fiesta del Trabajo'],['2026-06-04','Corpus Christi (sustituye al 6 de diciembre)'],['2026-08-15','Asunción de la Virgen'],['2026-10-12','Fiesta Nacional de España'],['2026-11-02','Todos los Santos (trasladado)'],['2026-12-08','Inmaculada Concepción'],['2026-12-25','Natividad del Señor']],
          local: { fuente: 'Pleno municipal de Talavera de la Reina (fiestas locales 2026)', dias: [['2026-05-15','Fiesta local'],['2026-09-08','Fiesta local']] }
        },
        cv: {
          fuente: 'Decreto 100/2025, de 1 de julio, del Consell (DOGV 07/07/2025)',
          dias: [['2026-01-01','Año Nuevo'],['2026-01-06','Epifanía del Señor'],['2026-03-19','San José'],['2026-04-03','Viernes Santo'],['2026-04-06','Lunes de Pascua'],['2026-05-01','Fiesta del Trabajo'],['2026-06-24','San Juan'],['2026-08-15','Asunción de la Virgen'],['2026-10-09','Día de la Comunitat Valenciana'],['2026-10-12','Fiesta Nacional de España'],['2026-12-08','Inmaculada Concepción'],['2026-12-25','Natividad del Señor']],
          local: { fuente: 'Ayuntamiento de València (fiestas locales 2026)', dias: [['2026-01-22','San Vicente Mártir'],['2026-04-13','San Vicente Ferrer']] }
        }
      }
    },
    2027: {
      fuente: 'BOE-A-2026-21254 (Resolución de 08/10/2026, BOE 13/10/2026)',
      nacionales: [
        ['2027-01-01','Año Nuevo'], ['2027-01-06','Epifanía del Señor'], ['2027-03-26','Viernes Santo'],
        ['2027-05-01','Fiesta del Trabajo'], ['2027-10-12','Fiesta Nacional de España'], ['2027-11-01','Todos los Santos'],
        ['2027-12-06','Día de la Constitución Española'], ['2027-12-08','Inmaculada Concepción'], ['2027-12-25','Natividad del Señor']
      ],
      capas: {
        madrid: {
          fuente: 'Decreto 82/2026, de 30 de septiembre (BOCM 01/10/2026)',
          dias: [['2027-01-01','Año Nuevo'],['2027-01-06','Epifanía del Señor'],['2027-03-19','San José'],['2027-03-25','Jueves Santo'],['2027-03-26','Viernes Santo'],['2027-05-01','Fiesta del Trabajo'],['2027-08-16','Asunción de la Virgen (trasladado)'],['2027-10-12','Fiesta Nacional de España'],['2027-11-01','Todos los Santos'],['2027-12-06','Día de la Constitución Española'],['2027-12-08','Inmaculada Concepción'],['2027-12-25','Natividad del Señor']],
          local: { fuente: 'Pendiente de publicación', dias: [] }
        },
        clm: {
          fuente: 'Decreto 34/2026, de 23 de junio (DOCM)',
          dias: [['2027-01-01','Año Nuevo'],['2027-01-06','Epifanía del Señor'],['2027-03-25','Jueves Santo'],['2027-03-26','Viernes Santo'],['2027-05-01','Fiesta del Trabajo'],['2027-05-27','Corpus Christi (sustituye a San José)'],['2027-05-31','Día de Castilla-La Mancha (sustituye al 15 de agosto)'],['2027-10-12','Fiesta Nacional de España'],['2027-11-01','Todos los Santos'],['2027-12-06','Día de la Constitución Española'],['2027-12-08','Inmaculada Concepción'],['2027-12-25','Natividad del Señor']],
          local: { fuente: 'Pendiente de publicación', dias: [] }
        },
        cv: {
          fuente: 'Acuerdo del Consell de marzo de 2026 (confirmar referencia en el DOGV)',
          dias: [['2027-01-01','Año Nuevo'],['2027-01-06','Epifanía del Señor'],['2027-03-19','San José'],['2027-03-26','Viernes Santo'],['2027-03-29','Lunes de Pascua'],['2027-05-01','Fiesta del Trabajo'],['2027-10-09','Día de la Comunitat Valenciana'],['2027-10-12','Fiesta Nacional de España'],['2027-11-01','Todos los Santos'],['2027-12-06','Día de la Constitución Española'],['2027-12-08','Inmaculada Concepción'],['2027-12-25','Natividad del Señor']],
          local: { fuente: 'Pendiente de publicación', dias: [] }
        }
      }
    }
  }
};
