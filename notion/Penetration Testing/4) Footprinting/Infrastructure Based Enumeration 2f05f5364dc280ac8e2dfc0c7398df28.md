# Infrastructure Based Enumeration

# **Domain Information**

---

Domain information is a core component of any penetration test, and it is not just about the subdomains but about the entire presence on the Internet. Therefore, we gather information and try to understand the company's functionality and which technologies and structures are necessary for services to be offered successfully and efficiently.

This type of information is gathered passively without direct and active scans. In other words, we remain hidden and navigate as "customers" or "visitors" to avoid direct connections to the company that could expose us

However, when `passively` gathering information, we can use third-party services to understand the company better. However, the first thing we should do is scrutinize the company's `main website`. 

We pay attention to what `we see` and `we do not see`. We see the services but not their functionality. However, services are bound to certain technical aspects necessary to provide a service.

# **Online Presence**

The first point of presence on the Internet may be the `SSL certificate` from the company's main website that we can examine. 

Often, such a certificate includes more than just a subdomain, and this means that the certificate is used for several domains, and these are most likely still active.

Another source to find more subdomains is [crt.sh](https://crt.sh/). This source is [Certificate Transparency](https://en.wikipedia.org/wiki/Certificate_Transparency) logs

The standard ([RFC 6962](https://tools.ietf.org/html/rfc6962)) provides for the logging of all digital certificates issued by a certificate authority in audit-proof logs. This is intended to enable the detection of false or maliciously issued certificates for a domain. 

We can also output the results in JSON format.

### **Certificate Transparency**

Domain Information

```bash
Teophylus@htb[/htb]$ curl -s https://crt.sh/\?q\=inlanefreight.com\&output\=json | jq .

[
  {
    "issuer_ca_id": 23451835427,
    "issuer_name": "C=US, O=Let's Encrypt, CN=R3",
    "common_name": "matomo.inlanefreight.com",
    "name_value": "matomo.inlanefreight.com",
    "id": 50815783237226155,
    "entry_timestamp": "2021-08-21T06:00:17.173",
    "not_before": "2021-08-21T05:00:16",
    "not_after": "2021-11-19T05:00:15",
    "serial_number": "03abe9017d6de5eda90"
  },
  {
    "issuer_ca_id": 6864563267,
    "issuer_name": "C=US, O=Let's Encrypt, CN=R3",
    "common_name": "matomo.inlanefreight.com",
    "name_value": "matomo.inlanefreight.com",
    "id": 5081529377,
    "entry_timestamp": "2021-08-21T06:00:16.932",
    "not_before": "2021-08-21T05:00:16",
    "not_after": "2021-11-19T05:00:15",
    "serial_number": "03abe90104e271c98a90"
  },
  {
    "issuer_ca_id": 113123452,
    "issuer_name": "C=US, O=Let's Encrypt, CN=R3",
    "common_name": "smartfactory.inlanefreight.com",
    "name_value": "smartfactory.inlanefreight.com",
    "id": 4941235512141012357,
    "entry_timestamp": "2021-07-27T00:32:48.071",
    "not_before": "2021-07-26T23:32:47",
    "not_after": "2021-10-24T23:32:45",
    "serial_number": "044bac5fcc4d59329ecbbe9043dd9d5d0878"
  },
  { ... SNIP ...
```

If needed, we can also have them filtered by the unique subdomains.

Domain Information

```bash
Teophylus@htb[/htb]$ curl -s https://crt.sh/\?q\=inlanefreight.com\&output\=json | jq . | grep name | cut -d":" -f2 | grep -v "CN=" | cut -d'"' -f2 | awk '{gsub(/\\n/,"\n");}1;' | sort -u

account.ttn.inlanefreight.com
blog.inlanefreight.com
bots.inlanefreight.com
console.ttn.inlanefreight.com
ct.inlanefreight.com
data.ttn.inlanefreight.com
*.inlanefreight.com
inlanefreight.com
integrations.ttn.inlanefreight.com
iot.inlanefreight.com
mails.inlanefreight.com
marina.inlanefreight.com
marina-live.inlanefreight.com
matomo.inlanefreight.com
next.inlanefreight.com
noc.ttn.inlanefreight.com
preview.inlanefreight.com
shop.inlanefreight.com
smartfactory.inlanefreight.com
ttn.inlanefreight.com
vx.inlanefreight.com
www.inlanefreight.com
```

Next, we can identify the hosts directly accessible from the Internet and not hosted by third-party providers. This is because we are not allowed to test the hosts without the permission of third-party providers.

### **Company Hosted Servers**

Domain Information

```bash
Teophylus@htb[/htb]$ for i in $(cat subdomainlist);do host $i | grep "has address" | grep inlanefreight.com | cut -d" " -f1,4;done

blog.inlanefreight.com 10.129.24.93
inlanefreight.com 10.129.27.33
matomo.inlanefreight.com 10.129.127.22
www.inlanefreight.com 10.129.127.33
s3-website-us-west-2.amazonaws.com 10.129.95.250
```

[Shodan](https://www.shodan.io/) can be used to find devices and systems permanently connected to the Internet like `Internet of Things` (`IoT`). It searches the Internet for open TCP/IP ports and filters the systems according to specific terms and criteria.

 For example, open HTTP or HTTPS ports and other server ports for `FTP`, `SSH`, `SNMP`, `Telnet`, `RTSP`, or `SIP` are searched. As a result, we can find devices and systems, such as `surveillance cameras`, `servers`, `smart home systems`, `industrial controllers`, `traffic lights` and `traffic controllers`, and various network components.

### **Shodan - IP List**

Domain Information

```bash
Teophylus@htb[/htb]$ for i in $(cat subdomainlist);do host $i | grep "has address" | grep inlanefreight.com | cut -d" " -f4 >> ip-addresses.txt;done
Teophylus@htb[/htb]$ for i in $(cat ip-addresses.txt);do shodan host $i;done

10.129.24.93
City:                    Berlin
Country:                 Germany
Organization:            InlaneFreight
Updated:                 2021-09-01T09:02:11.370085
Number of open ports:    2

Ports:
     80/tcp nginx
    443/tcp nginx

10.129.27.33
City:                    Berlin
Country:                 Germany
Organization:            InlaneFreight
Updated:                 2021-08-30T22:25:31.572717
Number of open ports:    3

Ports:
     22/tcp OpenSSH (7.6p1 Ubuntu-4ubuntu0.3)
     80/tcp nginx
    443/tcp nginx
        |-- SSL Versions: -SSLv2, -SSLv3, -TLSv1, -TLSv1.1, -TLSv1.3, TLSv1.2
        |-- Diffie-Hellman Parameters:
                Bits:          2048
                Generator:     2

10.129.27.22
City:                    Berlin
Country:                 Germany
Organization:            InlaneFreight
Updated:                 2021-09-01T15:39:55.446281
Number of open ports:    8

Ports:
     25/tcp
        |-- SSL Versions: -SSLv2, -SSLv3, -TLSv1, -TLSv1.1, TLSv1.2, TLSv1.3
     53/tcp
     53/udp
     80/tcp Apache httpd
     81/tcp Apache httpd
    110/tcp
        |-- SSL Versions: -SSLv2, -SSLv3, -TLSv1, -TLSv1.1, TLSv1.2
    111/tcp
    443/tcp Apache httpd
        |-- SSL Versions: -SSLv2, -SSLv3, -TLSv1, -TLSv1.1, TLSv1.2, TLSv1.3
        |-- Diffie-Hellman Parameters:
                Bits:          2048
                Generator:     2
                Fingerprint:   RFC3526/Oakley Group 14
    444/tcp

10.129.27.33
City:                    Berlin
Country:                 Germany
Organization:            InlaneFreight
Updated:                 2021-08-30T22:25:31.572717
Number of open ports:    3

Ports:
     22/tcp OpenSSH (7.6p1 Ubuntu-4ubuntu0.3)
     80/tcp nginx
    443/tcp nginx
        |-- SSL Versions: -SSLv2, -SSLv3, -TLSv1, -TLSv1.1, -TLSv1.3, TLSv1.2
        |-- Diffie-Hellman Parameters:
                Bits:          2048
                Generator:     2
```

### **DNS Records**

Domain Information

```bash
Teophylus@htb[/htb]$ dig any inlanefreight.com

; <<>> DiG 9.16.1-Ubuntu <<>> any inlanefreight.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 52058
;; flags: qr rd ra; QUERY: 1, ANSWER: 17, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;inlanefreight.com.             IN      ANY

;; ANSWER SECTION:
inlanefreight.com.      300     IN      A       10.129.27.33
inlanefreight.com.      300     IN      A       10.129.95.250
inlanefreight.com.      3600    IN      MX      1 aspmx.l.google.com.
inlanefreight.com.      3600    IN      MX      10 aspmx2.googlemail.com.
inlanefreight.com.      3600    IN      MX      10 aspmx3.googlemail.com.
inlanefreight.com.      3600    IN      MX      5 alt1.aspmx.l.google.com.
inlanefreight.com.      3600    IN      MX      5 alt2.aspmx.l.google.com.
inlanefreight.com.      21600   IN      NS      ns.inwx.net.
inlanefreight.com.      21600   IN      NS      ns2.inwx.net.
inlanefreight.com.      21600   IN      NS      ns3.inwx.eu.
inlanefreight.com.      3600    IN      TXT     "MS=ms92346782372"
inlanefreight.com.      21600   IN      TXT     "atlassian-domain-verification=IJdXMt1rKCy68JFszSdCKVpwPN"
inlanefreight.com.      3600    IN      TXT     "google-site-verification=O7zV5-xFh_jn7JQ31"
inlanefreight.com.      300     IN      TXT     "google-site-verification=bow47-er9LdgoUeah"
inlanefreight.com.      3600    IN      TXT     "google-site-verification=gZsCG-BINLopf4hr2"
inlanefreight.com.      3600    IN      TXT     "logmein-verification-code=87123gff5a479e-61d4325gddkbvc1-b2bnfghfsed1-3c789427sdjirew63fc"
inlanefreight.com.      300     IN      TXT     "v=spf1 include:mailgun.org include:_spf.google.com include:spf.protection.outlook.com include:_spf.atlassian.net ip4:10.129.24.8 ip4:10.129.27.2 ip4:10.72.82.106 ~all"
inlanefreight.com.      21600   IN      SOA     ns.inwx.net. hostmaster.inwx.net. 2021072600 10800 3600 604800 3600

;; Query time: 332 msec
;; SERVER: 127.0.0.53#53(127.0.0.53)
;; WHEN: Mi Sep 01 18:27:22 CEST 2021
;; MSG SIZE  rcvd: 940
```

- `A` records: We recognize the IP addresses that point to a specific (sub)domain through the A record. Here we only see one that we already know.
- `MX` records: The mail server records show us which mail server is responsible for managing the emails for the company. Since this is handled by google in our case, we should note this and skip it for now.
- `NS` records: These kinds of records show which name servers are used to resolve the FQDN to IP addresses. Most hosting providers use their own name servers, making it easier to identify the hosting provider.
- `TXT` records: this type of record often contains verification keys for different third-party providers and other security aspects of DNS, such as [SPF](https://datatracker.ietf.org/doc/html/rfc7208), [DMARC](https://datatracker.ietf.org/doc/html/rfc7489), and [DKIM](https://datatracker.ietf.org/doc/html/rfc6376), which are responsible for verifying and confirming the origin of the emails sent. Here we can already see some valuable information if we look closer at the results.

What we could see so far were entries on the DNS server, which at first glance did not look very interesting (except for the additional IP addresses). However, we could not see the third-party providers behind the entries shown at first glance. The core information we can see now is:

|  |  |  |
| --- | --- | --- |
| [Atlassian](https://www.atlassian.com/) | [Google Gmail](https://www.google.com/gmail/) | [LogMeIn](https://www.logmein.com/) |
| [Mailgun](https://www.mailgun.com/) | [Outlook](https://outlook.live.com/owa/) | [INWX](https://www.inwx.com/en) ID/Username |
| 10.129.24.8 | 10.129.27.2 | 10.72.82.106 |

# **Cloud Resources**

---

The use of cloud, such as [AWS](https://aws.amazon.com/), [GCP](https://cloud.google.com/), [Azure](https://azure.microsoft.com/en-us/), and others, is now one of the essential components for many companies nowadays. After all, all companies want to be able to do their work from anywhere, so they need a central point for all management. This is why services from `Amazon` (`AWS`), `Google` (`GCP`), and `Microsoft` (`Azure`) are ideal for this purpose.

Even though cloud providers secure their infrastructure centrally, this does not mean that companies are free from vulnerabilities. The configurations made by the administrators may nevertheless make the company's cloud resources vulnerable. This often starts with the `S3 buckets` (AWS), `blobs` (Azure), `cloud storage` (GCP), which can be accessed without authentication if configured incorrectly.

### **Company Hosted Servers**

Cloud Resources

```bash
Teophylus@htb[/htb]$ for i in $(cat subdomainlist);do host $i | grep "has address" | grep inlanefreight.com | cut -d" " -f1,4;done

blog.inlanefreight.com 10.129.24.93
inlanefreight.com 10.129.27.33
matomo.inlanefreight.com 10.129.127.22
www.inlanefreight.com 10.129.127.33
s3-website-us-west-2.amazonaws.com 10.129.95.250
```

Often cloud storage is added to the DNS list when used for administrative purposes by other employees. This step makes it much easier for the employees to reach and manage them. 

### **Google Search for AWS**

![Google search results for 'intext: [redacted] inurl:amazonaws.com' showing links to Amazon S3 PDFs.](https://cdn.services-k8s.prod.aws.htb.systems/content/modules/112/gsearch1.png)

### **Google Search for Azure**

![Google search results for 'intext: [redacted] inurl:blob.core.windows.net' showing links to PDF files on Azure Blob Storage.](https://cdn.services-k8s.prod.aws.htb.systems/content/modules/112/gsearch2.png)

### **Target Website - Source Code**

![HTML code snippet showing DNS prefetch and preconnect links to [redacted] blob.core.windows.net with crossorigin attributes.](https://cdn.services-k8s.prod.aws.htb.systems/content/modules/112/cloud3.png)

Third-party providers such as [domain.glass](https://domain.glass/) can also tell us a lot about the company's infrastructure. As a positive side effect, we can also see that Cloudflare's security assessment status has been classified as "Safe".

Another very useful provider is [GrayHatWarfare](https://buckets.grayhatwarfare.com/). We can do many different searches, discover AWS, Azure, and GCP cloud storage, and even sort and filter by file format. Therefore, once we have found them through Google, we can also search for them on GrayHatWarefare and passively discover what files are stored on the given cloud storage.

### **Private and Public SSH Keys Leaked**

![Dashboard showing AWS S3 file listings with two entries: 'id_rsa' and 'id_rsa.pub' from [redacted] bucket, dated August 2021.](https://cdn.services-k8s.prod.aws.htb.systems/content/modules/112/ghw1.png)

Sometimes when employees are overworked or under high pressure, mistakes can be fatal for the entire company. These errors can even lead to SSH private keys being leaked, which anyone can download and log onto one or even more machines in the company without using a password.

# **Staff**

---

Searching for and identifying employees on social media platforms can also reveal a lot about the teams' infrastructure and makeup

This, in turn, can lead to us identifying which technologies, programming languages, and even software applications are being used. To a large extent, we will also be able to assess each person's focus based on their skills.

Employees can be identified on various business networks such as [LinkedIn](https://www.linkedin.com/) or [Xing](https://www.xing.de/). Job postings from companies can also tell us a lot about their infrastructure and give us clues about what we should be looking for.

Companies always hire employees whose skills they can use and apply to the business

If we do a little search for Django security misconfigurations, we will eventually come across the following [Github repository](https://github.com/boomcamp/django-security) that describes OWASP Top10 for Django

[LinkedIn](https://www.linkedin.com/) offers a comprehensive search for employed, sorted by connections, locations, companies, school, industry, profile language, services, names, titles, and more. Understandably, the more detailed information we provide there, the fewer results we get

Because based on the security area and the employees who work in that area, we will also be able to determine what security measures the company has put in place to secure itself.