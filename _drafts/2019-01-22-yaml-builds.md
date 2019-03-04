---
title: CI with Azure Pipelines YAML
image:
  feature: header/h16.svg
---
The last few weeks I've been experimenting with the new YAML build pipelines in *Azure DevOps*. There's been some gotchas, and the odd bit of frustration, but overall I'm definitely sold on using them and the benefits they bring. I thought I'd write up my experiences and thoughts here

<!--more-->

## Background
It doesn't hurt to go over some of the background here, as there's been product name changes and various other points it's worth clarifying

Build pipelines are a way of automating the build of your application, and carrying out CI (Continuous Integration) and they form a fundamental part of *Azure Pipelines*. These are nothing new, they've been in *Visual Studio Team Services (VSTS)* for a **long** time. When VSTS became *Azure DevOps* last year, the automated build & release features became badged as *Azure Pipelines*, however technically almost nothing changed.  
The difference between *Azure DevOps* and *Azure Pipelines* is almost a moot point (superset and subset of features), so for the rest of the article I'll just refer to *Azure Pipelines* to keep it simple

So what about these YAML builds? These give you a different way to define what you want your build to do. Previously you had to define your build job in the VSTS web portal user interface, it was basically one of those old school Microsoft, GUI only things.

YAML builds are done in well, YAML. A quick recap, [YAML is a *"human-readable data serialization language"*](https://en.wikipedia.org/wiki/YAML). YAML is easy to read, and write much like you would code (unlike XML and JSON, which are generated rather than hand crafted)


## Why ?
Having your build pipeline defined in a code/text file like YAML means it can live in your code repo, alongside your code. This is a huge advantage and in line with the ***Everything as Code*** principle many development teams aspire to.

Updates can be done through a regular git commit & push, and testing the pipeline can be triggered through a regular CI trigger, as the definition is now part of your codebase too


## How ?
You can use YAML builds a few ways, the standard path is to place a `azurepipelines.yml` file in the root of your git repo. When in *Azure Pipelines*, you add a new build pipeline, point it at your repo and it'll be automatically picked up and used. This is similar to other CI build systems like *Travis* and *CircleCI*

{% include img src="new.png" alt="Azure DevOps creating a new build pipeline" caption=true %}

If you're getting started and don't have a pipeline yet, then you can go through the same flow, pointing *Azure Pipelines* at your repo (hosted on *GitHub* or in *Azure Repos*) and it will detect what sort of project your code is and suggest a template or you can pick from the list, or start from an empty starter file

{% include img src="templates.png" alt="Some of the available templates" caption=true %}

## Containers 