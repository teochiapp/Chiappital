const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getPool, initializeDatabase } = require('./database/db');

const MODULE_CARDS = [
  {
    concept_name: "Web Reconnaissance: Active vs Passive",
    content: "Active Recon interactúa directamente con el objetivo (Port Scanning, Banner Grabbing, Spidering) y puede ser detectado. Passive Recon recopila información sin contacto directo (WHOIS, CT Logs, OSINT, Wayback Machine).",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Methodology"
  },
  {
    concept_name: "Protocolo WHOIS",
    content: "Consulta bases de datos públicas para obtener información sobre registro de dominios. Revela registradores, dueños, contactos administrativos/técnicos, fechas de creación/expiración y servidores DNS.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Passive Recon"
  },
  {
    concept_name: "Jerarquía DNS",
    content: "1. Resolvers (DNS de tu ISP) -> 2. Root Name Servers (.) -> 3. TLD Name Servers (.com, .org) -> 4. Authoritative Name Server (dueño del dominio, quien tiene la IP real).",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "DNS"
  },
  {
    concept_name: "Registros DNS Comunes (A, CNAME, MX, TXT)",
    content: "A/AAAA: Mapea hostname a IP (v4/v6).\nCNAME: Alias hacia otro dominio.\nMX: Servidores de Email.\nNS: Name Servers autoritativos.\nTXT: Verificaciones, SPF, DMARC (útil para descubrir servicios cloud).",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "DNS"
  },
  {
    concept_name: "Archivo Hosts (/etc/hosts)",
    content: "Archivo local (en Windows/Linux) que mapea hostnames a IPs. Se procesa ANTES que las consultas DNS, permitiendo sobrescribir dominios de forma manual (útil en pentesting para VHosts).",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "DNS"
  },
  {
    concept_name: "dig (Domain Information Groper)",
    content: "Herramienta principal para consultar DNS. Ejemplos: `dig domain.com ANY` (trae todos los registros), `dig @1.1.1.1 domain.com` (usa otro resolver), `dig +short domain.com` (solo respuesta corta).",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "DNS"
  },
  {
    concept_name: "DNS Zone Transfer (AXFR)",
    content: "Mecanismo para replicar registros DNS entre servidores. Si está mal configurado, un atacante puede descargar todos los registros (subdominios incluidos). Comando: `dig axfr @ns.dominio.com dominio.com`.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "DNS"
  },
  {
    concept_name: "Fuzzing / Bruteforcing de Subdominios",
    content: "Técnica activa que prueba palabras de un diccionario (ej. SecLists) como subdominios contra un servidor DNS. Herramientas clave: dnsenum, gobuster, ffuf.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Subdomains"
  },
  {
    concept_name: "Certificate Transparency (CT) Logs",
    content: "Registros públicos y transparentes de todos los certificados SSL/TLS emitidos. Permite descubrir subdominios reales y pasados sin hacer fuerza bruta. Sitios útiles: crt.sh, Censys.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Subdomains / OSINT"
  },
  {
    concept_name: "Virtual Hosts (VHosts) vs Subdominios",
    content: "Múltiples sitios en una sola IP. El servidor lee el header HTTP 'Host' para saber cuál mostrar. Algunos VHosts son internos y NO tienen registros DNS públicos. Se descubren haciendo 'VHost Fuzzing'.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "VHosts"
  },
  {
    concept_name: "VHost Fuzzing con Gobuster",
    content: "Fuerza bruta al header Host para hallar dominios ocultos en una misma IP. Comando: `gobuster vhost -u http://<IP> -w <wordlist> --append-domain`.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "VHosts"
  },
  {
    concept_name: "Fingerprinting de Tecnologías",
    content: "Extraer detalles técnicos (servidor, SO, frameworks). Se logra mediante: Banner Grabbing (curl -I), análisis de HTTP Headers y contenido. Herramientas: Wappalyzer, WhatWeb, BuiltWith, Nikto.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Fingerprinting"
  },
  {
    concept_name: "WAF Detection (wafw00f)",
    content: "Web Application Firewalls. Herramienta `wafw00f` envía payloads inofensivos para identificar si hay un WAF (ej. Cloudflare, Wordfence) y qué reglas aplica, antes de lanzar ataques agresivos.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Fingerprinting"
  },
  {
    concept_name: "Web Crawling (Spidering)",
    content: "Navegación automatizada de una web siguiendo sus enlaces. Se utiliza para descubrir rutas, archivos, parámetros, y recolectar comentarios/metadata. Herramientas: ZAP Spider, Burp Spider, Scrapy.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Crawling"
  },
  {
    concept_name: "robots.txt",
    content: "Estándar de exclusión para bots ubicado en la raíz. Define qué rutas (`Disallow: /admin`) NO deben ser escaneadas. En web recon, es oro puro para descubrir directorios sensibles o 'honeypots'.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Crawling"
  },
  {
    concept_name: "URIs Well-Known (/.well-known/)",
    content: "Directorio estandarizado (RFC 8615) que centraliza metadata clave de una web. Ejemplos: `security.txt` (contactos de seguridad), `openid-configuration` (endpoints OAuth/OIDC).",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Crawling"
  },
  {
    concept_name: "Google Dorking (Search Operators)",
    content: "Uso avanzado de buscadores para OSINT. `site:dominio.com` (limita dominio), `inurl:login` (busca logins), `filetype:pdf` (archivos), `intitle:index of` (directorios expuestos).",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "OSINT"
  },
  {
    concept_name: "Wayback Machine",
    content: "Archivo histórico de internet. Permite ver snapshots antiguos de una web. Útil para encontrar endpoints olvidados (ghost endpoints), credenciales hardcodeadas en versiones viejas, o contenido borrado.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "OSINT"
  },
  {
    concept_name: "Automatización de Reconocimiento",
    content: "Frameworks para ejecutar mútiples herramientas juntas de manera eficiente. Ejemplos: FinalRecon (reconocimiento web completo en Python), theHarvester (emails, subdominios OSINT), Recon-ng.",
    topic: "5) Info Gathering - Web",
    author: "Hack The Box (CPTS)",
    category: "Methodology"
  }
];

async function importData() {
  try {
    await initializeDatabase();
    const db = getPool();

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

    console.log(`✅ Inyectadas ${insertedCount} tarjetas de Ciberseguridad (Módulo 5: Info Gathering - Web) para ${users.length} usuario(s).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inyectando tarjetas de ciberseguridad:', error);
    process.exit(1);
  }
}

importData();
