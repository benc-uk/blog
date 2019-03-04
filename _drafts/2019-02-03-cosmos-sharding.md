---
title: Squeezing & Sharding Cosmos DB
tags: [azure, nosql, cosmos]
image:
  feature: header/h12.svg
---
Recently I've been exploring the cost optimizations that are possible in Cosmos DB, and tripped over some interesting gotchas and side behaviors that I thought were blog worthy. This is mostly various problems I bounced off, but I'm sure I'm not the only that will to go through such a journey

Azure Cosmos DB is a great service with some huge features (global scale, low latency, replication, multi-model, multi API, etc). As a PaaS NoSQL offering it's naturally attractive for smaller projects too, however the snag quickly becomes the price

<!--more-->

For large scale enterprise/global apps the price is justified, but when working on a demo or prototype it can be more painful to use. 

A couple of concepts and terms before we move on. Cosmos DB is sized & priced on 'RU/s', which is "Request Units per second", I'll steal a quote from the docs to explain this one:
> You can think of RU/s as the currency for throughput. RU/s is a rate-based currency, which abstracts the system resources such as CPU, IOPS, and memory that are required to perform the database operations supported by Azure Cosmos DB

The other thing I'll be talking about is Cosmos DB *databases* and *collections*, a *database* is pretty self explanatory. Under a *database* you create one or more *collections*. A *collection* is basically like a table in a traditional relational database system. 

Originally Cosmos DB only allowed allocating your RU/s at a collection level, with a minimum of 400 RU/s per collection. It wasn't uncommon for projects have hundreds or even thousands of collections in a database, especially for those migrating from MongoDB. As a result the costs could really stack up

More recently RU/s can now be allocated at the database level, and have Cosmos DB share those RU/s across all collections in it. This comes with some conditions which are [covered in the docs](https://docs.microsoft.com/en-us/azure/cosmos-db/set-throughput), there's also some other "side effects" which I'll go into.

# Sharding Surprise
I have a Cosmos DB account (running in MongoDB mode) used for my [Smilr project](https://smilr.benco.io). As I leave it running in one of my personal Azure subscriptions, but only use it for demos I wanted to see how I could squeeze the costs to a minimum and really pinch those pennies

I only have three collections so rather than pay for 1200 RU/s (three collections at 400 RU/s each) I could try to fit them into a 400 RU/s database. So I created the new database with the magic (and easy to miss) "Provision throughput" checkbox
{% include img src="db.png" %}

Great I thought, point my app at the new database, import my backed up data - job done. However I started to hit some problems. I was using the MongoDB API and with MongoDB, collections are dynamically created the first time you insert something into them. Basically you never need to run "CREATE TABLE blah", they just pop into life the first time your code needs them.

I fired up the data API part of my Smilr app pointing at the new database and saw a bunch of errors
```
MongoError: Shared throughput collection should have a partition key
```
Yikes! I was hoping this would "just work"

After some head scratching, I checked the Azure portal to try to create the collections manually, there I noticed that something called a "Shard key" was a required property 
{% include img src="collection.png" %}

I was already familiar with the concept of "sharded" or partitioned data storage schemes from playing with Azure Tables, Service Fabric and DocumentDB. This is a **huge topic** which I don't really want to get into here, needless to say it's something you don't get for free, it requires some planning. 

I had to pick some properties in my data which could sensibly divide and split up my data, this was the easy part, I had sensible partition/shard keys I could use. After creating my collections manually in the portal (rather than letting my code auto create them) and setting the shard key properties I had picked. Bingo! No more errors when I started my data API, time to import my data backups

# I Got The No RUs Blues
Time to import my existing data, which was *tiny* (less than 600 documents in all) but I didn't want to lose it. I used `mongoexport` to backup my data, so I used `mongoimport` to reimport it. I kicked off the command and was confronted with a wall of errors :( the main one I spotted was 
```
Message: {"Errors":["Request rate is large"]
```
Accompanied with a HTTP 429 error - I was being throttled and rate limited. Well it turns out that 400 RU/s isn't a lot, 400 operations per section to be precise. The `mongoimport` was busting this limit with ease. 

Simple solution - scale up my throughput on my database to 2000 RU/s (that was a guess) and re-run. The import sailed through no problem, but I couldn't scale back to 400 RU/s! At least not from the portal, the smallest I could go back to was 800 RU/s I'm actually not sure if this is just a bug, but at this point I was determined to try to keep my database as small and cheap as possible. 
I tried again, blew everything away recreated the DB & collections and wrote a little Node.js import script with a delay 

# Update / delete

Supplying keys in my API controllers

# Functions 

Leases collection