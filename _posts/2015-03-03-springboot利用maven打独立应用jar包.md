---
layout: post
title: springboot用maven打独立应用的jar包
date:   2015-03-03 10:18:00
tags: maven SpringBoot
cover:  http://7te9zv.com1.z0.glb.clouddn.com/images.png
subclass: 'post tag-fiction'
categories: 'casper'
navigation: True
---

如果用过spring boot的都知道，其引入了嵌入式web容器运行的。但是如果打包成jar包，方便是方便，但是无法通过修改配置文件--重启应用就达到想要的效果，必须又要重新打一个jar包。而lib依赖也是如此，很多时候都可以不变的，没必要发布都要打包吧。
以下内容你将会学到如何利用maven插件构建独立jar包，发布应用到正式环境的流程。


    这里会使用到maven，如果不熟识的自行先去补习以下：）
    假设你已经有了spring boot应用，你就可以执行以下操作

### 第一步：修改pom配置
我继续使用动态构建目标环境的配置，如果不熟识，可以先去[maven构建不同环境读取不同的配置文件](http://blog.lo168.com/maven构建不同环境读取不同的配置文件.html)看看复习一下

配置部分:

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
        <!-- 正服 -->
        <profile>
            <id>product</id>
            <properties>
                <env>product</env>
            </properties>
        </profile>
</profiles>
<build>
<resources>
            <resource>
                <directory>${project.basedir}/src/main/resources/${env}</directory>
                <includes>
                    <include>application.properties</include>
                </includes>
                <filtering>true</filtering>
            </resource>
        </resources>
        <sourceDirectory>src/main/java</sourceDirectory>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <configuration>
                    <archive>
                        <manifest>
                            <addClasspath>true</addClasspath>
                            <!-- 加载的class目录的前缀（依赖的jar目录） -->
                            <classpathPrefix>lib/</classpathPrefix>
                            <!-- 入口 -->
                            <mainClass>com.test.jpa.ApiService</mainClass>
                        </manifest>
                    </archive>
                </configuration>
            </plugin>
            <!-- 把依赖的jar包拷到lib目录下 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-dependency-plugin</artifactId>
                <executions>
                    <execution>
                        <id>copy-dependencies</id>
                        <phase>package</phase>
                        <goals>
                            <goal>copy-dependencies</goal>
                        </goals>
                        <configuration>
                            <outputDirectory>${project.build.directory}/lib</outputDirectory>
                            <overWriteReleases>false</overWriteReleases>
                            <overWriteSnapshots>false</overWriteSnapshots>
                            <overWriteIfNewer>true</overWriteIfNewer>
                        </configuration>
                    </execution>
                </executions>
            </plugin>

            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <version>2.3</version>
                <executions>
                    <execution>
                        <id>copy-resources</id>
                        <phase>package</phase>
                        <goals>
                            <goal>copy-resources</goal>
                        </goals>
                        <configuration>
                            <encoding>UTF-8</encoding>
                            <!-- 把配置文件拷到和jar包同一个路径下 -->
                            <outputDirectory>${project.build.directory}</outputDirectory>
                            <resources>
                                <resource>
                                    <directory>src/main/resources/${env}/</directory>
                                    <includes>
                                        <include>application.properties</include>
                                    </includes>
                                    <filtering>true</filtering>
                                </resource>
                            </resources>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
            <!-- 打jar包时需要把配置文件给排除在外 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>jar</goal>
                        </goals>
                        <configuration>
                            <classifier>${env}</classifier>
                            <excludes>
                                <exclude>application.properties</exclude>
                            </excludes>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
```

我没有copy模块名称和依赖的配置，因为各有各不同。
其中大家可以留意

```xml
<id>copy-resources</id>
<phase>package</phase>
<goals>
    <goal>copy-resources</goal>
</goals>
<configuration>
    <encoding>UTF-8</encoding>
    <!-- 把配置文件拷到和jar包同一个路径下 -->
    <outputDirectory>${project.build.directory}</outputDirectory>
    <resources>
        <resource>
            <directory>src/main/resources/${env}/</directory>
            <includes>
                <include>application.properties</include>
            </includes>
            <filtering>true</filtering>
        </resource>
    </resources>
</configuration>
```

这个是重点，把配置文件copy到jar包同级目录，并且指定outputDirectory是读取同级目录的配置文件为springboot的自身配置。lib依赖包同理，我就不多说了。

### 第二步：执行maven命令
读过我那篇maven不同环境配置都知道，maven打包命令应该是:

```Bash
mvn clean package -P${env}
```
假设我要发布一个正式环境的jar包，那应该就是:

```Bash
mvn clean package -Pproduct
```

ok，执行完命令之后，去程序目录的target里面看看是否已经生产了配置文件，jar包，还有lib依赖文件夹？
因为方便区别，我特意把包的别名改成环境的别名，留意这一段：

```xml
<configuration>
  <classifier>${env}</classifier>
    <excludes>
        <exclude>application.properties</exclude>
    </excludes>
</configuration>

```
这样打出来的包名为:**xxx-1.0-SNAPSHOT-product.jar**

### 第三步：执行命令并修改配置重启
各位应该都跃跃欲试了，到这一步就可以执行命令来看看是否成功。

```Bash
java -jar xxx-1.0-SNAPSHOT-product.jar
```

如果启动没问题，就说明lib依赖和配置文件能够正确读取，jar应用正确分离出来了。
这样，小伙伴们就能随便修改配置文件而不需要重新打包啦:-)


那如果更新到外网，那我们就可以区分多种更新了。
1.更新应用代码，也就是jar包，重启。
2.只更新配置文件，重启。

这样问题就来了？如何才能更加方便自己去发布不同地址服务器，并执行停止，启动或重启动作呢？
这样的话，就要用到shell脚本了。编写这样的脚本，发布动作就变得异常简单。欲知如何编写？叶子下回分解
