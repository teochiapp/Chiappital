# Remote Management Protocols

### Linux Remote Management Protocols

In the world of Linux distributions, there are many ways to manage the servers remotely

These applications and services can be found on almost every server in the public network. It is time-saving since we do not have to be physically present at the server, and the working environment still looks the same.

### SSH

Therefore, we need to connect to it using the SSH protocol and authenticate ourselves to it. In total, OpenSSH has six different authentication methods:

1. Password authentication
2. Public-key authentication
3. Host-based authentication
4. Keyboard authentication
5. Challenge-response authentication
6. GSSAPI authentication

### **Public Key Authentication**

In a first step, the SSH server and client authenticate themselves to each other. The server sends its `public host key` to the client, which the client uses to verify the server's identity. Only when contact is first established there is a risk of a third party interposing itself between the two participants and thus intercepting the connection. A `host key` cannot be imitated because it is a unique public-private `key pair`, and an attacker cannot forge the private key’s signature without access to it, assuming the client properly verifies the public key against a trusted source.

# **Dangerous Settings**

Despite the SSH protocol being one of the most secure protocols available today, some misconfigurations can still make the SSH server vulnerable to easy-to-execute attacks. Let us take a look at the following settings:

| **Setting** | **Description** |
| --- | --- |
| `PasswordAuthentication yes` | Allows password-based authentication. |
| `PermitEmptyPasswords yes` | Allows the use of empty passwords. |
| `PermitRootLogin yes` | Allows to log in as the root user. |
| `Protocol 1` | Uses an outdated version of encryption. |
| `X11Forwarding yes` | Allows X11 forwarding for GUI applications. |
| `AllowTcpForwarding yes` | Allows forwarding of TCP ports. |
| `PermitTunnel` | Allows tunneling. |
| `DebianBanner yes` | Displays a specific banner when logging in. |

Allowing password authentication allows us to brute-force a known username for possible passwords. Many different methods can be used to guess the passwords of users. For this purpose, specific `patterns` are usually used to mutate the most commonly used passwords and, frighteningly, correct them

# **Footprinting the Service**

