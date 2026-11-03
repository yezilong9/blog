---
title: "Configuring MongoDB Replica Sets in Spring: XML and Annotations"
translation_of: "2015-02-02-spring mvc mongo集群(xml和注解)"
excerpt: "Configure MongoTemplate with XML or Java annotations, then choose how reads are routed across a MongoDB replica set."
---

Work has been keeping me busy, with late nights at the office and little time to update the blog. Time to share something useful!

This article covers MongoDB cluster configuration using Spring XML and annotations, along with a brief look at the `MongoTemplate` source code.

**Prerequisite: MongoDB replication must already be configured.**

MongoDB is a popular NoSQL database when read performance matters. Spring offers friendly integration through repositories and templates. Here, we'll focus on `MongoTemplate`, which exposes MongoDB operations. In practice, you may want to wrap it in a helper that better fits your own application.

I'll use Spring Boot, but XML configuration in Spring MVC or other Spring projects follows similar principles.

### Add the Maven dependencies

```xml
<dependency>
	<artifactId>spring-boot-starter-data-mongodb</artifactId>
	<groupId>org.springframework.boot</groupId>
</dependency>
```

The starter already includes the driver and Spring Data packages. Without Spring Boot, the original example adds these dependencies explicitly:

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

### Configure MongoDB with XML

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

### Import the XML configuration

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

Now for annotations. As a Spring fan, I find long XML files rather tedious. Spring Boot embraces convention over configuration, so how do we configure this with Java?

The first step when learning a tool is to read its documentation. The configuration properties shown in the original Spring Boot documentation were:

```properties
# MONGODB (MongoProperties)
spring.data.mongodb.host=
spring.data.mongodb.port=27017
spring.data.mongodb.uri=mongodb://localhost/test
spring.data.mongodb.database=
spring.data.mongodb.authentication-database=
spring.data.mongodb.grid-fs-database=
spring.data.mongodb.username=
spring.data.mongodb.password=
spring.data.mongodb.repositories.enabled=true
```

Rather than use the default configuration, let's create a custom MongoDB bean. Normally, Spring reads its configuration properties and constructs `MongoTemplate`. Looking at the source shows that this requires a `MongoDbFactory`:

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

The `SimpleMongoDbFactory` implementation, in turn, needs a `Mongo` instance:

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

But the old `Mongo` class and its methods are deprecated in that driver version. Fortunately, `MongoClient` extends `Mongo` and exposes `MongoClientOptions`. Here are selected parts of the class, with unrelated methods omitted:

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

I removed most of the unnecessary methods and kept these to make the class easier to read. You can see that the difference in the cluster setup is whether you pass a collection of addresses: if `ServerAddress` is supplied as a list, that is the cluster configuration. Simple, isn't it?

Another option is `MongoClientURI`. Reading its source shows that it parses the address string. I won't cover the whole implementation here, but take a look at `Collections.addAll(all, serverPart.split(","));`: in short, multiple server addresses are separated by commas.

At this point you might be thinking, "That's all it takes?" Once the MongoDB cluster is configured on the database side, configuring the application to use it really is quite simple. Here is a screenshot:

![MongoDB replica-set configuration](http://7te9zv.com1.z0.glb.clouddn.com/mongorep2.png)

### My configuration

```properties
# Separate replica-set seed addresses with commas.
mongodb.uri=mongodb://192.168.30.181:27017,192.168.30.183:27017
mongodb.database=reader_production
```

Create a configuration class:

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

One question I had while reading this code: why does the configuration seem so verbose when both the client and template already hold database-related objects? Readers with a better explanation are welcome to share it!

### Read-preference options

- `primary`: the default; read only from the primary.
- `primaryPreferred`: usually read from the primary, falling back to a secondary when the primary is unavailable.
- `secondary`: read only from secondaries; their data may lag behind the primary.
- `secondaryPreferred`: prefer secondaries, falling back to the primary when no secondary is available.
- `nearest`: read from the member with the lowest network latency, whether primary or secondary.

That completes the configuration. Whether you use XML or annotations, your application can inject `MongoTemplate` to perform database operations. I'll leave the operations themselves for another article to keep this one focused.
