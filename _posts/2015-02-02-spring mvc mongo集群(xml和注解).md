---
layout: post
title: spring mvc mongo集群(xml和注解)
date:   2015-02-02 10:18:00
tags: spring mongo
cover:  http://7te9zv.com1.z0.glb.clouddn.com/mongo.png
subclass: 'post tag-fiction'
categories: 'casper'
navigation: True
---

最新实在太忙，公司每晚加班，都没时间更新博客让大家吸收营养了。所以赶紧出点干货给大家:)

以下内容你将会学到如何使用spring xml和注解方式集群配置mongodb，以及简单的mongoTemplate源码学习
注意：前提是mongodb本身配置好主从模式！


在数据越来越最求读取性能的时候，mongodb必须是大家非常喜爱的nosql数据库。spring对mongodb数据库的支持也是非常友好，既有jpa方式的操作，也有template方式操作。这里重点讲template，其spring工具类是mongoTemplate，里面包括所有的mongo操作。当然了，大家还是需要基于这个工具类去封装一层更加便于自己操作的类，下面会介绍到。。。

叶子是以spring boot来讲解的。例如springmvc，ssh等xml配置都是差不多的

### 首先我们来添加pom文件依赖

```xml
<dependency>
	<artifactId>spring-boot-starter-data-mongodb</artifactId>
	<groupId>org.springframework.boot</groupId>
</dependency>
```

这个依赖大家可以进去看看，里面已经包括了driver和data的包，不是spring-boot的话是要添加以下这两个包了

```xml
<dependency>
    <groupId>org.mongodb</groupId>
    <artifactId>mongo-java-driver</artifactId>
    <version>2.12.3</version>
</dependency>
<dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-mongodb</artifactId>
    <version>1.2.0.RELEASE</version>
</dependency>
```

### xml配置mongodb

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:context="http://www.springframework.org/schema/context" xmlns:mongo="http://www.springframework.org/schema/data/mongo" xsi:schemaLocation="http://www.springframework.org/schema/context
          http://www.springframework.org/schema/context/spring-context-3.0.xsd
          http://www.springframework.org/schema/data/mongo
          http://www.springframework.org/schema/data/mongo/spring-mongo-1.0.xsd
          http://www.springframework.org/schema/beans
          http://www.springframework.org/schema/beans/spring-beans-3.0.xsd">

    <mongo:mongo replica-set="192.168.30.181:27017,192.168.30.183:27017">
        <mongo:options connections-per-host="8"  auto-connect-retry="true" socket-keep-alive="true"  slave-ok="true"  />
    </mongo:mongo>

    <mongo:db-factory dbname="product" mongo-ref="mongo" />

    <bean id="mappingContext" class="org.springframework.data.mongodb.core.mapping.MongoMappingContext" />

    <bean id="defaultMongoTypeMapper" class="org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper">
        <constructor-arg name="typeKey"><null /></constructor-arg>
    </bean>

    <bean id="mappingMongoConverter" class="org.springframework.data.mongodb.core.convert.MappingMongoConverter">
        <constructor-arg name="mongoDbFactory" ref="mongoDbFactory" />
        <constructor-arg name="mappingContext" ref="mappingContext" />
        <property name="typeMapper" ref="defaultMongoTypeMapper" />
    </bean>

    <bean id="mongoTemplate" class="org.springframework.data.mongodb.core.MongoTemplate">
        <constructor-arg name="mongoDbFactory" ref="mongoDbFactory" />
        <constructor-arg name="mongoConverter" ref="mappingMongoConverter" />
    </bean>

</beans>
```

### 然后代码里面就可以引用这个配置文件了

```java
@Configuration
@EnableAutoConfiguration
@EnableAspectJAutoProxy(proxyTargetClass = true)
@ComponentScan("com.xiangrikui.content")
@ImportResource("classpath:mongo.xml")
public class ApiService extends WebMvcConfigurerAdapter {
    @Autowired
    HttpInterceptor httpInterceptor;

    public static void main(String[] args) {

        SpringApplication.run(ApiService.class, args);
    }
}
```

说完xml配置，那我们来谈谈注解配置。作为spring的脑残粉，xml当然是我们最痛恨的配置了，又长又啰嗦，注解才是我们需要的配置。spring boot本身就是“约定大于配置”而开发出来的框架，那spring boot如何注解配置呢，现在道来！

作为程序员，学一样东西当然先去下载，然后看官方文档啦，官方给出的配置是这样滴：

```Bash
# MONGODB (MongoProperties)
spring.data.mongodb.host= # the db host
spring.data.mongodb.port=27017 # the connection port (defaults to 27107)
spring.data.mongodb.uri=mongodb://localhost/test # connection URL
spring.data.mongodb.database=
spring.data.mongodb.authentication-database=
spring.data.mongodb.grid-fs-database=
spring.data.mongodb.username=
spring.data.mongodb.password=
spring.data.mongodb.repositories.enabled=true # if spring data repository support is enabled
```

这样是默认的配置，在此，叶子先不使用默认配置，教教大家如何配置自定义mongodb的bean。 spring会默认读取官方配置文件里面的配置，然后构建mongoTemplate。看里面源码可以知道，生成mongoTemplate需要一个MongoDbFactory

```java
/**
 * Constructor used for a basic template configuration.
 *
 * @param mongoDbFactory must not be {@literal null}.
 */
