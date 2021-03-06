---
layout: post
title: twemproxy 部署文档
date:   2015-01-04 10:18:00
tags: redis
subclass: 'post tag-fiction'
categories: 'casper'
navigation: True
---

### 简介
twemproxy 主要用于Redis 和 Memcached 的集群代理

### 功能介绍
我们知道，无论是 Memcached 还是当前的 Redis，其本身都不具备分布式集群特性，当我们有大量 Redis 或 Memcached 的时候，通常只能通过客户端的一些数据分配算法（比如一致性哈希），来实现集群存储的特性。 而 Twemproxy 通过引入一个代理层，可以将其后端的多台 Redis 或 Memcached 实例进行统一管理与分配，使应用程序只需要在 Twemproxy 上进行操作，而不用关心后面具体有多少个真实的 Redis 或 Memcached 存储。 在 Redis 的 Cluster 方案还没有正式推出之前，通过 Proxy 的方式来实现存储集群可能是最好的选择了。更何况 Twemproxy 是通过 Twitter 自身得到了充分检验的产品。

### 性能
根据 Redis 作者的测试结果，在大多数情况下，Twemproxy 的性能相当不错，直接操作 Redis 相比，最多只有20%的性能损失。这对于它带来的好处来说真的是微不足道了。唯一可能还有待改进的是其 MGET 操作的效率，其性能只有直接操作 Redis 的 50%。

### 安装与配置
线上部署与安装, twenproxy 部署到170上,安装目录/opt/module/twenproxy

```Bash
apt-get install automake
apt-get install libtool
git clone git://github.com/twitter/twemproxy.git
cd twemproxy
autoreconf -fvi
./configure --enable-debug=log
make
src/nutcracker -h
```

输入src/nutcracker -h 在命令行可以显示帮助信息,那么就证明安装成功

    1.假如192.168.30.170的redis跟192.168.30.171的redis安装成功
    2.现在通过twenproxy代理集群
    3.直接看/opt/module/twenproxy/conf/nutcracker.xrk.yml配置文件,还有很多配置参数详细请看 https://github.com/twitter/twemproxy

    redis:
    listen: 192.168.30.170:55555 #twenproxy部署在192.168.30.170:55555 上
    hash: fnv1a_64
    distribution: ketama
    auto_eject_hosts: true
    preconnect: true
    server_connections: 50
    redis: true
    server_retry_timeout: 2000
    server_failure_limit: 1
    servers:
    - 192.168.30.170:6379:1 #部署170的redis
    - 192.168.30.171:6380:1 #部署171的redis

### 启动服务
```Bash
cd /opt/module/twenproxy
#查看命令信息
./src/nutcracker -h
Usage: nutcracker [-?hVdDt] [-v verbosity level] [-o output file]
              [-c conf file] [-s stats port] [-a stats addr]
              [-i stats interval] [-p pid file] [-m mbuf size]
Options:
  -h, --help             : this help #帮助
  -V, --version          : show version and exit #版本
  -t, --test-conf        : test configuration for syntax errors and exit #测试配置文件是否有语法错误
  -d, --daemonize        : run as a daemon #是否守护进程启动
  -D, --describe-stats   : print stats description and exit #描述
  -v, --verbosity=N      : set logging level (default: 5, min: 0, max: 11)
  -o, --output=S         : set logging file (default: stderr)
  -c, --conf-file=S      : set configuration file (default: conf/nutcracker.yml) #指定配置文件
  -s, --stats-port=N     : set stats monitoring port (default: 22222) #端口
  -a, --stats-addr=S     : set stats monitoring ip (default: 0.0.0.0) #设置地址
  -i, --stats-interval=N : set stats aggregation interval in msec (default: 30000 msec)
  -p, --pid-file=S       : set pid file (default: off)
  -m, --mbuf-size=N      : set size of mbuf chunk in bytes (default: 16384 bytes)
#查看命令信息
#启动命令
1. 为了方便调试启动
./src/nutcracker -c /opt/module/twenproxy/conf/nutcracker.xrk.yml
2.守护进程启动
./src/nutcracker -d -c /opt/module/twenproxy/conf/nutcracker.xrk.yml
```

### 连接并测试是否成功
```Bash
redis-cli -h 192.168.30.170 -p 55555
连接失败:
提示信息:Could not connect to Redis at 192.168.9.13:55555: Connection refused
连接成功:
提示信息:redis 192.168.30.170:55555>
set key1 1
get key1
```
以上是twenproxy安装配置与测试连接

### 优点
这是一个轻量级的 Redis和memcached代理。使用它可以减少缓存服务器的连接数，并且利用它来作分片。这个代理的速度是相当快的，明月在网上查到会有20%的性 能损耗，但明月用redis-benchmark做了测试，发现性能几乎是无损的，甚至有时更快。后来找到英文原文，作者是说最差情况下，性能损耗不会多 于20%。明月觉得这个很了不起，按道理说，有了一层代理，怎么说都得折损一部分性能，但是他切能使得访问更快。看了源码，原来是用了pipeline. 首先redis是支持使用pipeline批处理的。twemproxy与每个redis服务器都会建立一个连接，每个连接实现了两个FIFO的队列，通 过这两个队列实现对redis的pipeline访问。将多个客户端的访问合并到一个连接,这样既减少了redis服务器的连接数，又提高了访问性能。

### 缺点
1. 虽然可以动态移除节点，但该移除节点的数据就丢失了。
2. redis集群动态增加节点的时候,twemproxy不会对已有数据做重分布.maillist里面作者说这个需要自
3. 性能上的损耗
