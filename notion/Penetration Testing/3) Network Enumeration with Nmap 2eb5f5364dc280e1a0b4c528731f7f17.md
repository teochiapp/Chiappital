# 3) Network Enumeration with Nmap

[Introduction](3)%20Network%20Enumeration%20with%20Nmap/Introduction%202ed5f5364dc280dda770e6c7d7a73ecd.md)

[Host Discovery](3)%20Network%20Enumeration%20with%20Nmap/Host%20Discovery%202ed5f5364dc280e8ab4bc19c6b87d5a4.md)

[**Firewall and IDS/IPS Evasion**](3)%20Network%20Enumeration%20with%20Nmap/Firewall%20and%20IDS%20IPS%20Evasion%202ed5f5364dc280b1a5aaf31fcdfacf9e.md)

[Labs Learned](3)%20Network%20Enumeration%20with%20Nmap/Labs%20Learned%202ed5f5364dc280538926d80754e2ceac.md)

# CheatSheet

## 🧠 NMAP CHEATSHEET — *Mentalidad de Pentester*

| Flag / Sintaxis | Código | ¿Qué hace técnicamente? | 🧠 Mentalidad de pentester |
| --- | --- | --- | --- |
| **TCP SYN Scan** | `-sS` | Envía SYN, no completa handshake | *“Golpeo la puerta sin entrar”* |
| **TCP Connect Scan** | `-sT` | Completa el 3-way handshake | *“Entro como un usuario normal”* |
| **Default Scripts** | `-sC` | Ejecuta scripts NSE por defecto | *“Decime TODO lo interesante sin romper nada”* |
| **Service Version** | `-sV` | Detecta versión del servicio | *“¿Exactamente qué estás corriendo?”* |
| **ACK Scan** | `-sA` | Mapea reglas de firewall | *“¿Mi paquete llega o el firewall lo frena?”* |
| **UDP Scan** | `-sU` | Escanea servicios UDP | *“Lo lento y silencioso también importa”* |
| **All Ports** | `-p-` | Escanea 1–65535 | *“Nada se escapa”* |
| **Specific Ports** | `-p 22,80,443` | Solo puertos indicados | *“Voy directo a lo importante”* |
| **Top Ports** | `--top-ports 1000` | Puertos más comunes | *“Probá primero lo más probable”* |
| **Aggressive Scan** | `-A` | Scripts + versiones + OS | *“Mostrame TODO, rápido”* |
| **OS Detection** | `-O` | Detecta sistema operativo | *“¿Quién sos realmente?”* |
| **Disable Ping** | `-Pn` | No hace host discovery | *“Aunque no respondas, te escaneo igual”* |
| **Fast Scan** | `-F` | Menos puertos, más rápido | *“Velocidad sobre profundidad”* |
| **Min Rate** | `--min-rate 1000` | Aumenta velocidad | *“Fuerza bruta de paquetes”* |
| **Timing** | `-T4` | Acelera el scan | *“Rápido, pero sin hacer ruido extremo”* |
| **Packet Trace** | `--packet-trace` | Muestra paquetes | *“Quiero ver qué está pasando realmente”* |
| **Reason** | `--reason` | Muestra por qué decidió el estado | *“Explicame tu conclusión”* |

## 🔥 Combos mentales (para recordar)

### 🔍 Enumeración inicial (clásico HTB)

```bash
sudo nmap -sS -sC -sV -p- 10.10.10.10

```

🧠 *“Abrí todo, contame qué sos y qué exponés”*

---

### 🧱 Firewall / Filtrado

```bash
sudo nmap -sA -p 1-1000 10.10.10.10

```

🧠 *“No me importa el servicio, quiero saber si me bloqueás”*

---

### ⚡ Scan rápido

```bash
nmap -T4 -F 10.10.10.10

```

🧠 *“Dame una idea general ya”*

---

### 🕵️‍♂️ Sin hacer ruido

```bash
sudo nmap -sS -T2 10.10.10.10

```

🧠 *“Entrar sin que nadie se dé cuenta”*