public MongoTemplate(MongoDbFactory mongoDbFactory) {
	this(mongoDbFactory, null);
}
```

而生成mongoDbFactory的实现SimpleMongoDbFactory又需要mongo这个类

```java
/**
 * Create an instance of {@link SimpleMongoDbFactory} given the {@link Mongo} instance and database name.
 *
 * @param mongo Mongo instance, must not be {@literal null}.
 * @param databaseName database name, not be {@literal null} or empty.
 */
public SimpleMongoDbFactory(Mongo mongo, String databaseName) {
	this(mongo, databaseName, null);
}
```

但是细心的开发者可以看出mongo这个类已经放弃使用，里面方法也都是过期了，怎么办啊？ 别急，叶子找到了MongoClient这个类，继承了mongo类，持有MongoClientOptions的操作配置！这不就是我们要找的吗？

```java
/*
 * Copyright (c) 2008-2014 MongoDB, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.mongodb;

import java.net.UnknownHostException;
import java.util.List;

public class MongoClient extends Mongo {

    private final MongoClientOptions options;

    public MongoClient() throws UnknownHostException {
        this(new ServerAddress());
    }


    public MongoClient(String host, int port) throws UnknownHostException {
        this(new ServerAddress(host, port));
    }

    public MongoClient(ServerAddress addr) {
        this(addr, new MongoClientOptions.Builder().build());
    }


    public MongoClient(ServerAddress addr, MongoClientOptions options) {
        this(addr, null, options);
    }


    public MongoClient(List<ServerAddress> seeds, List<MongoCredential> credentialsList) {
        this(seeds, credentialsList, new MongoClientOptions.Builder().build());
    }

    public MongoClient(MongoClientURI uri) throws UnknownHostException {
        super(new MongoURI(uri));
        this.options = uri.getOptions();
    }

    public List<MongoCredential> getCredentialsList() {
        return getAuthority().getCredentialsStore().asList();
    }

    public MongoClientOptions getMongoClientOptions() {
        return options;
    }
}
```

我删除这个类大部分不需要的方法，只留一些，方便各位小伙伴阅读。其中可以看出，集群不集群其实就是一个你是不是用集合地址的问题，ServerAddress如果是集合list的话，那就是集群了！是不是很简单 还有一种就是MongoClientURI，看里面源码就知道里面其实就是一个简单的截取字符串,我这里不全部讲解了，里面有个函数大家可以看看：Collections.addAll(all, serverPart.split(",")); 简单来说就是多个uri用逗号分隔。说到这里大家会惊叹，我TMD这样就集群了？太简单了吧！ 对于mongodb本身已经配置好集群，开发者再用代码去配置，确实很简单就能集群了 看图说话：

![image](http://7te9zv.com1.z0.glb.clouddn.com/mongorep2.png)

### 言归正传！ 叶子的配置：

```Bash
#mongodb的uri，集群的话用逗号分隔
mongodb.uri=mongodb://192.168.30.181:27017,192.168.30.183:27017
mongodb.database=reader_production
```

然后新建一个mongodb配置类

```java
@Configuration
public class MongoConfiguration {

    @Value("${mongodb.uri}")
    private String mongoURI;
    @Value("${mongodb.database}")
    private String dataBase;

    @Bean
    public MongoTemplate mongoTemplate() throws UnknownHostException {
//        List<ServerAddress> serverAddresses = Lists.newArrayList();
//        serverAddresses.add(new ServerAddress("192.168.30.181",27017));
//        serverAddresses.add(new ServerAddress("192.168.30.183",27017));
//        MongoClient client = new MongoClient(serverAddresses);
        MongoClient client = new MongoClient(new MongoClientURI(mongoURI));
        //优先从secondary节点进行读取操作，secondary节点不可用时从主节点读取数据
        client.setReadPreference(ReadPreference.secondaryPreferred());
        MongoDbFactory mongoDbFactory = new SimpleMongoDbFactory(client,dataBase);
        MongoTemplate mongoTemplate = new MongoTemplate(mongoDbFactory);
        MappingMongoConverter mongoConverter = (MappingMongoConverter) mongoTemplate.getConverter();
        //把spring data mongodb _class这个字段去掉
        mongoConverter.setTypeMapper(new DefaultMongoTypeMapper(null));
        return mongoTemplate;
    }
}
client.setReadPreference(ReadPreference.secondaryPreferred());

```

这里声明了主从模式是怎么样的，但是有个疑问就是，为啥mongoclient已经持有操作类，但是在mongoTemplate也持有呢？代码如此啰嗦是为什么？知道的可以告诉一下叶子哈:)

### 主从模式基本参数是：
    primary:默认参数，只从主节点上进行读取操作；
    primaryPreferred:大部分从主节点上读取数据,只有主节点不可用时从secondary节点读取数据。
    secondary:只从secondary节点上进行读取操作，存在的问题是secondary节点的数据会比primary节点数据“旧”。
    secondaryPreferred:优先从secondary节点进行读取操作，secondary节点不可用时从主节点读取数据；
    nearest:不管是主节点、secondary节点，从网络延迟最低的节点上读取数据。
这样就完成配置，xml和注解都一样是需要引入mongoTemplate才能去做操作的，如何操作这里就不作介绍了，以免文章杂而无章。

