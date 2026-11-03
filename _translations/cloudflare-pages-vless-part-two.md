---
title: "Cloudflare Pages: Deploying a Free-Forever Node, Part Two"
translation_of: "2026-06-03-cloudflare pages搭建永久免费节点第二弹"
excerpt: "Deploy the project with a KV namespace, an administrator password, and a second Pages deployment."
---

This tutorial is for learning about Cloudflare deployment, not for commercial use.

## Register with Cloudflare

Cloudflare is a well-known CDN provider with services such as reverse proxies, tunneling, and SSL. Its individual free plan covers the learning setup in this tutorial.

Workers and Pages are among its services. Here, we use Pages to deploy a VLESS node service.

Visit [Cloudflare](https://www.cloudflare-cn.com/plans/) and choose the free plan near the bottom of the page.

![Cloudflare registration](/assets/images/image-20230614174502783.png)

The registration process is straightforward. Remember to **verify your email**.

### Create a KV namespace

1. In your Cloudflare account, select **Storage & databases → Workers KV**, enter a namespace name, and click **Create**.

![Create a KV namespace](/assets/images/image-20260603165020587.png)

### Create a Pages application

1. Download the latest project ZIP: [edgetunnel-main.zip](https://github.com/cmliu/edgetunnel/archive/refs/heads/main.zip).
2. Select **Compute & AI → Workers & Pages → Create application**.

![Create application](/assets/images/image-20260603165449077.png)

<ol start="3"><li>Click <strong>Get started</strong>.</li></ol>

![Get started](/assets/images/image-20260603165602330.png)

![Choose a deployment method](/assets/images/image-20260603165637934.png)

<ol start="4"><li>Enter a project name and click <strong>Create project</strong>.</li></ol>

![Create project](/assets/images/image-20260603165830670.png)

<ol start="5"><li>Upload the ZIP you downloaded, then click <strong>Deploy site</strong>.</li></ol>

![Upload and deploy](/assets/images/image-20260603170010990.png)

<ol start="6"><li>After deployment succeeds, click <strong>Continue to project</strong>.</li></ol>

![Continue to project](/assets/images/image-20260603170104788.png)

<ol start="7"><li>Open <strong>Settings → Variables and Secrets</strong> to add a variable.</li></ol>

![Variables and secrets](/assets/images/image-20260603170319158.png)

<ol start="8"><li>Add <code>ADMIN</code> and set its value to the administrator login password. Click <strong>Save</strong>.</li></ol>

![Set the administrator password](/assets/images/image-20260603170605959.png)

<ol start="9"><li>Bind the KV namespace created earlier. The binding's variable name must be uppercase <code>KV</code>.</li></ol>

![Choose the KV namespace](/assets/images/image-20260603171107991.png)

![Configure the binding](/assets/images/image-20260603171147718.png)

![Save the binding](/assets/images/image-20260603171238638.png)

<ol start="10"><li>After saving, click <strong>Create deployment</strong>.</li></ol>

![Create another deployment](/assets/images/image-20260603170727682.png)

<ol start="11"><li>Upload the project again, then click <strong>Save and Deploy</strong>.</li></ol>

![Save and deploy](/assets/images/image-20260603170824893.png)

<ol start="12"><li>The success page confirms deployment and provides the production URL.</li></ol>

![Production deployment](/assets/images/image-20260603171429766.png)

<ol start="13"><li>Open the deployed URL in a browser and append <code>/login</code>, for example <code>https://edt-8pd.pages.dev/login</code>. Sign in with the password you set in the variable.</li></ol>

![Login page](/assets/images/image-20260603171609009.png)

![Project dashboard](/assets/images/image-20260603171710423.png)

Congratulations, your own deployment is ready. Subscription setup is outside the scope of this walkthrough.

> Finally, do not share your account or connection links with others, or use them for profit. Doing so may violate criminal law and have serious consequences.
