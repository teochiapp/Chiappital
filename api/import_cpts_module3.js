const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getPool, initializeDatabase } = require('./database/db');

const MODULE_CARDS = [
  {
    concept_name: "Objetivo de la Enumeración en Pentesting",
    content: "No es solo ganar acceso, sino identificar todas las posibles vías de ataque (interacciones y recursos). La enumeración manual es clave para comprender cómo funcionan los servicios, más allá de usar escáneres automáticos.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Enumeration Concepts"
  },
  {
    concept_name: "¿Qué es Nmap (Network Mapper)?",
    content: "Herramienta open-source para auditar seguridad y mapear redes. Sirve para descubrir hosts vivos, puertos abiertos, servicios/versiones, identificar el SO (OS detection) y evadir Firewalls/IDS.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Nmap Basics"
  },
  {
    concept_name: "Técnica de Escaneo TCP SYN (-sS)",
    content: "Escaneo rápido y sigiloso por defecto (requiere sudo). Envía paquete SYN. Si responde SYN-ACK el puerto está ABIERTO. Si responde RST está CERRADO. Si no responde (drop) está FILTRADO.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Port Scanning"
  },
  {
    concept_name: "Host Discovery (Descubrimiento de equipos vivos)",
    content: "Comando básico: `nmap -sn 10.129.2.0/24`. El flag `-sn` deshabilita el escaneo de puertos (antes conocido como ping sweep), limitándose a comprobar si los hosts están activos.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Host Discovery"
  },
  {
    concept_name: "Nmap: Los 6 estados de un puerto",
    content: "1) open (responde), 2) closed (RST), 3) filtered (firewall bloquea/drop), 4) unfiltered (accesible pero estado incierto en scan ACK), 5) open|filtered (UDP o sin respuesta), 6) closed|filtered (Idle scan).",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Port Scanning"
  },
  {
    concept_name: "Opciones de Selección de Puertos en Nmap",
    content: "• `-p 22,80`: Puertos específicos.\n• `-p-`: Escanea los 65535 puertos.\n• `-F`: Fast scan (top 100 puertos).\n• `--top-ports=10`: Los 10 puertos más comunes.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Port Scanning"
  },
  {
    concept_name: "Escaneo de Puertos UDP (-sU)",
    content: "El escaneo UDP es mucho más lento porque es un protocolo 'stateless' (sin handshake) y Nmap debe esperar el timeout. Muchos firewalls olvidan filtrar UDP, exponiendo servicios críticos (ej. DNS, SNMP).",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Port Scanning"
  },
  {
    concept_name: "Guardar Resultados (Output Formats)",
    content: "• `-oN file.nmap`: Normal.\n• `-oG file.gnmap`: Grepable (fácil de procesar con grep).\n• `-oX file.xml`: XML (convertible a HTML con `xsltproc`).\n• `-oA file`: Guarda los 3 formatos simultáneamente.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Nmap Basics"
  },
  {
    concept_name: "Detección de Versiones y Servicios (-sV)",
    content: "El flag `-sV` analiza las respuestas de los puertos abiertos para identificar exactamente la aplicación y versión en ejecución. Vital para buscar exploits específicos en `searchsploit`.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Service Enumeration"
  },
  {
    concept_name: "Nmap Scripting Engine (NSE)",
    content: "Scripts en Lua para automatizar tareas. Se agrupan en categorías: auth, vuln, exploit, default, safe. El flag `-sC` ejecuta los scripts por defecto. Se especifican con `--script <nombre_o_categoria>`.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "NSE Scripts"
  },
  {
    concept_name: "Escaneo Agresivo (-A)",
    content: "El flag `-A` agrupa detección de SO, detección de versión (-sV), escaneo de scripts por defecto (-sC) y traceroute. Es ruidoso pero proporciona una visión muy completa del objetivo rápidamente.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Nmap Basics"
  },
  {
    concept_name: "Vulnerability Assessment automático con Nmap",
    content: "Usando el flag `--script vuln`, Nmap ejecutará la categoría de scripts de vulnerabilidades, consultando bases de datos (como vulners) para detectar fallos conocidos (CVEs) en los servicios encontrados.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "NSE Scripts"
  },
  {
    concept_name: "Performance y Velocidad de Escaneo",
    content: "• `--min-rate 300`: Envía mínimo 300 paquetes/segundo.\n• `--max-retries 0`: No reintenta si un paquete se pierde (baja fiabilidad, sube velocidad).\n• `-T<0-5>`: Plantillas de tiempo (T3 normal, T4 agresivo, T5 insano).",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Performance & Timing"
  },
  {
    concept_name: "Firewall Evasion: Escaneo TCP ACK (-sA)",
    content: "Envía paquetes solo con flag ACK. Útil para mapear reglas del firewall. Como simula tráfico de conexiones ya establecidas, los firewalls 'stateless' suelen dejarlos pasar, retornando RST si el puerto no está filtrado.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Firewall Evasion"
  },
  {
    concept_name: "Firewall Evasion: Señuelos (Decoys -D)",
    content: "Camufla la IP real del atacante inyectando direcciones IP falsas en el tráfico. Comando: `-D RND:5` genera 5 IPs aleatorias, escondiendo nuestra IP entre ellas para confundir al administrador o IDS.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Firewall Evasion"
  },
  {
    concept_name: "Firewall Evasion: Source Port Spoofing",
    content: "Los administradores a veces confían ciegamente en tráfico proveniente de puertos comunes (ej. DNS - 53, HTTP - 80). Se puede evadir el firewall seteando nuestro puerto de origen: `--source-port 53`.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Firewall Evasion"
  },
  {
    concept_name: "Extracción manual de Versión DNS (CHAOS TXT)",
    content: "Si Nmap no logra identificar la versión de un servidor DNS, se puede consultar el registro especial CHAOS manualmente: `dig @<IP> version.bind CHAOS TXT`.",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Labs & Cheatsheet"
  },
  {
    concept_name: "Combo Clásico HTB: Enumeración Inicial Completa",
    content: "Comando: `sudo nmap -sS -sC -sV -p- 10.10.10.10`\nObjetivo: Escanear todos los puertos TCP (-p-), detectar versiones (-sV), ejecutar scripts por defecto (-sC) con SYN Scan (-sS).",
    topic: "3) Nmap & Enumeration",
    author: "Hack The Box (CPTS)",
    category: "Labs & Cheatsheet"
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

    console.log(`✅ Inyectadas ${insertedCount} tarjetas de Ciberseguridad (Módulo 3: Nmap & Enumeration) para ${users.length} usuario(s).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inyectando tarjetas de ciberseguridad:', error);
    process.exit(1);
  }
}

importData();
