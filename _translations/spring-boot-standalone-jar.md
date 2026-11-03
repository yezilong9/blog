---
title: "Packaging a Standalone Spring Boot JAR with Maven"
translation_of: "2015-03-03-springboot利用maven打独立应用jar包"
excerpt: "Separate application code, configuration, and dependencies so a configuration update does not require rebuilding the JAR."
---

Spring Boot embeds a web container, which makes running an application convenient. But if configuration is packaged inside the JAR, changing it can mean rebuilding the whole artifact. Dependencies often stay the same between releases too, so why package them again every time?

Here, we'll use Maven plugins to separate the application JAR, configuration, and dependency directory, then walk through a production build.

This walkthrough uses Maven, so brush up on it first if it is unfamiliar. Assuming you already have a Spring Boot application, you can follow the steps below.

### Step 1: Update pom.xml

I will continue using environment-specific builds. For background, see [Loading Environment-Specific Configuration with Maven]({{ '/en/maven-environment-profiles/' | relative_url }}).

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

I've omitted module names and dependencies because they vary between projects.

Pay particular attention to this part:

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

This is the key: copy the configuration file to the same directory as the JAR. The example sets `outputDirectory` to `${project.build.directory}` so that Spring Boot can read the configuration alongside the application. The same idea applies to the dependency JARs in `lib`.

The dependency plugin follows the same idea, placing libraries in `target/lib`. The manifest then refers to that directory through `classpathPrefix`.

### Step 2: Run Maven

As in the environment-profile article, the general command is:

```bash
mvn clean package -P${env}
```

For production, run:

```bash
mvn clean package -Pproduct
```

Check `target/`: it should now contain the configuration file, application JAR, and `lib` directory.

To make environments easy to distinguish, the configuration uses `${env}` as the JAR classifier:

```xml
<configuration>
  <classifier>${env}</classifier>
    <excludes>
        <exclude>application.properties</exclude>
    </excludes>
</configuration>

```

The resulting filename looks like **`xxx-1.0-SNAPSHOT-product.jar`**.

### Step 3: Run it, change configuration, and restart

```bash
java -jar xxx-1.0-SNAPSHOT-product.jar
```

If the application starts successfully, the dependencies and configuration are being found and the pieces have been separated correctly.

Now configuration can be changed without rebuilding the application JAR.

Deployment updates can be split into two cases:

1. Update application code by replacing the JAR and restarting.
2. Update only the configuration file and restart.

How can we make deployment to different servers, including stop, start, and restart operations, more convenient? Shell scripts are a natural next step. I'll leave that for another post.
