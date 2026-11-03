---
title: "Deploying twemproxy"
translation_of: "2015-01-04-twemproxy 部署文档"
excerpt: "Installation, configuration, startup, and connection testing for a Redis and Memcached proxy."
---

### Introduction

twemproxy is a cluster proxy for Redis and Memcached.

### What it does

Neither Memcached nor Redis, as described here, provides distributed clustering on its own. With many Redis or Memcached instances, we usually rely on client-side data-allocation algorithms, such as consistent hashing, to distribute storage.

Twemproxy introduces a proxy layer that manages and distributes access to multiple backend instances. Applications talk to Twemproxy without needing to know exactly how many Redis or Memcached servers sit behind it. Before Redis Cluster is officially available, a proxy may be the best way to build a storage cluster. Twemproxy is also a product that Twitter has thoroughly tested in its own environment.

### Performance

According to tests by Redis's author, Twemproxy performs quite well in most cases, with at most a 20% performance loss compared with accessing Redis directly. That seems a small cost for its benefits. One area that could still improve is MGET, which reaches only about 50% of direct Redis performance in those tests.

### Installation and configuration

In this example, the proxy runs on `192.168.30.170`, installed at `/opt/module/twenproxy`.

```bash
apt-get install automake
apt-get install libtool
git clone git://github.com/twitter/twemproxy.git
cd twemproxy
autoreconf -fvi
./configure --enable-debug=log
make
src/nutcracker -h
```

If `src/nutcracker -h` displays help, the installation has succeeded.

Assume Redis is already installed on `192.168.30.170` and `192.168.30.171`. We now put Twemproxy in front of them. Create `/opt/module/twenproxy/conf/nutcracker.xrk.yml`; more configuration options are described in the [Twemproxy repository](https://github.com/twitter/twemproxy).

```yaml
redis:
  listen: 192.168.30.170:55555
  hash: fnv1a_64
  distribution: ketama
  auto_eject_hosts: true
  preconnect: true
  server_connections: 50
  redis: true
  server_retry_timeout: 2000
  server_failure_limit: 1
  servers:
    - 192.168.30.170:6379:1
    - 192.168.30.171:6380:1
```

### Start the service

```bash
cd /opt/module/twenproxy
./src/nutcracker -h
```

The help lists the following options:

```text
Usage: nutcracker [-?hVdDt] [-v verbosity level] [-o output file]
                 [-c conf file] [-s stats port] [-a stats addr]
                 [-i stats interval] [-p pid file] [-m mbuf size]
Options:
  -h, --help             : this help
  -V, --version          : show version and exit
  -t, --test-conf        : test configuration for syntax errors and exit
  -d, --daemonize        : run as a daemon
  -D, --describe-stats   : print stats description and exit
  -v, --verbosity=N      : set logging level (default: 5, min: 0, max: 11)
  -o, --output=S         : set logging file (default: stderr)
  -c, --conf-file=S      : set configuration file (default: conf/nutcracker.yml)
  -s, --stats-port=N     : set stats monitoring port (default: 22222)
  -a, --stats-addr=S     : set stats monitoring ip (default: 0.0.0.0)
  -i, --stats-interval=N : set stats aggregation interval in msec (default: 30000 msec)
  -p, --pid-file=S       : set pid file (default: off)
  -m, --mbuf-size=N      : set size of mbuf chunk in bytes (default: 16384 bytes)
```

Start in the foreground for debugging:

```bash
./src/nutcracker -c /opt/module/twenproxy/conf/nutcracker.xrk.yml
```

Or start as a daemon:

```bash
./src/nutcracker -d -c /opt/module/twenproxy/conf/nutcracker.xrk.yml
```

### Connect and test

```bash
redis-cli -h 192.168.30.170 -p 55555
```

A failed connection reports a message such as `Could not connect to Redis at 192.168.9.13:55555: Connection refused`. A successful connection presents the prompt `redis 192.168.30.170:55555>`.

Try writing and reading a value:

```text
set key1 1
get key1
```

That completes installation, configuration, and connection testing.

### Advantages

This lightweight Redis and Memcached proxy reduces backend connections and provides sharding. Mingyue initially found online claims of a 20% performance loss, but redis-benchmark tests showed almost no loss, and sometimes even better performance. Reading the English original clarified that the reported 20% loss was the worst case.

That is impressive: you would expect an extra proxy layer to cost performance, yet it can make access faster. Reading the source explains why: it uses pipelining. Redis supports batched pipeline requests. Twemproxy establishes connections to the Redis servers and implements two FIFO queues for each connection to pipeline requests. Combining access from multiple clients into one connection reduces the number of Redis connections and improves access performance.

### Limitations

1. Although nodes can be removed dynamically, the data on a removed node is lost.
2. When Redis nodes are added dynamically, Twemproxy does not redistribute existing data. In the mailing-list discussion, the author said this needs to be handled separately.
3. There is a performance cost.
