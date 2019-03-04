---
title: Running Node.js in Azure App Service
tags: [azure, nodejs, git, vsts]
---
I've been using Node.js quite a lot lately as I find it a nice quick way to get web projects started easily, and one of the things I've been doing is deploying and running my Node.js apps in Azure. Azure provides a number of ways of to run Node.js code within the platform, but I'll be focusing on the PaaS Azure App Services or Web Apps ([more info](https://docs.microsoft.com/en-us/azure/app-service-web/)), rather than VMs or anything strange.

Why write a blog about this? Isn't using Node.js with Azure Web Apps all easy and already documented? Well... kinda, there is documentation but there's also a lot of gotchas, semi-hidden features and things I stumbled across which made me feel like gathering all these nuggets of info into one place

<!--more-->

In this post I'll focus on "normal" App Services (which are Windows based), I'll cover the newer Linux App Services in a second post. They are a much better option for running Node.js in my opinion

## App Services Background
Being a PaaS (Platform as a Service) offering, Azure App Services make life easy for developers, they provide a simple way to deploy and run your code, all the messing with VMs, OS config, networking, scaling, etc is hidden away. However it's worth understanding a little of what is going on; behind the scenes App Services are Windows VMs running IIS. Another part of App Services you need to be aware of is called Kudu, which you can think of as a hidden admin portal for your app, allowing you to do various management tasks, such as access a remote console, view logs and processes, edit files and of course deploy your code. Kudu is opensource and [more info can be found on Github](https://github.com/projectkudu/kudu/)

