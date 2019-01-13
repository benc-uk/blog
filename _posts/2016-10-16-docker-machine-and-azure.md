---
title: Docker Machine and Azure
tags: [azure, docker, docker-machine]
image:
  color: "#000"
  opacity: 0.5
  feature: header/h15.svg
---

Part 2 of a basic series covering ASP.NET, Docker and Azure. This part is independent of what we did with ASP.NET in [part 1](/dotcore-web-app-101), and serves as a guide on getting Docker running in Azure. I'm not going to cover the basics of Docker or an introduction into why containerization is a Good Thing™ there's a million other posts & articles out there on those topics

<!--more-->

### Docker on Azure

As you might imagine we have a wide range of options when it comes to using Docker on the Azure platform, the main approaches are:

*   **Docker compute instances**. e.g. [Docker on Ubuntu Server](https://azure.microsoft.com/en-us/marketplace/partners/canonicalandmsopentech/dockeronubuntuserver1404lts/) available in the Azure Marketplace. This boils down to a VM with Docker Engine pre-installed. A bit simple but great for experimenting with what Docker can provide.
*   **[Docker VM Extension](https://azure.microsoft.com/en-gb/documentation/articles/virtual-machines-linux-dockerextension/)**. This is a neat way of deploying Docker onto any Linux VM you create in Azure. This works particularly well when you are dealing with ARM templates letting you automate the whole process in an IaaC approach.
*   **[Azure Container Service](https://azure.microsoft.com/en-us/services/container-service/) (ACS)**. This allows you to deploy a managed Docker cluster in Azure, using a choice of DC/OS or Docker Swarm to provide orchestration and clustering. This is great for production workloads, but a little overkill for what we need.
*   **Windows Server 2016**. What? Docker on Windows? Well yes we've had Docker support on Windows for a while but it's been a bit of a cludge using Hyper-V and a hidden VM running behind the scenes. Yuk. However Windows Server 2016 brings [real, native Docker container support to Windows](https://msdn.microsoft.com/virtualization/windowscontainers/containers_welcome).
*   **Azure Docker Machine Driver**. Docker Machine is a great tool for managing, deploying and controlling remote Docker hosts. It's a lightweight, command line based system which we'll focus on in the rest of this post

### Docker Toolbox & Client Tools

Docker Machine is part of the Docker client side tooling, so we don't really need the whole engine/demon shebang. To install the client binaries on Windows and OSX you need something called **Docker Toolbox** - [https://www.docker.com/products/docker-toolbox](https://www.docker.com/products/docker-toolbox)

Currently on Linux there's no client only package so you are probably best off installing the whole lot - [https://docs.docker.com/engine/installation/linux/](https://docs.docker.com/engine/installation/linux/)
Weirdly this doesn't install Docker Machine, but that's a simple one line command to grab the binaries [https://docs.docker.com/machine/install-machine/](https://docs.docker.com/machine/install-machine/)

All installed done? We've got two new commands at our disposal `docker` and `docker-machine`

In summary `docker` is your main command for working directly with Docker, it lets you control what a Docker host does - start/stop containers, pull down or remove images, build new images, manage the network, etc. In most Docker tutorials and guides the docker command is communicating with the local machine (i.e. client and host are on the same box). In our case we're going to use `docker` commands to connect a remote host over the standard Docker API (HTTP REST traffic over port 2375 &amp; 2376 in case you were wondering)
Where-as `docker-machine` is a means to remotely build & provision the Docker hosts saving you a lot of manual work installing the Docker engine on hosts/VMs.

{% include img src="diagram.png" alt="How Docker client interacts with remote Docker host in Azure" %}

Docker Machine works through via what are called drivers, there are currently 14 drivers for platforms such as VMware vSphere, AWS, OpenStack, Hyper-V and of course Azure. There's also a generic driver which works over SSH to any Linux server or VM (actually all drivers use SSH to talk tothe target hosts). I'm going to focus on the Azure Driver so that means...

### Some Azure Pre-reqs

From here out I'm going to assume you have an  Azure subscription and baseline understanding of Azure, at least on the compute side. If you don't have a subscription - there are a few ways gain access to an amount of free Azure credits, the most obvious one being the [Visual Studio Dev Essentials](https://www.visualstudio.com/dev-essentials/) program.  

The other point probably worth noting is the Docker Machine Azure driver uses the new Azure Resource Manager APIs (and thus you'll need to use the new Azure portal too if you want to see what it is doing), if you're still using the old Classic Portal and older APIs, it's time to get out of the dark ages grandad.
I'm not going to get into the basics of Azure in this post, so I'll go ahead and assume you know what a Resource Group, VM, image, subscription VNET, Network Security Group etc all are.

### Build a Docker host with Azure Driver

Ok that's the preamble out of the way - now we're ready to actually create some Docker hosts.
The driver does everything we need; building the VM, networking it up, deploying Docker onto the VM and securing everything with certs and keys

Running `docker-machine create` command will kick the whole process off
```bash
docker-machine create --driver azure 
--azure-subscription-id dd492a69-6424-4846-b10e-02fc37b93977 
--azure-resource-group "DockerMachines" 
--azure-image "canonical:UbuntuServer:16.04.0-LTS:latest" 
--azure-location "West Europe" 
docker01
```

A note on some of the parameters we used:
* **`--driver`** — No prizes for guessing what this means, we tell it to use the Azure driver
* **`--azure-subscription-id`** — This is your Azure subscription id you want to deploy into. This is required. Don't worry that id up there isn't my real one
* **`--azure-resource-group`** — The name of the resource group everything will be put into, if it doesn't exist it will be created
* **`--azure-image`** — This tells the driver which base OS image to use for the VM, I'm using Ubuntu 16.04 LTS, which in the next release of Docker Machine will be default
* **`--azure-location`** — Which region do we want to deploy to, here I'm using Western Europe. If you don't supply this the default region is US West

The last parameter is the name of the Docker host, this is important; it becomes both the name of the VM resource in Azure, the hostname of the VM and also it's the name you will refer to it via in `docker-machine`, I picked "docker01".  

Some other common parameters you might want to specify are things like VM size, the VNet you want to use, storage account details, additional firewall ports to open etc. The full list of options is pretty long & detailed [here on the Docker page for the Azure driver](https://docs.docker.com/machine/drivers/azure/#/options)

The first time you run this command it will prompt you to sign in, with the steps you need to carry out to authenticate with Azure. Just follow the instructions, login to Azure with your browser and enter the supplied code when prompted
```
(docker01) Microsoft Azure: To sign in, use a web browser to open the 
page https://aka.ms/devicelogin. Enter the code FOOBAR1234 to authenticate.
```

Once you're logged in you're going to see a whole bunch of output from the `docker-machine create` command as it runs. It's pretty obvious what it is doing and the process from start to finish should take approx 5 minutes
```
Running pre-create checks...
(docker01) Completed machine pre-create checks.
Creating machine...
(docker01) Querying existing resource group.  name="DockerMachines"
(docker01) Creating resource group.  name="DockerMachines" location="West Europe"
(docker01) Configuring availability set.  name="docker-machine"
(docker01) Configuring network security group.  name="docker01-firewall" location="West Europe"
(docker01) Querying if virtual network already exists.  location="West Europe" name="docker-machine-vnet"
(docker01) Configuring subnet.  name="docker-machine" vnet="docker-machine-vnet" cidr="192.168.0.0/16"
(docker01) Creating public IP address.  name="docker01-ip" static=false
(docker01) Creating network interface.  name="docker01-nic"
(docker01) Creating storage account.  name="vhdsz6ajmh46mtejmlgw5e3b" location="West Europe"
(docker01) Creating virtual machine.  location="West Europe" size="Standard_A2" username="docker-user" osImage="canonical:UbuntuServer:16.04.0-LTS:latest" name="docker01"
Waiting for machine to be running, this may take a few minutes...
Detecting operating system of created instance...
Waiting for SSH to be available...
Detecting the provisioner...
Provisioning with ubuntu(systemd)...
Installing Docker...
Copying certs to the local machine directory...
Copying certs to the remote machine...
Setting Docker configuration on the remote daemon...
Checking connection to Docker...
Docker is up and running!
To see how to connect your Docker Client to the Docker Engine running on this virtual machine, run: docker-machine env docker01
```

Hopefully that finished OK, now run `docker-machine ls` to check what has been done, you should see something like this:
```
NAME       ACTIVE   DRIVER   STATE     URL                        SWARM   DOCKER    ERRORS
docker01   -        azure    Running   tcp://104.45.226.18:2376           v1.12.1
```

This means that Docker Machine knows about our new host, what its IP address is, and if its current state. We don't actually need this information right now but it makes for a good sanity check.

If we go over to the Azure portal we can take a look at what has been created, just find the resource group with the same name as you specified earlier. It's mostly standard stuff you'll see in there and you won't need to change anything at this point, but later on we'll modify the rules on the network security group (which will be named "{machine_name}-firewall").

{% include img src="azure.png" %}

<a name="docker-machine-env"></a>

### Using Docker & running containers

OK we're at a point where we want to do something with our new Docker host, and for this we will use the `docker` command. If you try this command at this point it will fail, as by default it will try to connect to the Docker engine on your local machine, which presumably doesn't exist.

There are a number of ways to point the `docker` command at a remote host, the main ones being via the **`DOCKER_HOST`** environment variable and the -H parameter on the command line. However this alone isn't enough, as Docker Machine deployed a secured instance of Docker, so we also need a bunch of TLS certs in order to connect securely. The create command placed all these certs on our local filesystem for us, but we don't need to fiddle with them now. Thankfully Docker takes all the hard work out of this for us with the `docker-machine env` command, as follows:

```bash
$ docker-machine env docker01
SET DOCKER_TLS_VERIFY=1
SET DOCKER_HOST=tcp://104.45.226.18:2376
SET DOCKER_CERT_PATH=C:\Users\ben\.docker\machine\machines\docker01
SET DOCKER_MACHINE_NAME=docker01
REM Run this command to configure your shell:
REM     @FOR /f "tokens=*" %i IN ('docker-machine env docker01') DO @%i
```

Simply copy and paste the last line  
`@FOR /f "tokens=*" %i IN ('docker-machine env docker01') DO @%i` into your command terminal or shell. On OSX and Linux the command will probably look like `eval "$(docker-machine env docker01)"`. This will set all the required environmental variables to connect to the named Docker host in one simple step.

Now we're all set,  try a quick `docker ps`  and make sure you don't get any error, and let's do what every Docker tutorial in the world starts with, running the "Hello World" container

```bash
$ docker run hello-world

Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
c04b14da8d14: Pull complete
Digest: sha256:0256e8a36e2070f7bf2d0b0763dbabdd67798512411de4cdcf9431a1feb60fd9
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1\. The Docker client contacted the Docker daemon.
 2\. The Docker daemon pulled the "hello-world" image from the Docker Hub.
 3\. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4\. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker Hub account:
 https://hub.docker.com

For more examples and ideas, visit:
 https://docs.docker.com/engine/userguide/
```

Not terribly exciting, but hey we've just run something in a Docker container so that makes us one of the cool kids.

### Running services in Docker containers

For a slightly more interesting example let's try running a container with service plus some networking aspect, something like the Ngnix webserver is a good example.

```bash
$ docker run -d -p 80:80 nginx
Unable to find image 'nginx:latest' locally
latest: Pulling from library/nginx
6a5a5368e0c2: Pull complete
20a0fbbae148: Pull complete
2fbd37c8684b: Pull complete
Digest: sha256:e40499ca855c9edfb212e1c3ee1a6ba8b2d873a294d897b4840d49f94d20487c
Status: Downloaded newer image for nginx:latest
a37f7703f6ae7e6904302f2f805c7d76e4c9fc06f8085a1154cab0fbd6311016
```

That should have pulled down the nginx image and started a container running the Nginx webserver. The **`-d`** means run detached which is how you'll run 99% of your containers. The **`-p 80:80`** exports ports used by the container to the host, so port 80 on our Docker host will map through to port 80 on this container. Statically exposing ports like this is fine for a quick 'n dirty test, but obviously isn't a good idea when you want to run lots of containers on your host. Docker offers lots of networking options and hundreds of other parameters on the docker run command, best refer to the docs [https://docs.docker.com/engine/reference/run/](https://docs.docker.com/engine/reference/run/) if you want to know more.

A quick `docker ps` will sanity check that it is running
```bash
$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                         NAMES
a24fa850d08c        nginx               "nginx -g 'daemon off"   4 seconds ago       Up 3 seconds        0.0.0.0:80-&gt;80/tcp, 443/tcp   hungry_wescoff
```

<a name="firewall"></a>
In order to connect to the webserver in the container, we need the public IP address of our Azure host, and also open up port 80 on the network security group. Getting the IP is easy, go into the resource group that was created eariler and click on the public IP resource which in my case is called _"docker01-ip"_ and you'll see the IP address  
{% include img src="fw1.png" alt="Find your public IP" caption=true %}

Then click on the network security group, e.g. _"docker01-firewall"_  
{% include img src="fw2.png" alt="Network Security Group in Azure portal" caption=true %}

Click 'Inbound security rules', then click the 'Add' button, then configure the rule to allow HTTP / port 80 traffic from any source. The priority isn't important  
{% include img src="fw3.png" alt="Inbound rule definition" caption=true %}

OK...  
Point your browser at the public IP address you grabbed earlier, and the amazing exciting Nginx default home page should appear. Wow!  
{% include img src="nginx.png" alt="The default Nginx homepage" caption=true %}

### Summary

This is enough of a walk-through of using Docker for now, if you like you can run `docker-machine rm docker01` and this will remove &amp; clean up the resources it had deployed previously including the VM which will stop you inuring costs on your subscription.
There's _*plenty*_ of other Docker tutorials and getting started guides out there, I wanted to cover the basics and mainly focus on the Docker Machine + Azure side of things.

Now this has been a lengthy post, but to summarize we can build a Docker host in Azure connect to it and start a container such as a Nginx webserver with just three commands, which is pretty damn cool

```bash
docker-machine create docker01
@FOR /f "tokens=*" %i IN ('docker-machine env docker01') DO @%i
docker run -d -p 80:80 nginx
```

### Next
[Click here for part 3](/netcore-in-docker/)

---

### Appendix

I wanted a small footnote on where Docker Machine stores it's configuration and certificates. The key place to look is:  
`C:\Users\{user}\.docker\machine\machines`  
or on OSX/Linux it'll be here:  
`\home\{user}\.docker\machine\machines`

In there you find one directory per docker host, e.g. "docker01" and in that folder a bunch of files. The various .pem files are the certs needed to connect to the Docker engine on the remote host, if you used the `docker-machine env` command you don't really need to worry about these.  
The other files of note are `id_rsa` and `id_rsa.pub` which are the private/public keypair used for SSH access to the Docker host. If you want to login to the host you will need to use the private key file (id_rsa), password authentication is disabled. The username by default is **docker-user** but can be changed when you run the `docker-machine create` command

> Note. If you ever stop and start the Docker host VM in Azure it will be assigned a different public IP address, as that's how Azure works. This will result in a bunch of errors when you try to connect and issue `docker` commands due to he TLS certs being generated for a different IP. The simple fix is to run `docker-machine regenerate-certs` which will create new signed certs and replace the old ones