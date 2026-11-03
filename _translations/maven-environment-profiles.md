---
title: "Loading Environment-Specific Configuration with Maven"
translation_of: "2015-01-01-maven构建不同环境读取不同的配置文件"
excerpt: "Use Maven profiles to package the right configuration for development, testing, and production."
---

Maven is a powerful tool for Java development. This time, let's look at deploying the same project to different environments. It will also lay the groundwork for a later discussion of building projects with Jenkins.

I'll use a Spring Boot project as an example. The same principle applies to other projects, although some configuration may differ.

### Configure profiles in pom.xml

Add the following under the root `project` element:

```xml
<profiles>

 <!-- 开发环境，默认激活 -->
     <profile>
        <id>dev</id>
      <properties>
         <env>dev</env>
       </properties>
       <activation>
            <activeByDefault>true</activeByDefault>
       </activation>
 </profile>

 <!-- 测服 -->
 <profile>
      <id>test</id>
        <properties>
           <env>test</env>
        </properties>
 </profile>

 <!-- 正服 -->
  <profile>
      <id>product</id>
       <properties>
         <env>product</env>
       </properties>
  </profile>

 </profiles>
```

### Add resource paths under build

```xml
<!--资源引入-->
<resources>
     <resource>
           <directory>${project.basedir}/src/main/resources/${env}</directory>
        <includes>
             <include>application.properties</include>
        </includes>
      <filtering>true</filtering><!--这个相当重要，不加就不能动态构建不同资源了-->
     </resource>
 </resources>



<!--构建的主要插件-->
 <plugins>
      <plugin>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>

 <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-war-plugin</artifactId>
      <configuration>
         <warName>tiles</warName>
       <archive>
         <addMavenDescriptor>false</addMavenDescriptor>
       </archive>
   <webResources>
       <resource>
           <directory>src/main/resources/${env}/application.properties</directory>
           <filtering>true</filtering>
       </resource>
   </webResources>
       </configuration>
 </plugin>

 </plugins>
```

Notice the WAR plugin: it is used when building the deployable version. The `webResources` section reads the project's configuration file. Its `directory` uses `${env}`, the environment variable defined in the profiles above.

When you package with the `test` profile, `env` becomes `test`. This lets the build select the configuration it needs dynamically.

### The important final step

Pass the target environment when building. The command is `mvn clean package -P` followed by the target profile ID. For example, to build for the test environment:

```bash
mvn clean package -Ptest
```

More generally, use `mvn clean package -P` followed by the profile ID. In a later Jenkins setup, we can agree to use `test` for testing and `product` for production.

I've left out the project's name, version, and dependencies, since those vary between projects.