One of the tools we can use to fingerprint the SSH server is [ssh-audit](https://github.com/jtesta/ssh-audit). It checks the client-side and server-side configuration and shows some general information and which encryption algorithms are still used by the client and server. Of course, this could be exploited by attacking the server or client at the cryptic level later.

### **SSH-Audit**

Linux Remote Management Protocols

```bash
Teophylus@htb[/htb]$ git clone https://github.com/jtesta/ssh-audit.git && cd ssh-audit
Teophylus@htb[/htb]$ ./ssh-audit.py 10.129.14.132
```

The first thing we can see in the first few lines of the output is the banner that reveals the version of the OpenSSH server. The previous versions had some vulnerabilities, such as [CVE-2020-14145](https://www.cvedetails.com/cve/CVE-2020-14145/), which allowed the attacker the capability to Man-In-The-Middle and attack the initial connection attempt. The detailed output of the connection setup with the OpenSSH server can also often provide important information, such as which authentication methods the server can use.

### **Change Authentication Method**

Linux Remote Management Protocols

```bash
Teophylus@htb[/htb]$ ssh -v cry0l1t3@10.129.14.132

OpenSSH_8.2p1 Ubuntu-4ubuntu0.3, OpenSSL 1.1.1f  31 Mar 2020
debug1: Reading configuration data /etc/ssh/ssh_config
...SNIP...
debug1: Authentications that can continue: publickey,password,keyboard-interactive
```

For potential brute-force attacks, we can specify the authentication method with the SSH client option `PreferredAuthentications`.

Linux Remote Management Protocols

```bash
Teophylus@htb[/htb]$ ssh -v cry0l1t3@10.129.14.132 -o PreferredAuthentications=password
```

# **Rsync**

[Rsync](https://linux.die.net/man/1/rsync) is a fast and efficient tool for locally and remotely copying files. It can be used to copy files locally on a given machine and to/from remote hosts. It is highly versatile and well-known for its delta-transfer algorithm.

### **Scanning for Rsync**

Linux Remote Management Protocols

```bash
Teophylus@htb[/htb]$ sudo nmap -sV -p 873 127.0.0.1
```

### **Probing for Accessible Shares**

We can next probe the service a bit to see what we can gain access to.

Linux Remote Management Protocols

```bash
Teophylus@htb[/htb]$ nc -nv 127.0.0.1 873
```

### **Enumerating an Open Share**

Here we can see a share called `dev`, and we can enumerate it further.

Linux Remote Management Protocols

```bash
Teophylus@htb[/htb]$ rsync -av --list-only rsync://127.0.0.1/dev
```

# **R-Services**

R-Services are a suite of services hosted to enable remote access or issue commands between Unix hosts over TCP/IP.

Berkeley, `r-services` were the de facto standard for remote access between Unix operating systems until they were replaced by the Secure Shell (`SSH`) protocols and commands due to inherent security flaws built into them

Each command has its intended functionality; however, we will only cover the most commonly abused `r-commands`. The table below will provide a quick overview of the most frequently abused commands, including the service daemon they interact with, over what port and transport method to which they can be accessed, and a brief description of each.

| **Command** | **Service Daemon** | **Port** | **Transport Protocol** | **Description** |
| --- | --- | --- | --- | --- |
| `rcp` | `rshd` | 514 | TCP | Copy a file or directory bidirectionally from the local system to the remote system (or vice versa) or from one remote system to another. It works like the `cp` command on Linux but provides `no warning to the user for overwriting existing files on a system`. |
| `rsh` | `rshd` | 514 | TCP | Opens a shell on a remote machine without a login procedure. Relies upon the trusted entries in the `/etc/hosts.equiv` and `.rhosts` files for validation. |
| `rexec` | `rexecd` | 512 | TCP | Enables a user to run shell commands on a remote machine. Requires authentication through the use of a `username` and `password` through an unencrypted network socket. Authentication is overridden by the trusted entries in the `/etc/hosts.equiv` and `.rhosts` files. |
| `rlogin` | `rlogind` | 513 | TCP | Enables a user to log in to a remote host over the network. It works similarly to `telnet` but can only connect to Unix-like hosts. Authentication is overridden by the trusted entries in the `/etc/hosts.equiv` and `.rhosts` files. |

### **Access Control & Trusted Relationships**

The primary concern for `r-services`, and one of the primary reasons `SSH` was introduced to replace it, is the inherent issues regarding access control for these protocols. R-services rely on trusted information sent from the remote client to the host machine they are attempting to authenticate to. By default, these services utilize [Pluggable Authentication Modules (PAM)](https://debathena.mit.edu/trac/wiki/PAM) for user authentication onto a remote system; however, they also bypass this authentication through the use of the `/etc/hosts.equiv` and `.rhosts` files on the system. The `hosts.equiv` and `.rhosts` files contain a list of hosts (`IPs` or `Hostnames`) and users that are `trusted` by the local host when a connection attempt is made using `r-commands`. Entries in either file can appear like the following:

**Note:** The `hosts.equiv` file is recognized as the global configuration regarding all users on a system, whereas `.rhosts` provides a per-user configuration.

### **Listing Authenticated Users Using Rwho**

Linux Remote Management Protocols

```bash
Teophylus@htb[/htb]$ rwho

root     web01:pts/0 Dec  2 21:34
htb-student     workstn01:tty1  Dec  2 19:57  2:25
```

From this information, we can see that the `htb-student` user is currently authenticated to the `workstn01` host, whereas the `root` user is authenticated to the `web01` hos

# **Final Thoughts**

Remote management services can provide us with a treasure trove of data and often be abused for unauthorized access through either weak/default credentials or password re-use. We should always probe these services for as much information as we can gather and leave no stone unturned, especially when we have compiled a list of credentials from elsewhere in the target network.

# **Windows Remote Management Protocols**

---

Windows servers can be managed locally using Server Manager administration tasks on remote servers. Remote management is enabled by default starting with Windows Server 2016. Remote management is a component of the Windows hardware management features that manage server hardware locally and remotely. These features include a service that implements the WS-Management protocol, hardware diagnostics and control through baseboard management controllers, and a COM API and script objects that enable us to write applications that communicate remotely through the WS-Management protocol.

The main components used for remote management of Windows and Windows servers are the following:

- Remote Desktop Protocol (`RDP`)
- Windows Remote Management (`WinRM`)
- Windows Management Instrumentation (`WMI`)

# **RDP**

The [Remote Desktop Protocol](https://docs.microsoft.com/en-us/troubleshoot/windows-server/remote/understanding-remote-desktop-protocol) (`RDP`) is a protocol developed by Microsoft for remote access to a computer running the Windows operating system. This protocol allows display and control commands to be transmitted via the GUI encrypted over IP networks. RDP works at the application layer in the TCP/IP reference model, typically utilizing TCP port 3389 as the transport protocol. However, the connectionless UDP protocol can use port 3389 also for remote administration.

RDP has handled [Transport Layer Security](https://en.wikipedia.org/wiki/Transport_Layer_Security) (`TLS/SSL`) since Windows Vista, which means that all data, and especially the login process, is protected in the network by its good encryption

The `Remote Desktop` service is installed by default on Windows servers and does not require additional external applications. This service can be activated using the `Server Manager` and comes with the default setting to allow connections to the service only to hosts with [Network level authentication](https://en.wikipedia.org/wiki/Network_Level_Authentication) (`NLA`).

# **Footprinting the Service**

Scanning the RDP service can quickly give us a lot of information about the host. For example, we can determine if `NLA` is enabled on the server or not, the product version, and the hostname.

### **Nmap**

Windows Remote Management Protocols

```bash
Teophylus@htb[/htb]$ nmap -sV -sC 10.129.201.248 -p3389 --script rdp*
```

### **RDP Security Check - Installation**

Windows Remote Management Protocols

```bash
Teophylus@htb[/htb]$ sudo cpan

Loading internal logger. Log::Log4perl recommended for better logging

CPAN.pm requires configuration, but most of it can be done automatically.
If you answer 'no' below, you will enter an interactive dialog for each
configuration option instead.

Would you like to configure as much as possible automatically? [yes] yes

Autoconfiguration complete.

commit: wrote '/root/.cpan/CPAN/MyConfig.pm'

You can re-run configuration any time with 'o conf init' in the CPAN shell

cpan shell -- CPAN exploration and modules installation (v2.27)
Enter 'h' for help.

cpan[1]> install Encoding::BER

Fetching with LWP:
http://www.cpan.org/authors/01mailrc.txt.gz
Reading '/root/.cpan/sources/authors/01mailrc.txt.gz'
............................................................................DONE
...SNIP...
```

### **RDP Security Check**

Windows Remote Management Protocols

```bash
Teophylus@htb[/htb]$ git clone https://github.com/CiscoCXSecurity/rdp-sec-check.git && cd rdp-sec-check
Teophylus@htb[/htb]$ ./rdp-sec-check.pl 10.129.201.248
```

### **Initiate an RDP Session**

Windows Remote Management Protocols

```bash
Teophylus@htb[/htb]$ xfreerdp /u:cry0l1t3 /p:"P455w0rd!" /v:10.129.201.248
```

# **WinRM**

The Windows Remote Management (`WinRM`) is a simple Windows integrated remote management protocol based on the command line. WinRM uses the Simple Object Access Protocol (`SOAP`) to establish connections to remote hosts and their applications. Therefore, WinRM must be explicitly enabled and configured starting with Windows 10. WinRM relies on `TCP` ports `5985` and `5986` for communication, with the last port `5986 using HTTPS`,

# **Footprinting the Service**

As we already know, WinRM uses TCP ports `5985` (`HTTP`) and `5986` (`HTTPS`) by default, which we can scan using Nmap. However, often we will see that only HTTP (`TCP 5985`) is used instead of HTTPS (`TCP 5986`).

### **Nmap WinRM**

Windows Remote Management Protocols

```bash
Teophylus@htb[/htb]$ nmap -sV -sC 10.129.201.248 -p5985,5986 --disable-arp-ping -n
```

# **WMI**

Windows Management Instrumentation (`WMI`) is Microsoft's implementation and also an extension of the Common Information Model (`CIM`), core functionality of the standardized Web-Based Enterprise Management (`WBEM`) for the Windows platform

# **Footprinting the Service**

The initialization of the WMI communication always takes place on `TCP` port `135`, and after the successful establishment of the connection, the communication is moved to a random port. For example, the program [wmiexec.py](https://github.com/SecureAuthCorp/impacket/blob/master/examples/wmiexec.py) from the Impacket toolkit can be used for this.

### **WMIexec.py**

Windows Remote Management Protocols

```bash
Teophylus@htb[/htb]$ /usr/share/doc/python3-impacket/examples/wmiexec.py Cry0l1t3:"P455w0rD!
```