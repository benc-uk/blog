---
title: CI with Azure Pipelines YAML
image:
  feature: header/h16.svg
---
The last few weeks I've been experimenting with the new YAML build pipelines in Azure DevOps. There's been some gotchas, and the odd bit of frustration, but overall I'm definitely sold on using them and the benefits they bring. I thought I'd write up my experiences and thoughts here

<!--more-->

## Background
It doesn't hurt to go over some of the background here, as there's been product name changes and various other points it's worth clarifying

Build pipelines are a way of automating the build of your application, and carrying out CI (Continuous Integration ) 