---
title: Build your first ASP.NET Core web app
tags: dotnet-core
---

This is a very simple tutorial and 101 guide on getting an ASP.NET Core web application up and running. We're starting from first principles, and we won't get very deep into the vast world of ASP.NET, so you won't find any details on topics like MVC, Routing or Entity Frameworks here. Our goal is to get a very simple web app & server running on your Windows/Linux/OSX machine

> **Note.** This is a re-write of a older post, as the .NET SDK and tooling have changed significantly upon final release in March 2017, making the old post more or less obsolete

<!--more-->

### Install &amp; setup .NET Core

We'll need a couple of things before we start. Firstly the .NET Core SDK. Don't worry 'Core' is very lightweight compared to the older "Full" .NET so no huge frameworks to install, but we still need some tools to work with. Download what you need from [https://www.microsoft.com/net/download/core#/sdk](https://www.microsoft.com/net/download/core#/sdk) and follow the few steps there to get it set-up (which varies a little between Windows, Linux and OSX).

Now if you open a CMD / terminal and run **`dotnet` **you should see something like this

```bash
$ dotnet
Microsoft .NET Core Shared Framework Host

  Version  : 1.1.0
  Build    : 928f77c4bc3f49d892459992fb6e1d5542cb5e86

Usage: dotnet [common-options] [[options] path-to-application]

Common Options:
  --help                           Display .NET Core Shared Framework Host help.
  --version                        Display .NET Core Shared Framework Host version.

Options:
  --fx-version            Version of the installed Shared Framework to use to run the application.
  --additionalprobingpath    Path containing probing policy and assemblies to probe for.

Path to Application:
  The path to a .NET Core managed application, dll or exe file to execute.

If you are debugging the Shared Framework Host, set 'COREHOST_TRACE' to '1' in your environment.

To get started on developing applications for .NET Core, install the SDK from:
  http://go.microsoft.com/fwlink/?LinkID=798306&amp;clcid=0x409
```

### Project Setup &amp; First Run

OK baby steps... Now let's create a new .NET project

```bash
mkdir webapp
cd webapp
dotnet new web
```

Now we've got a minimal skeleton project to work with, namely **Program.cs**, **Startup.cs** files and **webapp.csproj**. It's not much, but hey it's a start.

If we want to take a look at our **Program.cs** file we can use any text editor you like (well, except _Emacs,_ you... weirdo) I would suggest [Visual Studio Code](https://code.visualstudio.com) (aka VS Code). "Errg! Visual Studio?! Won't that be a 9GB download, clog my machine up with junk, and cost £1,000s?". Nope, [VS Code](https://code.visualstudio.com) is a great lightweight code editor and IDE for Windows, Linux and OSX. It's more akin to 'Atom' or 'Sublime Text' than its name would suggest. It's not just for C# and .NET, has a tonne of plugins and language support and fantastic git integration (far better than Atom's IMO).

Opening either of the **.cs** in VS Code for the first time you'll probably be prompted to install some plugins for .NET and C#, these aren't essential but I recommended to click yes. VS Code treats folders as projects, so you are best off opening the 'webapp' folder on your filesystem rather than individual files. Tip, in your terminal window you can just type  `code .`  to open VS Code with the current folder as your project.

Let's try running our app from our terminal

```
dotnet run
```

Whoops! This will result in a slightly terrifying screen of red error text, and something about a missing "project.assets.json". Remember I said .NET Core was lightweight? well part of that is it only pulls in the components and libraries it really needs. This is handled by the **.csproj** file declaring dependencies and those dependencies being pulled down from the online NuGet repository as required. Don't worry too much at this point, the **`dotnet restore`** command does everything you need, so....

```
dotnet restore
 Restoring packages for C:\Dev\webapp\webapp.csproj...
 Generating MSBuild file C:\Dev\webapp\obj\webapp.csproj.nuget.g.props.
 Generating MSBuild file C:\Dev\webapp\obj\webapp.csproj.nuget.g.targets.
 Writing lock file to disk. Path: C:\Dev\webapp\obj\project.assets.json
 Restore completed in 2.35 sec for C:\Dev\webapp\webapp.csproj.

 NuGet Config files used:
 C:\Users\demobob\AppData\Roaming\NuGet\NuGet.Config
 C:\Program Files (x86)\NuGet\Config\Microsoft.VisualStudio.Offline.config

 Feeds used:
 https://api.nuget.org/v3/index.json
 C:\Program Files (x86)\Microsoft SDKs\NuGetPackages\
```

```
dotnet run
Hosting environment: Production
Content root path: c:\Dev\webapp\bin\Debug\netcoreapp1.0
Now listening on: http://localhost:5000
Application started. Press Ctrl+C to shut down.
```

And you'll see something like this in your browser:

{% include img src="screen.png" alt="The least exciting web page you'll ever see" caption=true %}

Ok great, it's not earth shattering but we've got a web application &amp; web server running in about 50 lines of code. And none of the normal overhead you'd expect with ASP. No Windows Server, no IIS, no .NET Frameworks, no W3SVC or web.config XML file hell. Pretty cool IMO

You might be thinking, _"This seems a bit basic, surely .NET Core can let me start with a more functional web app?"_. Yes it can, back when we ran `dotnet new`, we could have run `dotnet new mvc` and we've have got a fully functional MVC web app using bootstrap, with all the stuff you'd expect like; routing, template based views, etc etc.

### Listen for external requests

Wait don't leave! There's one little thing we need to do, which will be required later when we want to run our app in a Docker container and access it. The web host used by our app is [Kestrel](https://github.com/aspnet/KestrelHttpServer) which is a minimal HTTP server builtin to .NET Core. By default it only binds to the loopback adapter (i.e. localhost), which will be a problem later when we want to access the app from the outside. It's simple to fix, just add `.UseUrls("http://*:5000")` to your **Program.cs** as shown here:

```csharp
public class Program
    {
        public static void Main(string[] args)
        {
            var host = new WebHostBuilder()
                .UseKestrel()
                .UseUrls("http://*:5000")
                .UseStartup<Startup>()
                .Build();

            host.Run();
        }
    }
```

### Next
[Click here for part 2](/docker-machine-and-azure)