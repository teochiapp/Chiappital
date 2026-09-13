const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getPool, initializeDatabase } = require('./database/db');

const MODULE_CARDS = [
  {
    concept_name: "Enumeration vs OSINT",
    content: "OSINT es la recolección de información pasiva (sin interacción directa con el objetivo). La Enumeración puede ser activa (escaneos) o pasiva, pero el objetivo final es identificar todas las vías de acceso a los sistemas.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Methodology"
  },
  {
    concept_name: "Las 6 Capas de la Enumeración",
    content: "1. Presencia en Internet (Dominios, Cloud)\n2. Gateways (Firewalls, VPNs)\n3. Servicios Accesibles (Puertos, versiones)\n4. Procesos (Datos procesados)\n5. Privilegios (Usuarios, Permisos)\n6. Configuración del SO (Archivos sensibles)",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Methodology"
  },
  {
    concept_name: "Certificate Transparency (crt.sh)",
    content: "Es un registro público de todos los certificados SSL/TLS emitidos. Es invaluable para descubrir subdominios ocultos consultando los registros en formato JSON con curl o herramientas web.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "OSINT / DNS"
  },
  {
    concept_name: "Cloud Footprinting (AWS / Azure)",
    content: "Mala configuración en S3 Buckets o Azure Blobs a menudo expone archivos sensibles de la empresa. Se puede buscar con Google Dorks o servicios como GrayHatWarfare.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Cloud"
  },
  {
    concept_name: "FTP: Activo vs Pasivo",
    content: "Activo: El servidor inicia la conexión de datos hacia el cliente (bloqueado a menudo por firewalls). Pasivo: El cliente inicia la conexión de datos hacia un puerto aleatorio que indica el servidor.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "FTP"
  },
  {
    concept_name: "FTP: Autenticación Anónima (Anonymous Login)",
    content: "Es una configuración insegura muy común. Permite loguearse con el usuario `anonymous` (password en blanco o cualquier email). Permite descargar o subir archivos si los permisos lo permiten.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "FTP"
  },
  {
    concept_name: "SMB (Server Message Block) / Samba",
    content: "Protocolo para compartir archivos e impresoras. En Windows usa el puerto TCP 445 (o 139 via NetBIOS). Samba es la implementación para Unix/Linux. Herramientas: smbclient, rpcclient, crackmapexec.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "SMB"
  },
  {
    concept_name: "SMB: Null Session",
    content: "Conexión a un recurso compartido SMB sin proveer un nombre de usuario o contraseña válidos (autenticación anónima). Herramientas: `smbclient -N -L //IP` o `rpcclient -U \"\" IP`.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "SMB"
  },
  {
    concept_name: "NFS (Network File System)",
    content: "Sistema de archivos en red estándar en Unix/Linux. Usa el puerto TCP/UDP 2049 y el portmapper 111. Autentica por UID/GID, lo cual es inseguro si el atacante falsifica su UID.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "NFS"
  },
  {
    concept_name: "NFS: root_squash vs no_root_squash",
    content: "`root_squash` (default): Asigna permisos de 'anonymous' a los archivos creados por root. `no_root_squash`: Peligroso. Archivos creados por root en la carpeta montada conservan permisos de root.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "NFS"
  },
  {
    concept_name: "NFS: Enumeración básica",
    content: "Para ver qué carpetas exporta un servidor NFS usamos `showmount -e <IP>`. Luego podemos montarlo localmente con `sudo mount -t nfs <IP>:/carpeta ./carpeta_local`.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "NFS"
  },
  {
    concept_name: "Registros DNS (A, MX, NS, TXT)",
    content: "A: IPv4 | AAAA: IPv6 | MX: Servidores de Email | NS: Servidores de Nombres | TXT: Verificaciones de terceros, SPF, DMARC (útil para encontrar servicios cloud usados).",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "DNS"
  },
  {
    concept_name: "SMTP (Simple Mail Transfer Protocol)",
    content: "Envío de emails. Puertos: 25 (texto plano), 587 (STARTTLS). Un 'Open Relay' mal configurado permite a cualquiera enviar correos (útil para phishing/spam).",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Email (SMTP)"
  },
  {
    concept_name: "SMTP: Enumeración de Usuarios (VRFY / EXPN)",
    content: "Comandos por telnet/nc al puerto 25. `VRFY <usuario>` comprueba si el buzón existe. Muchos servidores lo deshabilitan, pero a veces devuelve el código 252 para usuarios inválidos (false positive).",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Email (SMTP)"
  },
  {
    concept_name: "IMAP y POP3",
    content: "Protocolos para LEER emails. POP3 (TCP 110, 995 SSL) descarga los correos. IMAP (TCP 143, 993 SSL) los gestiona en el servidor (sincroniza carpetas).",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Email (IMAP/POP3)"
  },
  {
    concept_name: "SNMP (Simple Network Management Protocol)",
    content: "Monitoreo y gestión de red. Usa puerto UDP 161 (162 para Traps). Versiones 1 y 2c envían las 'Community Strings' en TEXTO PLANO. v3 añadió cifrado y autenticación fuerte.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "SNMP"
  },
  {
    concept_name: "SNMP: Community Strings",
    content: "Funcionan como contraseñas. Comúnmente las predeterminadas son 'public' (solo lectura) y 'private' (lectura/escritura). Herramientas para enumerar OIDs: `snmpwalk`, `onesixtyone`.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "SNMP"
  },
  {
    concept_name: "Base de Datos: MSSQL (Microsoft SQL)",
    content: "Por defecto en puerto TCP 1433. Impacket's `mssqlclient.py` es ideal para interactuar remotamente. Bases de datos del sistema: master, model, msdb, tempdb, resource.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Databases"
  },
  {
    concept_name: "Base de Datos: Oracle TNS",
    content: "Transparent Network Substrate. Por defecto en puerto TCP 1521. Usa SIDs para identificar instancias (pueden ser bruteforceadas). Herramienta estrella: ODAT (Oracle Database Attacking Tool).",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Databases"
  },
  {
    concept_name: "IPMI (Intelligent Platform Management Interface)",
    content: "Sistema para administrar hardware de forma remota (Ej. HP iLO, Dell iDRAC). Usa el puerto UDP 623. Vulnerabilidad crítica en v2.0: 'RAKP flaw' permite dumpear hashes de contraseñas offline.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "IPMI"
  },
  {
    concept_name: "Windows Remote Management (WinRM / RDP)",
    content: "RDP: Puerto TCP 3389 (Escritorio Remoto). WinRM: Puerto TCP 5985 (HTTP) y 5986 (HTTPS), protocolo de administración por consola que usa SOAP.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Windows Management"
  },
  {
    concept_name: "Linux Remote Management (SSH / Rsync / R-Services)",
    content: "SSH (TCP 22): Seguro, autenticación con password o llaves asimétricas. Rsync (TCP 873): Sincronización de archivos. R-Services (TCP 512, 513, 514): rlogin, rsh. Obsoletos, sin cifrar, dependen del archivo .rhosts.",
    topic: "4) Footprinting",
    author: "Hack The Box (CPTS)",
    category: "Linux Management"
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

    console.log(`✅ Inyectadas ${insertedCount} tarjetas de Ciberseguridad (Módulo 4: Footprinting) para ${users.length} usuario(s).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inyectando tarjetas de ciberseguridad:', error);
    process.exit(1);
  }
}

importData();
