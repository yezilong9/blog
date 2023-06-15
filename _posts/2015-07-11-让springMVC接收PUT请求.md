---
layout: post
title: 让SpringMVC接收PUT方法
date:   2015-07-11 10:18:00
tags: spring
subclass: 'post tag-fiction'
categories: 'casper'
navigation: True
---

暂时只支持 application/x-www-form-urlencoded

spring加入bean

```java
@Bean
public Filter initializeHttpPutHandler(){
	return new HttpPutFormContentFilter();
}
```

即可使springmvc程序接收put的form表单请求。暂时只支持application/x-www-form-urlencoded
后续会开发form-data的方式
