---
title: "Receiving PUT Form Requests in Spring MVC"
translation_of: "2015-07-11-让springMVC接收PUT请求"
excerpt: "A small Spring configuration change for handling application/x-www-form-urlencoded PUT requests."
---

This example supports `application/x-www-form-urlencoded` only.

Add this bean to Spring:

```java
@Bean
public Filter initializeHttpPutHandler(){
	return new HttpPutFormContentFilter();
}
```

The Spring MVC application can then receive URL-encoded form data in PUT requests. This example does not support `form-data`; I planned to explore that separately.

