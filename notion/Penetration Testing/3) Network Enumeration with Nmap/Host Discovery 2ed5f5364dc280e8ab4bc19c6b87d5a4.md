# Host Discovery

## Host Discovery

### **Scan Network Range**

Host Discovery

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.0/24 -sn -oA tnet | grep for | cut -d" " -f5

10.129.2.4
10.129.2.10
10.129.2.11
10.129.2.18
10.129.2.19
10.129.2.20
10.129.2.28

```

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.0/24` | Target network range. |
| `-sn` | Disables port scanning. |
| `-oA tnet` | Stores the results in all formats starting with the name 'tnet'. |

This scanning method works only if the firewalls of the hosts allow it. Otherwise, we can use other scanning techniques to find out if the hosts are active or not. We will take a closer look at these techniques in "`Firewall and IDS Evasion`".

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.18` | Performs defined scans against the target. |
| `-sn` | Disables port scanning. |
| `-oA host` | Stores the results in all formats starting with the name 'host'. |
| `-PE` | Performs the ping scan by using 'ICMP Echo requests' against the target. |
| `--reason` | Displays the reason for specific result. |

# **Host and Port Scanning**

---

There are a total of 6 different states for a scanned port we can obtain:

| **State** | **Description** |
| --- | --- |
| `open` | This indicates that the connection to the scanned port has been established. These connections can be **TCP connections**, **UDP datagrams** as well as **SCTP associations**. |
| `closed` | When the port is shown as closed, the TCP protocol indicates that the packet we received back contains an `RST` flag. This scanning method can also be used to determine if our target is alive or not. |
| `filtered` | Nmap cannot correctly identify whether the scanned port is open or closed because either no response is returned from the target for the port or we get an error code from the target. |
| `unfiltered` | This state of a port only occurs during the **TCP-ACK** scan and means that the port is accessible, but it cannot be determined whether it is open or closed. |
| `open|filtered` | If we do not get a response for a specific port, `Nmap` will set it to that state. This indicates that a firewall or packet filter may protect the port. |
| `closed|filtered` | This state only occurs in the **IP ID idle** scans and indicates that it was impossible to determine if the scanned port is closed or filtered by a firewall. |

We can define the ports one by one (`-p 22,25,80,139,445`), by range (`-p 22-445`), by top ports (`--top-ports=10`) from the `Nmap` database that have been signed as most frequent, by scanning all ports (`-p-`) but also by defining a fast port scan, which contains top 100 ports (`-F`).

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.28` | Scans the specified target. |
| `--top-ports=10` | Scans the specified top ports that have been defined as most frequent. |

### **Nmap - Trace the Packets**

Host and Port Scanning

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.28 -p 21 --packet-trace -Pn -n --disable-arp-ping

