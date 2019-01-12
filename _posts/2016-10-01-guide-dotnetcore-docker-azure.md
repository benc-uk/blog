---
title: ASP.NET Core on Docker in Azure
tags: [azure, docker, dotnet-core, guide]
---

This is a series of posts providing a step by step guide on creating a ASP.NET Core web app, then creating a Docker host in Azure to run it, finally publishing and running your ASP.NET app as a Docker image &amp; container. I've split this into three sub-posts to keep it manageable &amp; readable.

You do not need Windows or Visual Studio for this exercise (welcome to the new Microsoft!), all tools used are open source and multi-platform, I'll be using Windows for basic convenience. Naturally the Docker host will be on Linux.

The three parts are pretty much independent. If you already know ASP.NET Core or have an existing app you can skip part 1\. If you already have a Docker host running somewhere (maybe not in Azure, heaven forbid!) then skip ahead to part 3.

You will need an Azure subscription for part 2, you can get a free subscription with $25 per month of credit via '[Visual Studio Dev Essentials](https://www.visualstudio.com/dev-essentials/)'

* Part 1 - [Build your first ASP.NET Core web app](/dotcore-web-app-101/)
* Part 2 - [Docker Machine and Azure](/docker-machine-and-azure/)
* Part 3 - [Running your ASP.NET Core app in Docker](/netcore-in-docker/)