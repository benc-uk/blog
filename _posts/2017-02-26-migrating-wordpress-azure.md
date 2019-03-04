---
title: Migrating & Running Wordpress in Azure
tags: [app-insights, azure, mysql, app-service, wordpress]
---

Recently I decided to move my Wordpress blog from where it is hosted in a virtual shared Linux environment (TSO Host) into Azure. The current hosting is fine and has served me well over the years, but seeing as my current job is working with Azure I wanted to experiment. In particular my role is focused on the PaaS web &amp; app hosting services in Azure, so I wanted to see first hand what the experience was like, particularly for a non enterprise user.

> Note. Since this post was written I've migrated my blog (twice in fact!). Once into a static site using [Hexo](https://hexo.io/) and again using Jekyll. The blog currently is hosted in GitHub pages, and Azure and Wordpress etc is no longer a concern

The migration has been successful (hopefully this page loaded without errors!), so I've decided to capture my thoughts on the process and some of the challenges I encountered along the way

<!--more-->

#### Hosting - App Services

I picked the "**S1** **Standard**" pricing tier for my App Service plan, but I could have gone for **S2** if I was feeling fancy, and maybe I'll move it up later. One of the joys of Azure App Services is being able to flex at the drop of a hat. I did consider the **Basic** tier (this is just a blog after all) but one major thing missing from Basic was the built-in backups. It's worth mentioning that the App Service does also host a few other sites beside this blog.

> **Note.** I also went for the Windows version of the App Service (which is the default), Linux support is in preview but figured neither Wordpress, PHP or MySQL requires Linux so I picked the more well established platform. Azure App Services, being a PaaS offering has the OS well hidden away from you anyhow, so it almost makes no difference

#### Database - MySQL

