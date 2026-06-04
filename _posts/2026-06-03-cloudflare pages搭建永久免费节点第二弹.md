---
layout: post
title: cloudflare pages搭建永久免费节点第二弹
date:   2026-06-03 10:18:00 +0800
tags: utils
cover: ../assets/images/image-20230615105617585.png
subclass: 'post tag-fiction'
categories: 'casper'
navigation: True

---

本教程主要用于cludflare学习搭建，非盈利性质

## 注册cloudflare

> Cloudflare 是全球知名的CDN服务商，还有各种例如反代、内网穿透、ssl等功能，能够很好的帮助你的网站提升体验，个人免费的套餐就已经足够我们日常使用了
>
> 其中里面有worker和pages，pages可以帮助部署项目，比github pages更为强大，我们这次就是利用这个pages免费为我们搭建一个vless节点服务

前往[cloudflare](https://www.cloudflare-cn.com/plans/) 点击页面下方免费套餐

![image-20230614174502783](../assets/images/image-20230614174502783.png)

注册流程非常简单，这里不再作详细说明了，大家记得**验证邮箱**



### 创建 KV命名空间

1. 准备一个 Cloudflare 账号，点击 `储存和数据库` > `Workers KV` > 输入任意名称点击`创建`即可

![image-20260603165020587](../assets/images/image-20260603165020587.png)



### 创建 Pages 应用程序

1. 点击 [edgetunnel-main.zip](https://github.com/cmliu/edgetunnel/archive/refs/heads/main.zip) 下载最新版本项目压缩包备用；
2. 点击 `计算和AI` > `Workers 和 Pages` > `创建应用程序`；

![image-20260603165449077](../assets/images/image-20260603165449077.png)



<ol start="3">
<li>点击 <code>开始使用</code></li>
</ol>

![image-20260603165602330](../assets/images/image-20260603165602330.png)

![image-20260603165637934](../assets/images/image-20260603165637934.png)

<ol start="4">
<li>填写项目名称后点击 <code>创建项目</code></li>
</ol>

![image-20260603165830670](../assets/images/image-20260603165830670.png)



<ol start="5">
<li>点击 <code>上传</code> 刚刚下载的压缩包然后 <code>部署站点</code></li>
</ol>

![image-20260603170010990](../assets/images/image-20260603170010990.png)



<ol start="6">
<li>部署成功会跳转页面，点击 <code>继续处理项目</code></li>
</ol>

![image-20260603170104788](../assets/images/image-20260603170104788.png)



<ol start="7">
<li>选择 <code>设置</code> &gt; <code>变量和机密</code> 添加变量</li>
</ol>

![image-20260603170319158](../assets/images/image-20260603170319158.png)



<ol start="8">
<li>输入 ADMIN 变量和值（后台管理员登录的密码）后，点击 <code>保存</code></li>
</ol>

![image-20260603170605959](../assets/images/image-20260603170605959.png)



<ol start="9">
<li>绑定 KV 命名空间，选择刚刚创建的 KV 命名空间（变量名称需要大写“KV”）</li>
</ol>

![image-20260603171107991](../assets/images/image-20260603171107991.png)

![image-20260603171147718](../assets/images/image-20260603171147718.png)

![image-20260603171238638](../assets/images/image-20260603171238638.png)



<ol start="10">
<li>保存后点击 <code>创建部署</code></li>
</ol>

![image-20260603170727682](../assets/images/image-20260603170727682.png)



<ol start="11">
<li>进行二次部署，上传后点击 <code>保存并部署</code></li>
</ol>

![image-20260603170824893](../assets/images/image-20260603170824893.png)



<ol start="12">
<li>看到这个页面就证明已经部署成功并有实际的生产链接</li>
</ol>

![image-20260603171429766](../assets/images/image-20260603171429766.png)



<ol start="13">
<li>在浏览器部署成功的地址，后面添加 /login 即可打开（如教程的地址：https://edt-8pd.pages.dev/login），然后输入你变量的密码进入</li>
</ol>

![image-20260603171609009](../assets/images/image-20260603171609009.png)

![image-20260603171710423](../assets/images/image-20260603171710423.png)

> ### 恭喜你已经成功部署你的专属通道，接下来如何订阅我就不详细说明了
>



> ## 最后最后，奉劝大家科学上网之余千万别把账号、链接提供他人，或作盈利之用，这有可能触犯刑法，后果严重
