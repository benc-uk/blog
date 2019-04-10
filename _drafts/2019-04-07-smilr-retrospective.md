---
title: Smilr Retrospective
tags: [nodejs, microservices, kubernetes]
image:
  feature: header/h19.svg
---
This is a post I've been meaning to write for about a year and a half, where I wanted to talk about a project called "Smilr". Given that the project is now stable and at a "complete" state I wanted to reflect back on what was done, how it evolved, and how I've used the project over the past 18 months in various guises, and continue to do so

<!--more-->

# Introduction
Smilr is a *"Microservices reference application showcasing a range of technologies, platforms & methodologies"*, which in a nutshell means it's a demonstrator. It was designed to showcase microservices design patterns & deployment architectures. 

I don't intend this post to be an in-depth technical guide to Smilr. All of that is covered in painstaking detail on the GitHub site. Which is here: 

<a href="https://smilr.benco.io/" class="btn btn-success" target="_blank">Smilr Project Site [smilr.benco.io] <i class="fas fa-external-link"></i></a>

Saying that, it still probably helps if I do cover some of the basics here

Smilr consists of a front end single page application (SPA), two lightweight services, a supporting database and back end data enrichment functions.

What the app does is very simple, it allows users to provide feedback on events or sessions they have attended via a simple web & mobile interface. The feedback consists of a rating (scored 1-5) and supporting comments. Feedback rating is done via a coloured face ranging from happy to sad, very much like the "How did we do today?" kiosks you can find in airports and hospitals 

<img src="https://smilr.benco.io/etc/screen.png" style="height:300px; text-align:center">

- The user interface is written in Vue.js and is completely de-coupled from the back end, which it communicates with via REST. The UI is fully responsive and will work on on both web and mobile.
- The two microservices are both written in Node.js using the Express framework. These have been containerized so can easily be deployed & run as containers
- The database is a NoSQL document store holding JSON, provided by MongoDB and/or *Azure Cosmos DB*

Putting it all together it looks something like this

![architecture picture](https://smilr.benco.io/etc/architecture.png)

# Why?

# Data Changes

# Front End Changes

# Other Implementations 

# How I Use It Today

## DevOps

## Kubernetes

# What would I do differently