Starting Nmap 7.80 ( https://nmap.org ) at 2020-06-15 15:39 CEST
SENT (0.0429s) TCP 10.10.14.2:63090 > 10.129.2.28:21 S ttl=56 id=57322 iplen=44  seq=1699105818 win=1024 <mss 1460>
RCVD (0.0573s) TCP 10.129.2.28:21 > 10.10.14.2:63090 RA ttl=64 id=0 iplen=40  seq=0 win=0
Nmap scan report for 10.129.2.28
Host is up (0.014s latency).

PORT   STATE  SERVICE
21/tcp closed ftp
MAC Address: DE:AD:00:00:BE:EF (Intel Corporate)

Nmap done: 1 IP address (1 host up) scanned in 0.07 seconds

```

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.28` | Scans the specified target. |
| `-p 21` | Scans only the specified port. |
| `--packet-trace` | Shows all packets sent and received. |
| `-n` | Disables DNS resolution. |
| `--disable-arp-ping` | Disables ARP ping. |

### **Request**

| **Message** | **Description** |
| --- | --- |
| `SENT (0.0429s)` | Indicates the SENT operation of Nmap, which sends a packet to the target. |
| `TCP` | Shows the protocol that is being used to interact with the target port. |
| `10.10.14.2:63090 >` | Represents our IPv4 address and the source port, which will be used by Nmap to send the packets. |
| `10.129.2.28:21` | Shows the target IPv4 address and the target port. |
| `S` | SYN flag of the sent TCP packet. |
| `ttl=56 id=57322 iplen=44 seq=1699105818 win=1024 mss 1460` | Additional TCP Header parameters. |

### **Response**

| **Message** | **Description** |
| --- | --- |
| `RCVD (0.0573s)` | Indicates a received packet from the target. |
| `TCP` | Shows the protocol that is being used. |
| `10.129.2.28:21 >` | Represents targets IPv4 address and the source port, which will be used to reply. |
| `10.10.14.2:63090` | Shows our IPv4 address and the port that will be replied to. |
| `RA` | RST and ACK flags of the sent TCP packet. |
| `ttl=64 id=0 iplen=40 seq=0 win=0` | Additional TCP Header parameters. |

### **Connect Scan on TCP Port 443**

Host and Port Scanning

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.28 -p 443 --packet-trace --disable-arp-ping -Pn -n --reason -sT

Starting Nmap 7.80 ( https://nmap.org ) at 2020-06-15 16:26 CET
CONN (0.0385s) TCP localhost > 10.129.2.28:443 => Operation now in progress
CONN (0.0396s) TCP localhost > 10.129.2.28:443 => Connected
Nmap scan report for 10.129.2.28
Host is up, received user-set (0.013s latency).

PORT    STATE SERVICE REASON
443/tcp open  https   syn-ack

Nmap done: 1 IP address (1 host up) scanned in 0.04 seconds
```

# **Filtered Ports**

When a port is shown as filtered, it can have several reasons. In most cases, firewalls have certain rules set to handle specific connections. The packets can either be `dropped`, or `rejected`. When a packet gets dropped, `Nmap` receives no response from our target, and by default, the retry rate (`--max-retries`) is set to `10`. This means `Nmap` will resend the request to the target port to determine if the previous packet was accidentally mishandled or not.

# **Discovering Open UDP Ports**

Some system administrators sometimes forget to filter the UDP ports in addition to the TCP ones. Since `UDP` is a `stateless protocol` and does not require a three-way handshake like TCP. We do not receive any acknowledgment. Consequently, the timeout is much longer, making the whole `UDP scan` (`-sU`) much slower than the `TCP scan` (`-sS`).

### **UDP Port Scan**

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.28 -F -sU

Starting Nmap 7.80 ( https://nmap.org ) at 2020-06-15 16:01 CEST
Nmap scan report for 10.129.2.28
Host is up (0.059s latency).
Not shown: 95 closed ports
PORT     STATE         SERVICE
68/udp   open|filtered dhcpc
137/udp  open          netbios-ns
138/udp  open|filtered netbios-dgm
631/udp  open|filtered ipp
5353/udp open          zeroconf
MAC Address: DE:AD:00:00:BE:EF (Intel Corporate)

Nmap done: 1 IP address (1 host up) scanned in 98.07 seconds

```

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.28` | Scans the specified target. |
| `-F` | Scans top 100 ports. |
| `-sU` | Performs a UDP scan. |

Another handy method for scanning ports is the `-sV` option which is used to get additional available information from the open ports. This method can identify versions, service names, and details about our target.

# **Saving the Results**

---

# **Different Formats**

`Nmap` can save the results in 3 different formats.

- Normal output (`oN`) with the `.nmap` file extension
- Grepable output (`oG`) with the `.gnmap` file extension
- XML output (`oX`) with the `.xml` file extension

We can also specify the option (`-oA`) to save the results in all formats. The command could look like this:

Saving the Results

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.28 -p- -oA target

Starting Nmap 7.80 ( https://nmap.org ) at 2020-06-16 12:14 CEST
Nmap scan report for 10.129.2.28
Host is up (0.0091s latency).
Not shown: 65525 closed ports
PORT      STATE SERVICE
22/tcp    open  ssh
25/tcp    open  smtp
80/tcp    open  http
MAC Address: DE:AD:00:00:BE:EF (Intel Corporate)

Nmap done: 1 IP address (1 host up) scanned in 10.22 seconds
```

If no full path is given, the results will be stored in the directory we are currently in. Next, we look at the different formats `Nmap` has created for us.

Saving the Results

```bash
Teophylus@htb[/htb]$ ls

target.gnmap target.xml  target.nmap
```

# **Style sheets**

With the XML output, we can easily create HTML reports that are easy to read, even for non-technical people. This is later very useful for documentation, as it presents our results in a detailed and clear way

To convert the stored results from XML format to HTML, we can use the tool `xsltproc`.

# **Service Enumeration**

---

For us, it is essential to determine the application and its version as accurately as possible.

We can use this information to scan for known vulnerabilities and analyze the source code for that version if we find it. An exact version number allows us to search for a more precise exploit that fits the service and the operating system of our target.

# **Service Version Detection**

It is recommended to perform a quick port scan first, which gives us a small overview of the available ports. This causes significantly less traffic

Another option (`--stats-every=5s`) that we can use is defining how periods of time the status should be shown. Here we can specify the number of seconds (`s`) or minutes (`m`), after which we want to get the status.

We can also increase the `verbosity level` (`-v` / `-vv`), which will show us the open ports directly when `Nmap` detects them.

One disadvantage to `Nmap`'s presented results is that the automatic scan can miss some information because sometimes `Nmap` does not know how to handle it. Let us look at an example of this.

### **Tcpdump - Intercepted Traffic**

Service Enumeration

```bash
18:28:07.128564 IP 10.10.14.2.59618 > 10.129.2.28.smtp: Flags [S], seq 1798872233, win 65535, options [mss 1460,nop,wscale 6,nop,nop,TS val 331260178 ecr 0,sackOK,eol], length 0
18:28:07.255151 IP 10.129.2.28.smtp > 10.10.14.2.59618: Flags [S.], seq 1130574379, ack 1798872234, win 65160, options [mss 1460,sackOK,TS val 1800383922 ecr 331260178,nop,wscale 7], length 0
18:28:07.255281 IP 10.10.14.2.59618 > 10.129.2.28.smtp: Flags [.], ack 1, win 2058, options [nop,nop,TS val 331260304 ecr 1800383922], length 0
18:28:07.319306 IP 10.129.2.28.smtp > 10.10.14.2.59618: Flags [P.], seq 1:36, ack 1, win 510, options [nop,nop,TS val 1800383985 ecr 331260304], length 35: SMTP: 220 inlane ESMTP Postfix (Ubuntu)
18:28:07.319426 IP 10.10.14.2.59618 > 10.129.2.28.smtp: Flags [.], ack 36, win 2058, options [nop,nop,TS val 331260368 ecr 1800383985], length 0

```

The first three lines show us the three-way handshake.

|  |  |  |
| --- | --- | --- |
| 1. | `[SYN]` | `18:28:07.128564 IP 10.10.14.2.59618 > 10.129.2.28.smtp: Flags [S], <SNIP>` |
| 2. | `[SYN-ACK]` | `18:28:07.255151 IP 10.129.2.28.smtp > 10.10.14.2.59618: Flags [S.], <SNIP>` |
| 3. | `[ACK]` | `18:28:07.255281 IP 10.10.14.2.59618 > 10.129.2.28.smtp: Flags [.], <SNIP>` |

# **Nmap Scripting Engine**

---

Nmap Scripting Engine (`NSE`) is another handy feature of `Nmap`. It provides us with the possibility to create scripts in Lua for interaction with certain services. There are a total of 14 categories into which these scripts can be divided:

| **Category** | **Description** |
| --- | --- |
| `auth` | Determination of authentication credentials. |
| `broadcast` | Scripts, which are used for host discovery by broadcasting and the discovered hosts, can be automatically added to the remaining scans. |
| `brute` | Executes scripts that try to log in to the respective service by brute-forcing with credentials. |
| `default` | Default scripts executed by using the `-sC` option. |
| `discovery` | Evaluation of accessible services. |
| `dos` | These scripts are used to check services for denial of service vulnerabilities and are used less as it harms the services. |
| `exploit` | This category of scripts tries to exploit known vulnerabilities for the scanned port. |
| `external` | Scripts that use external services for further processing. |
| `fuzzer` | This uses scripts to identify vulnerabilities and unexpected packet handling by sending different fields, which can take much time. |
| `intrusive` | Intrusive scripts that could negatively affect the target system. |
| `malware` | Checks if some malware infects the target system. |
| `safe` | Defensive scripts that do not perform intrusive and destructive access. |
| `version` | Extension for service detection. |
| `vuln` | Identification of specific vulnerabilities. |

### **Default Scripts**

Nmap Scripting Engine

```bash
Teophylus@htb[/htb]$ sudo nmap<target> -sC

```

### **Specific Scripts Category**

Nmap Scripting Engine

```bash
Teophylus@htb[/htb]$ sudo nmap<target> --script <category>

```

### **Defined Scripts**

Nmap Scripting Engine

```bash
Teophylus@htb[/htb]$ sudo nmap<target> --script <script-name>,<script-name>,...
```

### **Nmap - Aggressive Scan**

Nmap Scripting Engine

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.28 -p 80 -A
Starting Nmap 7.80 ( https://nmap.org ) at 2020-06-17 01:38 CEST
Nmap scan report for 10.129.2.28
Host is up (0.012s latency).

PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-generator: WordPress 5.3.4
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: blog.inlanefreight.com
MAC Address: DE:AD:00:00:BE:EF (Intel Corporate)
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Aggressive OS guesses: Linux 2.6.32 (96%), Linux 3.2 - 4.9 (96%), Linux 2.6.32 - 3.10 (96%), Linux 3.4 - 3.10 (95%), Linux 3.1 (95%), Linux 3.2 (95%),
AXIS 210A or 211 Network Camera (Linux 2.6.17) (94%), Synology DiskStation Manager 5.2-5644 (94%), Netgear RAIDiator 4.2.28 (94%),
Linux 2.6.32 - 2.6.35 (94%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 1 hop

TRACEROUTE
HOP RTT      ADDRESS
1   11.91 ms 10.129.2.28

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 11.36 seconds
```

With the help of the used scan option (`-A`), we found out what kind of web server (`Apache 2.4.29`) is running on the system, which web application (`WordPress 5.3.4`) is used, and the title (`blog.inlanefreight.com`) of the web page. Also, `Nmap` shows that it is likely to be `Linux` (`96%`) operating system.

# **Vulnerability Assessment**

Now let us move on to HTTP port 80 and see what information and vulnerabilities we can find using the `vuln` category from `NSE`.

### **Nmap - Vuln Category**

Nmap Scripting Engine

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.28 -p 80 -sV --script vuln

Nmap scan report for 10.129.2.28
Host is up (0.036s latency).

PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
| http-enum:
|   /wp-login.php: Possible admin folder
|   /readme.html: Wordpress version: 2
|   /: WordPress version: 5.3.4
|   /wp-includes/images/rss.png: Wordpress version 2.2 found.
|   /wp-includes/js/jquery/suggest.js: Wordpress version 2.5 found.
|   /wp-includes/images/blank.gif: Wordpress version 2.6 found.
|   /wp-includes/js/comment-reply.js: Wordpress version 2.7 found.
|   /wp-login.php: Wordpress login page.
|   /wp-admin/upgrade.php: Wordpress login page.
|_  /readme.html: Interesting, a readme.
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-stored-xss: Couldn't find any stored XSS vulnerabilities.
| http-wordpress-users:
| Username found: admin
|_Search stopped at ID#25. Increase the upper limit if necessary with 'http-wordpress-users.limit'
| vulners:
|   cpe:/a:apache:http_server:2.4.29:
|     	CVE-2019-0211	7.2	https://vulners.com/cve/CVE-2019-0211
|     	CVE-2018-1312	6.8	https://vulners.com/cve/CVE-2018-1312
|     	CVE-2017-15715	6.8	https://vulners.com/cve/CVE-2017-15715
<SNIP>
```

# **Performance**

---

Scanning performance plays a significant role when we need to scan an extensive network or are dealing with low network bandwidth. We can use various options to tell `Nmap` how fast (`-T <0-5>`), with which frequency (`--min-parallelism <number>`), which timeouts (`--max-rtt-timeout <time>`) the test packets should have, how many packets should be sent simultaneously (`--min-rate <number>`), and with the number of retries (`--max-retries <number>`) for the scanned ports the targets should be scanned.

# **Timeouts**

When Nmap sends a packet, it takes some time (`Round-Trip-Time` - `RTT`) to receive a response from the scanned port. Generally, `Nmap` starts with a high timeout (`--min-RTT-timeout`) of 100ms

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.0/24` | Scans the specified target network. |
| `-F` | Scans top 100 ports. |
| `--initial-rtt-timeout 50ms` | Sets the specified time value as initial RTT timeout. |
| `--max-rtt-timeout 100ms` | Sets the specified time value as maximum RTT timeout. |

# **Max Retries**

Another way to increase scan speed is by specifying the retry rate of sent packets (`--max-retries`). The default value is `10`, but we can reduce it to `0`. This means if Nmap does not receive a response for a port, it won't send any more packets to that port and will skip it.

### **Default Scan**

Performance

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.0/24 -F | grep "/tcp" | wc -l

23

```

### **Reduced Retries**

Performance

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.0/24 -F --max-retries 0 | grep "/tcp" | wc -l

21

```

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.0/24` | Scans the specified target network. |
| `-F` | Scans top 100 ports. |
| `--max-retries 0` | Sets the number of retries that will be performed during the scan. |

Again, we recognize that accelerating can also have a negative effect on our results, which means we can overlook important information.

# **Rates**

During a white-box penetration test, we may get whitelisted for the security systems to check the systems in the network for vulnerabilities and not only test the protection measures. If we know the network bandwidth, we can work with the rate of packets sent, which significantly speeds up our scans with `Nmap`. When setting the minimum rate (`--min-rate <number>`) for sending packets, we tell `Nmap` to simultaneously send the specified number of packets. It will attempt to maintain the rate accordingly.

### **Default Scan**

Performance

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.0/24 -F -oN tnet.default

<SNIP>
Nmap done: 256 IP addresses (10 hosts up) scanned in 29.83 seconds

```

### **Optimized Scan**

Performance

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.0/24 -F -oN tnet.minrate300 --min-rate 300

<SNIP>
Nmap done: 256 IP addresses (10 hosts up) scanned in 8.67 seconds

```

| **Scanning Options** | **Description** |
| --- | --- |
| `10.129.2.0/24` | Scans the specified target network. |
| `-F` | Scans top 100 ports. |
| `-oN tnet.minrate300` | Saves the results in normal formats, starting the specified file name. |
| `--min-rate 300` | Sets the minimum number of packets to be sent per second. |

---

### **Default Scan - Found Open Ports**

Performance

```bash
Teophylus@htb[/htb]$ cat tnet.default | grep "/tcp" | wc -l

23

```

### **Optimized Scan - Found Open Ports**

Performance

```bash
Teophylus@htb[/htb]$ cat tnet.minrate300 | grep "/tcp" | wc -l

23
```

# **Timing**

Because such settings cannot always be optimized manually, as in a black-box penetration test, `Nmap` offers six different timing templates (`-T <0-5>`) for us to use. These values (`0-5`) determine the aggressiveness of our scans. This can also have negative effects if the scan is too aggressive, and security systems may block us due to the produced network traffic. The default timing template used when we have defined nothing else is the normal (`-T 3`).

- `T 0` / `T paranoid`
- `T 1` / `T sneaky`
- `T 2` / `T polite`
- `T 3` / `T normal`
- `T 4` / `T aggressive`
- `T 5` / `T insane`

These templates contain options that we can also set manually, and have seen some of them already.

### **Default Scan**

Performance

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.0/24 -F -oN tnet.default

<SNIP>
Nmap done: 256 IP addresses (10 hosts up) scanned in 32.44 seconds

```

### **Insane Scan**

Performance

```bash
Teophylus@htb[/htb]$ sudo nmap 10.129.2.0/24 -F -oN tnet.T5 -T 5

<SNIP>
Nmap done: 256 IP addresses (10 hosts up) scanned in 18.07 seconds
```