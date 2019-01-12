---
title: Running your ASP.NET Core app in Docker
tags:
  - azure
  - docker
  - dotnet-core
categories: Docker
date: 2016-11-14 14:07:48
icon: fas fa-file-code
---

Final part of a [series](/guide-dotnetcore-docker-azure/) covering some of the fundamentals of ASP.NET Core, Docker and Azure. This part is fairly dependent on what we covered in [part 1](/dotcore-web-app-101/) and [part 2](/docker-machine-and-azure/). However if you want to skip ahead you can use my pre-created ASP.NET Core demo app on Github; [https://github.com/benc-uk/dotnet-demoapp](https://github.com/benc-uk/dotnet-demoapp) which you can clone and use to skip what was covered in part 1.
However we're going to need a running machine with Docker engine on so skipping part 2 isn't really an option

<!--more-->

### Publishing Your Application

As you'd expect .NET Core provides a means to publish your application so it can be run without your source code. For console apps this will be some form of executable like a .exe, and for ASP.NET web applications this will be a .dll and bundle of required libraries & static content (e.g. css, images, js etc). Hang on? Did I just say .dll? I thought we were going to run this on Docker on a Linux host? DLLs are a Windows thing, right? Yeah but don't worry, .NET Core uses the dll files regardless of the target OS, even on Linux, it seems like a dumb choice of file extension to me but there we go.

To do this we run `dotnet publish` as follows:
```
dotnet publish -c Debug -o ./pubout
```

This should publish your app into the '_pubout_' sub-directory. Inside the '_pubout_' directory will be a .dll called the same as your current project working directory, if you are following on from part one this is likely to be _"webapp.dll"_ if you cloned my git project, it will be _"demo-webapp.dll"_. If we like we can now copy the contents of the '_pubout_' directory to any machine that has .NET Core installed and run it with
```
cd pubout
dotnet webapp.dll
```
Which will start the app running under the built-in .NET Core Kestrel webserver, just like we did with `dotnet run` in part 1. That's all well and good, but we want to do something different...

### Intro to building Docker images

OK what about Docker and containers? We want to get our app into what Docker calls an image, from the image you can start a running container like we did in part 2\. When we did `docker run nginx`, Docker knew to pull down the standard nginx image from the online repository (called Dockerhub). However we'll be creating our own image all neatly packaged up with .NET Core and our application. The best part - it'll be totally standalone so anyone can run it without faffing about installing .NET Core.

This is all done with Dockerfiles and the `docker build` command. For me Dockerfiles are where I really had that first "ah-ha" moment with Docker and started to see what all the fuss was about, let's take a look at a Dockerfile:
```dockerfile
# Super simple (and pointless) example of a Dockerfile
FROM ubuntu:latest
MAINTAINER Ben Coleman "ben@example.com"
WORKDIR /stuff

RUN apt-get update

ADD hello.sh script/hello.sh

ENTRYPOINT bash /stuff/script/hello.sh
```
This is a totally pointless example that simply runs a shell script, but it introduces many of the core elements of a Dockerfile. Key things we can do:

-  **FROM** - Use a base image as our starting point, all our changes are applied on top of that base. In this case we use the basic ubuntu image with the tag "latest" which will be pulled down from Dockerhub for us.
- **MAINTAINER** - Just documentation and info
- **WORKDIR** - Sets the working directory "inside", for the image build process, directory will be created for you. Note. this is not a directory on the machine where you run **docker build**
- **RUN** - You can run commands as part of the build process, to prep the image and do other things, installing software packages is a common example. The `apt-get update` in this case serves no purpose but it proves a point.
- **ADD or COPY** - Inject your own files into the image on top of the base. So this will copy the hello.sh file from the "outside" where I'm running `docker build` into the image. The file must exist, and the operation will honor the WORKDIR so in this case our file ends up in `/stuff/script/`
- **ENTRYPOINT** - This is what gets run when a container is run from this image, so it's pretty much the most important part. Here we just call bash to exec our script.

This is just the tip of the iceberg. Rather than digress into a full blog post on Dockerfiles and **docker build**, I suggest you take a look at the [main Dockerfile reference docs](https://docs.docker.com/engine/reference/builder/)

### Building our ASP.NET Core app Docker image

Microsoft supply base Docker images with .NET Core for us to easily layer our application on top of. These are hosted as you'd expect over on Dockerhub, and there's several variants to be aware of, which caught me out:

- General .NET Core - [https://hub.docker.com/r/microsoft/dotnet/](https://hub.docker.com/r/microsoft/dotnet/)
- Optimized for ASP.NET Core - [https://hub.docker.com/r/microsoft/aspnetcore/](https://hub.docker.com/r/microsoft/aspnetcore/)
- Includes build tools for ASP.NET Core - [https://hub.docker.com/r/microsoft/aspnetcore-build/](https://hub.docker.com/r/microsoft/aspnetcore-build/)

There's also tags we can supply to specify the version we we'll stick to using using **latest**
If you're really interested in what these images contain you can poke about with the source Dockerfiles over on Github [dotnet/dotnet-docker](https://github.com/dotnet/dotnet-docker) and [aspnet/aspnet-docker ](https://github.com/aspnet/aspnet-docker)

We have two approaches from here, one where we carry out the `dotnet publish` separate from the Docker image build, then copy the published contents into the Docker image (using COPY in our Dockerfile), an example Dockerfile doing this would be
```dockerfile
FROM microsoft/dotnet:latest
COPY pubout/ /approot/
EXPOSE 5000/tcp
ENTRYPOINT dotnet /approot/webapp.dll
```
Note. This Dockerfile introduces a new term, EXPOSE, which doesn't do anything really, but serves as a hint as to what ports your app will be listening on.

Another slightly better approach I think is to run the .NET publish and build as part of the build of the docker image. This approach is cleaner from a CI/CD workflow perspective and the one we'll take from here. Note, we are using the **microsoft/aspnetcore-build** base image, this image includes all the dependent build tools you might need Which is another nice thing about Docker, you don't need to clutter up your build servers with lots of tools and maintain them. The Dockerfile to do the full build &amp; publish, looks like:
```dockerfile
FROM microsoft/aspnetcore-build:latest
WORKDIR /myapp

# Copy project.json and run restore 
COPY project.json .
RUN dotnet restore

# Copy and everything else, then publish/build
COPY . .
RUN dotnet publish -c Release -o out

# Export port 5000 on Kestrel webserver
EXPOSE 5000

# Run the ASP.NET Core app
ENTRYPOINT ["dotnet", "out/myapp.dll"] 
```

Create a file called **Dockerfile** (with no extension and uppercase D, it can not have any other name. Look I don't make the rules) in the root of your ASP.NET Core project and copy/paste the above into it.

Before we run the build we need to be connected to our remote Docker host, if you haven't already follow the steps from [part 2](/docker-machine-and-azure/) where we use docker-machine to point our local system at a remote running Docker host. A good test is doing a quick `docker ps` if you don't get an error, you're good to go

To carry out the build we'd go to where our **Dockerfile** resides, i.e. the root of our project and run the `docker build` command. I was actually quite surprised to see this command work with a remote machine, after all - the code and other files we are injecting into the image reside _locally_, but there's some magic where all the gubbins we need is uploaded to the remote machine and the build done there. Very clever. So the command is:
```
docker build . -t myappimage
```
Note we don't specify the name or path of the `Dockerfile`, just the directory where it resides (in this case '.'). The **-t** part effectively names our image, the full naming convention is _`{repository}/{name}:{tag}`_, but you don't really need to worry about all that until you want to push your image to a registry like Dockerhub.

That might take a while the first time, but don't worry Docker is pretty smart and caches filesystem layers in images. This means subsequent builds will be much quicker and only bring in deltas, which is another reason Docker is so popular for CI/CD. You might also see some red warnings, don't worry

A quick `docker images` command will verify things, and should look much like this:
```
docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
myappimage          latest              2afe4259f39a        2 minutes ago       166.4 MB
microsoft/dotnet    latest              f753707788c5        3 days ago          537.5 MB
```

### Running our app and conclusion

We're nearly at the end of our journey, let's run our app as a container. We'll run it detached and expose port 5000 out of the container so we can connect to it. Hopefully you remembered to tweak **Program.cs** and add the `.UseUrls("http://*:5000")` as discussed in part 1. OK go...
```
docker run -d -p 5000:5000 myappimage
```
You'll get back a long string which is the container id, don't worry about that now. If all has gone well you can connect to the container via the public IP of your docker host. Obviously you're running your docker host in Azure (where else?!) so you can get the public IP of the VM from the Azure portal. While you are there, you will also need to edit the network security group and add a rule to allow port 5000 through the firewall, how to do this was covered in [part 2](/docker-machine-and-azure/#firewall)

Open your browser to **http://{docker-host-publicip}:5000** and all going well you should see your app.

{% asset_img screen.png Golly gosh! %}

Not super exciting is it? Well I agree it's not terribly visually pleasing, but we should take a moment recap what we've achieved:

- Created a portable .NET Core web application in about 30 lines of code
- Deployed a Docker host running in Azure from a single command
- Connected to our Docker instance to remotely control &amp; manage it
- Built a custom Docker image from our application, bundled with the .NET Core runtime
- Deployed and run our little web app inside a container, on a host in the cloud

These posts have turned out a little longer than I envisioned, but we've covered a lot of ground. Never the less we've barely scratched the surface of what we can achieve with Docker .NET Core and Azure.