Wordpress uses MySQL, there's no getting away from that. OK there's [Project Nami](https://github.com/ProjectNami/projectnami), but I didn't want to be using a forked version of Wordpress, so my MySQL options were:

- Run a VM running MySQL
- Use [ClearDB](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/SuccessBricksInc.ClearDBMySQLDatabase?tab=Overview) - who provide a PaaS version of MySQL in Azure
- Use a preview feature; ["in-app MySQL" ](https://azure.microsoft.com/en-gb/blog/mysql-in-app-preview-app-service/)

Well there was no way I was going to resort to using a VMs, I'm not a savage, I wanted a PaaS solution. I've also not heard good things about the ClearDB option, so I went for the in-app MySQL. This is a preview feature and the major downside is it won't scale to more than a single instance in your App Service, but I figured I could live with that for a personal website.

Some comments on using in-app MySQL:
- The admin console (good old phpMyAdmin) is really well hidden
{% include img src="phplink.png" alt="Spot the icon" %}

- Use the provided database '**localdb**' - You can create &amp; use other databases, but they will not be backed up (more on backup later).
- Use the provided builtin user account, called '**azure**' - You can create other users but it seems like you can not assign them any permissions on the databases, making it a waste of time
- Connecting to the database requires some subterfuge, and some of the documentation on this is out of date. Basically the port number for your MySQL instance and the password for the '**azure**' user are dynamic and held in an environmental variable called `MYSQLCONNSTR_localdb`. There's a couple of easy ways to get at the contents of this variable:, Connect to your Azure Web App via FTP and grab `/data/mysql/MYSQLCONNSTR_localdb.txt`, Connect to the Kudu console --> Process Explorer --> mysqld.exe --> Environmental Variables:
    {% include img src="proc-exp.png" alt="This is really handy" %}

#### Migration
Not much that's specific to Azure or that exciting here. With a CMS like Wordpress it's a fairly boring DB + files lift &amp; shift which I've done many times before:

- I used a standard MySQL export (to a plain SQL file) to export my blog database, then the phpMyAdmin console to import into my new '**localdb**' in Azure
- Compressed the Wordpress files from the root of my old blog site, as a gzip tar. Downloaded the archive then uploaded to my Azure Web App with FTP, then used the Kudu console to uncompress and place in `wwwroot`
- Edited the `wp-config.php` file and put in the new database connection parameters, apparently the port number can change and you shouldn't hard code it like this, but it hasn't changed for me yet
{% include img src="wp-conf.png" alt="Wordpress Config" %}
- As I was going to run the Azure version of the blog and the old one in parallel for a few days, I changed the Wordpress settings in `wp-config.php`  so the site URL temporarily pointed at the **.azurewebsites.net** version of the site
```php
define('WP_HOME','http://newblog.azurewebites.net');
define('WP_SITEURL','http://newblog.azurewebites.net');
```

#### DNS

Once the site was up and running and I was happy it was working, I was ready to swing across my DNS and make the Azure version live. Azure Web Apps makes [this very simple](https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-custom-domain-name). What wasn't very simple was my current DNS provider (Names.co.uk) and the time it took for A record changes to propagate, even after 48 hours I wasn't having any luck. So I bit the bullet and switched over to [Azure DNS](https://azure.microsoft.com/en-gb/services/dns/), which was something I was planning on doing, but much later.
The nameserver changes happened almost instantly, once my domain was managed in Azure DNS, adding the CNAMEs and A records to cut over was almost instant too, a much better experience.

#### Azure - Value Add Features

##### Backup

Now the site was up and running. it was time to enable backups. Azure Web Apps [makes turning on backups super easy, with a nice UI in the portal](https://docs.microsoft.com/en-us/azure/app-service-web/web-sites-backup). I already had a storage account I was using to backup my home NAS (perhaps a topic for another blog post) so I just used the Azure portal, switched on backups and pointed it at a new blob container in my storage account.
I went for a backup every 7 days and 120 days of retention, I could have gone for more frequent backups (down to 1 hour on the Basic App Service tier) but it seemed overkill for my blog

##### Monitoring

I wanted to monitor my blog, mainly to be alerted for availability issues, anything else I could get was a bonus. I was already using Azure Application Insights to remotely monitor my existing blog via its very cool web test feature. This is free and lets you monitor any URL from a range of global locations, at 5, 10 or 15 min intervals and be alerted if a set of locations report a failure.

I created a new  Azure Application Insights instance to monitor my blog, then set about seeing if I could get it integrated more deeply with Wordpress.
App Insights does [support PHP](https://github.com/Microsoft/ApplicationInsights-PHP), but it's down to the application to implement the telemetry, I wasn't going to be rewriting bits of the Wordpress codebase (been there, done that, lived to tell the tale) so in [order to get data from Wordpress I used a plugin](https://wordpress.org/plugins/application-insights). This was super simple to setup, I entered my App Insights instrumentation key, and bingo I saw data flowing in. This is currently costing nothing as the volume of collected data is less than 1GB per month. Nice.

{% include img src="ai2.png" alt="This is way more monitoring that my little blog needs!" %}

---

{% include img src="ai1.png" alt="Even more monitoring, from 6 locations globally" %}


##### CDN

The last big Azure feature I wanted to enable was [CDN](https://azure.microsoft.com/en-gb/services/cdn/). This sort of thing is normally overkill for a personal site like a blog but Azure makes it so easy I wanted to see what difference it made to performance. I went with the "Standard Verizon" pricing tier, I picked this over the Akami flavour, simply due to the fact with Verizon you get access to basic web console to view the status of your CDN (pricing is the same).

Deployment was super simple, created the CDN instance, then an endpoint for my blog. Once it was setup I used a [Wordpress plugin](https://wordpress.org/plugins/cdn-enabler/) which magically rewrites the URLs for all my static content (images, CSS, JS etc) to the CDN version of the URL. I didn't have to do anything other than give it my CDN endpoint URL. The results are not dramatic (some improvement from the US, see graph) but it was interesting learning experience having never played with anything big and scary like CDN before

{% include img src="cdn-times.png" alt="Slight improvement in response times" %}

#### Conclusions

Azure makes a great platform for hosting a CMS or blogging platform like Wordpress. I got a lot of big "enterprise" features like CDN, monitoring, alerting, backups and most of them were free or costing pennies per month and super easier to setup.
MySQL support in Azure is a bit of a weak spot. The In-app MySQL works but is limited and tricky to use, it also comes with the disclaimer "for dev/test only" (as it's a preview feature). I've heard rumors that a new PaaS MySQL offering might be coming soon, so fingers crossed.

If you're interested, this the resource group where everything is running, the storage account holding the backups lives in another group.

{% include img src="res-grp.png" alt="Azure resources" %}