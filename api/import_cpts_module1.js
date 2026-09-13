const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getPool, initializeDatabase } = require('./database/db');

const MODULE_CARDS = [
  {
    concept_name: "¿Qué es la etapa de Pre-Engagement en un Pentest?",
    content: "Es la fase inicial donde se definen compromisos, objetivos, alcance, limitaciones técnicas y acuerdos contractuales por escrito antes de realizar cualquier escaneo o ataque. Sus componentes clave son: 1) Scoping Questionnaire, 2) Pre-engagement meeting, 3) Kick-off meeting.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Getting Started"
  },
  {
    concept_name: "NDA (Non-Disclosure Agreement) en Pre-Engagement",
    content: "Acuerdo de confidencialidad legal entre el cliente y los auditores que obliga a mantener en estricta reserva toda información verbal o escrita compartida durante y después del proyecto. Debe firmarse antes o durante la reunión de Kick-off.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Getting Started"
  },
  {
    concept_name: "Definición del Alcance (Scope)",
    content: "Determinación precisa de todos los activos evaluables (direcciones IP, dominios, subredes CIDR, aplicaciones web, cuentas de prueba). Otorga el marco y fundamento legal indispensable para autorizar las pruebas de seguridad.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Getting Started"
  },
  {
    concept_name: "Rules of Engagement (RoE) - Checklist & Propósito",
    content: "Documento contractual que establece las pautas operativas del test: horarios de prueba, contactos de emergencia, canales de comunicación, manejo seguro de evidencia/encriptación, política de backups y protocolo de interrupción ante incidentes.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Getting Started"
  },
  {
    concept_name: "Objetivo del Kick-Off Meeting",
    content: "Reunión formal presencial o remota tras la firma de contratos donde participan el equipo técnico/gestor del cliente y los pentesters para revisar la logística, ventana horaria de pruebas y verificar permisos de terceros.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Getting Started"
  },
  {
    concept_name: "Tipos de Pentesting: Blackbox vs Greybox vs Whitebox",
    content: "• Blackbox: Información mínima previa (solo IP/Dominio). Simula atacante externo sin privilegios.\n• Greybox: Información extendida (URLs, subredes, credenciales de usuario básico).\n• Whitebox: Vista interna y acceso completo (código fuente, arquitectura, credenciales admin).",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Getting Started"
  },
  {
    concept_name: "Red-Teaming vs Purple-Teaming",
    content: "• Red-Teaming: Simulación de adversario real con foco en evasión, ingeniería social y pruebas físicas sin alerta previa a los defensores.\n• Purple-Teaming: Evaluación colaborativa donde el equipo atacante (Red) trabaja en conjunto con el equipo defensor (Blue) para optimizar la detección.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Getting Started"
  },
  {
    concept_name: "Leyes Internacionales de Ciberseguridad (CFAA, GDPR, Computer Misuse Act)",
    content: "• CFAA (EE.UU.) / Computer Misuse Act 1990 (UK): Sancionan el acceso no autorizado e intrusión a sistemas informáticos.\n• GDPR (Europa) / Data Protection Act 2018 (UK): Regula la protección y confidencialidad estricta de datos personales.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Getting Started"
  },
  {
    concept_name: "Etapa de Information Gathering (Recolección de Información)",
    content: "Fase crítica destinada a identificar y mapear de forma exhaustiva los sistemas, aplicaciones, redes y superficie de ataque objetivo antes de lanzar cualquier exploit. Previene pérdida de tiempo y descuidos severos.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Information Gathering - Web"
  },
  {
    concept_name: "4 Categorías de Information Gathering",
    content: "1) OSINT (Open-Source Intelligence)\n2) Infrastructure Enumeration (IPs, dominios, DNS, WAF/Firewall)\n3) Service Enumeration (banners, servicios expuestos y versiones)\n4) Host Enumeration (SO, aplicaciones locales e interfaces internas).",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Information Gathering - Web"
  },
  {
    concept_name: "OSINT (Open-Source Intelligence) en Pentesting",
    content: "Búsqueda de información pública en internet (redes sociales, repositorios GitHub/GitLab desconfigurados, registros DNS, ofertas laborales) que exponga credenciales, tokens, claves API o arquitectura interna.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Information Gathering - Web"
  },
  {
    concept_name: "Diferencia entre Service Enumeration y Host Enumeration",
    content: "• Service Enumeration: Analiza servicios expuestos hacia afuera, versiones de software y configuraciones vulnerables.\n• Host Enumeration: Analiza desde el interior del equipo el SO, servicios locales no expuestos a internet, archivos sensibles y privilegios.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Network Enumeration (Nmap)"
  },
  {
    concept_name: "Vulnerability Assessment: Escaneo Automático vs Análisis Manual",
    content: "• Vulnerability Assessment automatizado: Escanea mediante herramientas contra bases de datos de vulnerabilidades conocidas.\n• Análisis de vulnerabilidades manual: Requiere 'pensar fuera de la caja', correlacionar datos y comprender la lógica de negocio para descubrir brechas no detectables automáticamente.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Vulnerability Assessment"
  },
  {
    concept_name: "4 Tipos de Análisis en la Evaluación de Vulnerabilidades",
    content: "1) Descriptive: Describe el conjunto de datos e identifica anomalías.\n2) Diagnostic: Identifica causas e interacciones buscando razones de eventos.\n3) Predictive: Evalúa datos históricos para predecir probabilidades y tendencias futuras.\n4) Prescriptive: Recomienda acciones concretas para prevenir o mitigar problemas.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Vulnerability Assessment"
  },
  {
    concept_name: "Riesgo Inherente (Inherent Risk) en Ciberseguridad",
    content: "Es el nivel de riesgo que permanece de manera natural en los sistemas e infraestructura de una organización incluso después de haber implementado todos los controles de seguridad adecuados. Ningún pentest elimina el riesgo al 100%.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Vulnerability Assessment"
  },
  {
    concept_name: "Factores para Priorizar Ataques en la Etapa de Exploitation",
    content: "1) Probability of Success (calculada con CVSS Scoring).\n2) Complexity (esfuerzo, tiempo e investigación requerida para la vulnerabilidad).\n3) Probability of Damage (evaluar el impacto para garantizar la estabilidad y cero interrupción en producción).",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Vulnerability Assessment"
  },
  {
    concept_name: "Relevancia de Web Exploitation en Pentesting Externo",
    content: "Las aplicaciones web representan la principal superficie de ataque accesible externamente. Incluyen bases de datos, APIs e interfaces expuestas que requieren un dominio profundo de técnicas como SQLi, XSS, Command Injection y LFI/RFI.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Web Requests"
  },
  {
    concept_name: "Objetivos de Post-Exploitation y Pillaging",
    content: "• Post-Exploitation: Tras obtener acceso inicial (usualmente con usuario limitado), se busca escalar privilegios a root/SYSTEM/Domain Admin.\n• Pillaging: Recolección local de datos sensibles (credenciales almacenadas, tokens, bases de datos) en el equipo comprometido.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Linux PrivEsc"
  },
  {
    concept_name: "Niveles de Evasive Testing (Evasive, Hybrid-Evasive, Non-Evasive)",
    content: "• Evasive: Aplicar técnicas de evasión sigilosas para evitar alertar EDR, IDS/IPS y personal de monitoreo.\n• Hybrid-Evasive: Evaluar sistemas o departamentos específicos para probar alertas puntuales.\n• Non-Evasive: Ataques intrusivos y veloces para cubrir la mayor cantidad de superficie en tiempo acotado.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Getting Started"
  },
  {
    concept_name: "Importancia de Privilege Escalation (Escalación de Privilegios)",
    content: "Permite pasar de un usuario estándar con restricciones a la cuenta de máxima autoridad (`root` en Linux, `SYSTEM`/`Domain Admin` en Windows), desbloqueando el control total del host y facilitando el movimiento lateral.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Windows PrivEsc"
  },
  {
    concept_name: "Etapa de Lateral Movement (Movimiento Lateral)",
    content: "Desplazamiento desde un equipo comprometido hacia otros sistemas de la red interna. Simula el comportamiento de amenazas reales como el Ransomware para medir el impacto de la propagación interna.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Pivoting & Tunneling"
  },
  {
    concept_name: "Pivoting / Tunneling en Redes Internas",
    content: "Técnica para utilizar un host comprometido como proxy intermedio, permitiendo enrutar tráfico y escanear/atacar subredes privadas internas no ruteables directamente desde internet.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Pivoting & Tunneling"
  },
  {
    concept_name: "Proof of Concept (PoC) en la Documentación",
    content: "Evidencia técnica comprobable (capturas paso a paso o scripts de automatización) que demuestra que una vulnerabilidad existe y es reproducible, permitiendo a los administradores validar la falla sin afectar procesos críticos.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Documentation & Reporting"
  },
  {
    concept_name: "Actividades de Post-Engagement y Cleanup (Limpieza)",
    content: "Fase final donde se eliminan todas las herramientas, scripts, bind/reverse shells y archivos temporales subidos a los sistemas del cliente, restaurando el entorno al estado previo al pentest.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Documentation & Reporting"
  },
  {
    concept_name: "Estructura de un Reporte Profesional de Pentest",
    content: "1) Executive Summary (para audiencia directiva),\n2) Attack Chain (cadena del compromiso),\n3) Matriz de hallazgos con severidad CVSS e impacto,\n4) Pasos detallados para reproducir (PoC),\n5) Recomendaciones de remediación a corto, mediano y largo plazo,\n6) Apéndices técnicos.",
    topic: "1) Penetration Testing Process",
    author: "Hack The Box (CPTS)",
    category: "Documentation & Reporting"
  }
];

async function importData() {
  try {
    await initializeDatabase();
    const db = getPool();

    // Obtener los usuarios existentes para inyectarles las tarjetas
    const [users] = await db.execute('SELECT id, username FROM users');
    if (!users || users.length === 0) {
      console.error('⚠️ No se encontraron usuarios en la tabla users.');
      process.exit(1);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let insertedCount = 0;

    for (const user of users) {
      for (const card of MODULE_CARDS) {
        await db.execute(
          `INSERT INTO cybersecurity_cards 
            (user_id, concept_name, content, topic, author, category, next_review) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            card.concept_name,
            card.content,
            card.topic,
            card.author,
            card.category,
            todayStr
          ]
        );
        insertedCount++;
      }
    }

    console.log(`✅ Inyectadas ${insertedCount} tarjetas de Ciberseguridad (Módulo 1: Penetration Testing Process) para ${users.length} usuario(s).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inyectando tarjetas de ciberseguridad:', error);
    process.exit(1);
  }
}

importData();