App Services supports a range of dev platforms, such as .NET, PHP, Java, Python and of course Node.js. Some of these like .NET & PHP are trivial to run under IIS, Node.js (which we'll call just 'Node' from here) is a little different.

## iisnode 
Node is a funny platform, unlike .NET, PHP, Java etc, it doesn't run hosted inside an web/app server, your code *is* the webserver. In many cases using something like Express to bind to a port, and accept HTTP requests directly. Node.exe will be the execution environment, but it's not a webserver.  
Under the covers App Services uses a "bridge" project called [**iisnode**](https://github.com/tjanczuk/iisnode/wiki), which is a native IIS module used to host Node. Thankfully we don't need to understand the details other than it's there and App Services uses it.

## Node in Azure App Services 
All of this means there's two things that need to happen for your Node code to run happily in an Azure App Service:
 - At some point `npm install` needs to be run, either before or after deployment. This is a standard part of Node development, which populates your node_modules directory. This folder can be **huge** sometimes containing 10,000+ folders and files,which can present a challenge & slow down deployments.  
 - A valid `web.config` needs to be generated or deployed. It is this file that instructs **iisnode** and tells it which .js file to launch as the entry point to your app. I'll cover the details/contents of this file later.

Interestingly not a single mention of either of these is made on the "Create a Node.js app in Azure Web Apps" [getting started page](https://docs.microsoft.com/en-gb/azure/app-service-web/app-service-web-get-started-nodejs), which led to much confusion for me further down the line.  
How and when these two pieces happen boils down to how you deploy your code to your App Service. Which leads me to...

## Deployment via Git / Github 
This is by far the simplest way to deploy your Node app to an Azure App Service, and also the method that employs the most "hidden magic". Linking your App Service to git is easy, simply click on 'Deployment Options' when viewing your Web App in the portal. If deploying via a local git repo you will get a .git URL to point your repo at as a remote, with Github there will be a sync option within the portal. 

When you do a git push it will trigger deployment automation task within Kudu, if you watch the output of the git push command you will see various things happening (the hidden magic I referred to earlier). Kudu is doing some clever stuff here, It will look inside your `package.json` file and work out which is the main .js file for your app, as specified in the `scripts` section as the `start` script. It will use this and generate a valid web.config for you. 
Next it will run `npm install --production` to restore all the packages your app needs.

{% include img src="gitout.png" alt="Here is a screenshot of the git output with the Kudu parts highlighted" caption=true %}

This is all kinda great, you're getting continuous deployment (build and release automation) for free, all built into the platform where your code will run. If I was being a DevOps purist there's also a downside - you're going straight from your code into a running deployed site, no chance to run unit tests, manage artifacts etc

One last thing before we move on, it's worth being aware of the [many configurable settings that Kudu has](https://github.com/projectkudu/kudu/wiki/Configurable-settings) and in particular the `PROJECT` setting which specifies which folder in your git repo to deploy rather than the whole thing from the root.


## Deployment via Visual Studio Team Services 
This is a slightly more managed deployment path where you have more control over what is happening. VSTS is a complex beast with a lot of features, I'll be focusing on the Release aspect, and specifically the *Deploy Azure App Service* task

{% include img src="vsts-task.png" %}

First time I tried to use this in VSTS to deploy my Node app to an App Service it was a failure. In trying to figure out why, lead me to discovering things like iisnode, web.config requirement and all the nice auto-magic that Kudu was doing to my previous git deployments.

In a nutshell; by default this task just dumps your files into your App Service, which is why it won't work with Node applications without some settings changes.

Firstly getting the `web.config` generated, this required not only ticking the fairly obvious tickbox but also providing a bunch of arcane undocumented parameters, as follows

{% include img src="vsts-webconfig.png" alt="Hardly obvious!" caption=true %}

I had to look in the [sourcecode of the VSTS task](https://github.com/Microsoft/vsts-tasks/blob/master/Tasks/Common/webdeployment-common/webconfigutil.ts) to figure them out!  
Note. The `NodeStartFile` parameter defaults to `server.js` so can be omitted if that's the name of your start file, also note it is not smart like Kudu so won't examine your `package.json` to get the correct filename

That leaves the `npm install` part, with VSTS you have a choice:
- Pre deploy. Run `npm install` as part of your build process and create a zip/artifact bundle which you then release with the *Deploy Azure App Service* task. This feels the most correct in terms of overall process, but has the downside of needing to transfer a **lot** of files with your release and to/from VSTS's artifact store.
- Post deploy. Use the "Inline Script" option on the *Deploy Azure App Service* task. Which looks like this

{% include img src="vsts-npminstall.png" alt="This works" %}


## Deployment via FTP / Dropbox / OneDrive etc
Now we're hitting the more "low cost" options. App Services supports a number of file transfer methods like FTP, OneDrive and Dropbox to get your stuff deployed. Here we get no automation, so you're on your own.

For the `web.config` file you'll need to bundle it with your code, you can use [this sample](https://github.com/projectkudu/kudu/wiki/Using-a-custom-web.config-for-Node-apps). This isn't a major downside as the contents are essentially static anyhow.

For running `npm install` you can do two things: 
- Pre deploy. Run `npm install` before you upload to the App Service. This has the snag that you're transferring a tonne (often thousands) of files that essentially are not part of your app. Plus you'll need to manage any differences between your `devDependencies` and your production packages
- Post deploy. Run the command manually using the [Kudu remote console](https://github.com/projectkudu/kudu/wiki/Kudu-console) 

## Zipdeploy (New! Oct 2017)
A late update to this post, is the [new Zipdeploy means to deploy to an app service](https://blogs.msdn.microsoft.com/appserviceteam/2017/10/16/zip-push-deployment-for-web-apps-functions-and-webjobs/). With Zipdeploy you simply HTTP POST a zip file containing your site/app over to Kudu, and bingo it gets deployed. 

By default it assumes the zip contains a complete functioning site, so will require you to include `web.config` and `node_modules`. However you can tell Kudu to carry out the same steps as it does when deploying from Git, if you set `SCM_DO_BUILD_DURING_DEPLOYMENT` to **true**, this means you don't need to worry about manually creating a web.config or zipping up all those node_modules files. 

If you want to include the `SCM_DO_BUILD_DURING_DEPLOYMENT` setting with your app, simply create a file called `.deployment` with the following contents

<pre><code class="language-ini">[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
</code></pre>

Include the `.deployment` file in your zip, and Kudu will do all the hard work of running `npm install` and creating `web.config`. Very nice.

## Node versions
One last issue you might see is not specifying the Node version you want to use, and your code will not start or will 500 error. If you created your Web App through the portal you won't have a problem, but if you created it via an ARM template or the CLI you could trip over this. In order to set the Node runtime version, you need to define an app setting called `WEBSITE_NODE_DEFAULT_VERSION` on your Web App. Apps created via the portal will have this set to version 6.9.1. Without this set, I found my deployed Node code would not start.  
You can also specify this in your `package.json`, in the `engines` section, however I found the app setting method more reliable when deploying through VSTS

In order to find out what other versions are supported by your App Service, hit the following Kudu URL: `https://{sitename}.scm.azurewebsites.net/api/diagnostics/runtime`

## Wrap Up

Here's a quick summary of the different Node deployment options with App Services

#### Git Deployment Summary
- **web.config** - Created automatically by Kudu from the start script setting specified in your `package.json`
- **npm install** - Run automatically post deployment by Kudu

#### VSTS Deployment Summary
- **web.config** - Generate with *Deploy Azure App Service* task and special options
- **npm install** - Automated choice of pre or post deployment

#### FTP Deployment Summary
- **web.config** - Bundle with your app code
- **npm install** - Run manually 

#### Zipdeploy Deployment Summary
- **web.config** - Can be created automatically by Kudu from the start script setting specified in your `package.json`
- **npm install** - Can be run automatically post deployment by Kudu

I'll do a follow up post for Linux Web Apps soon, where things are kinda different :)