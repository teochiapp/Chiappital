# Firewall and IDS/IPS Evasion

# **Firewall and IDS/IPS Evasion**

---

`Nmap` gives us many different ways to bypass firewalls rules and IDS/IPS. These methods include the fragmentation of packets, the use of decoys, and others that we will discuss in this section.

# **Firewalls**

A firewall is a security measure against unauthorized connection attempts from external networks. Every firewall security system is based on a software component that monitors network traffic between the firewall and incoming data connections and decides how to handle the connection based on the rules that have been set. It checks whether individual network packets are being passed, ignored, or blocked. This mechanism is designed to prevent unwanted connections that could be potentially dangerous.

# **IDS/IPS**

Like the firewall, the intrusion detection system (`IDS`) and intrusion prevention system (`IPS`) are also software-based components. `IDS` scans the network for potential attacks, analyzes them, and reports any detected attacks. `IPS` complements `IDS` by taking specific defensive measures if a potential attack should have been detected. The analysis of such attacks is based on pattern matching and signatures. If specific patterns are detected, such as a service detection scan, `IPS` may prevent the pending connection attempts

### **Determine Firewalls and Their Rules**

We already know that when a port is shown as filtered, it can have several reasons. In most cases, firewalls have certain rules set to handle specific connections. The packets can either be `dropped`, or `rejected`. The `dropped` packets are ignored, and no response is returned from the host.

ICMP can contain different types of error codes.

Such errors include:

- Net Unreachable
- Net Prohibited
- Host Unreachable
- Host Prohibited
- Port Unreachable
- Proto Unreachable

Nmap's TCP ACK scan (`-sA`) method is much harder to filter for firewalls and IDS/IPS systems than regular SYN (`-sS`) or Connect scans (`sT`) because they only send a TCP packet with only the `ACK` flag

When a port is closed or open, the host must respond with an `RST` flag. Unlike outgoing connections, all connection attempts (with the `SYN` flag) from external networks are usually blocked by firewalls

However, the packets with the `ACK` flag are often passed by the firewall because the firewall cannot determine whether the connection was first established from the external network or the internal network.

# **Detect IDS/IPS**

Unlike firewalls and their rules, the detection of IDS/IPS systems is much more difficult because these are passive traffic monitoring systems. `IDS systems` examine all connections between hosts. If the IDS finds packets containing the defined contents or specifications, the administrator is notified and takes appropriate action in the worst case.

`IPS systems` take measures configured by the administrator independently to prevent potential attacks automatically. It is essential to know that IDS and IPS are different applications and that IPS serves as a complement to IDS.

Several virtual private servers (`VPS`) with different IP addresses are recommended to determine whether such systems are on the target network during a penetration test.

• One method to determine whether such `IPS system` is present in the target network is to scan from a single host (`VPS`). If at any time this host is blocked and has no access to the target network, we know that the administrator has taken some security measures. Accordingly, we can continue our penetration test with another `VPS`.

# **Decoys**

There are cases in which administrators block specific subnets from different regions in principle. This prevents any access to the target network. Another example is when IPS should block us. For this reason, the Decoy scanning method (`-D`) is the right choice. With this method, Nmap generates various random IP addresses inserted into the IP header to disguise the origin of the packet sent. With this method, we can generate random (`RND`) a specific number (for example: `5`) of IP addresses separated by a colon (`:`). Our real IP address is then randomly placed between the generated IP addresses.

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.28` | Scans the specified target. |
| `-p 80` | Scans only the specified ports. |
| `-sS` | Performs SYN scan on specified ports. |
| `-Pn` | Disables ICMP Echo requests. |
| `-n` | Disables DNS resolution. |
| `--disable-arp-ping` | Disables ARP ping. |
| `--packet-trace` | Shows all packets sent and received. |
| `-D RND:5` | Generates five random IP addresses that indicates the source IP the connection comes from. |

# **DNS Proxying**

By default, `Nmap` performs a reverse DNS resolution unless otherwise specified to find more important information about our target. These DNS queries are also passed in most cases because the given web server is supposed to be found and visited. The DNS queries are made over the `UDP port 53`. The `TCP port 53` was previously only used for the so-called "`Zone transfers`" between the DNS servers or data transfer larger than 512 bytes. More and more, this is changing due to IPv6 and DNSSEC expansions. These changes cause many DNS requests to be made via TCP port 53.

However, `Nmap` still gives us a way to specify DNS servers ourselves (`--dns-server <ns>,<ns>`). This method could be fundamental to us if we are in a demilitarized zone (`DMZ`). The company's DNS servers are usually more trusted than those from the Internet

If the administrator uses the firewall to control this port and does not filter IDS/IPS properly, our TCP packets will be trusted and passed through.

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.28` | Scans the specified target. |
| `-p 50000` | Scans only the specified ports. |
| `-sS` | Performs SYN scan on specified ports. |
| `-Pn` | Disables ICMP Echo requests. |
| `-n` | Disables DNS resolution. |
| `--disable-arp-ping` | Disables ARP ping. |
| `--packet-trace` | Shows all packets sent and received. |
| `--source-port 53` | Performs the scans from specified source port. |