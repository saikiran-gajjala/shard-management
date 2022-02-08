# ShardsManager
This project has been developed to make things easier for the MongoDB developer/admin to manage shards, chunks in a MongoDB sharded cluster.

# Problem
It has been observed that when a collection was sharded in MongoDB Sharded Cluster, it by default created only one chunk. 
When a huge volume of data was ingested into the Sharded collection, the chunk size grew and eventually the MongoDB auto split the chunks and 
in addition, the MongoDB auto balancer moved the chunks from one shard to the other shards in the cluster. Due to this the CPU of the cluster went up and
also there was inconsitency with mongo shell commands during the balancing. 

# Solution
So to overcome the above problem, pre-splitting of chunks in an empty sharded collection can help. Also MongoDB recommends to follow the same steps. Refer the [link](https://docs.mongodb.com/manual/tutorial/create-chunks-in-sharded-cluster/#create-chunks-in-a-sharded-cluster)

# Tool Description
The tool has been developed make the sharding/chunk splitting process easier by using the User Interface rather than executing the commands.
The tool has the following features
1. Displays if the cluster is Sharded or Standalone
2. Displays the list of databases, collections and their indexes.
3. Enables Sharding for the database
4. Enables Sharding for the collection
5. Displays the shard-key and shard status if the database and the collection are already sharded.
6. Displays the existing chunks in a collection
7. Enables/Disables the MongoDB balancer. This is used for the Pre-splitting of chunks.
8. Presplitting of chunks in an empty collection covering basic scenarios.

# UI
The User Interface is developed in Angular and the steps to run the project is explained in https://github.com/Saikirann73/hackathon/edit/main/ShardsManager.UI/README.md

# API
The API layer is developed in .Net Core. The API project can be run directly using the visual studio.
Note: The connection string of the MongoDB is currently set as a configuration setting in 'appsettings.json'.

# Points considered during the development
1. Data Access Layers are stateless and the instantiation will happen only once during the application startup.
2. No POCO/Model classes used to access the MongoDB SDK methods. The POCO/Models used only for converting from BSON Documents and pass to UI.
3. Loosely coupled Data Access Layers by using the abstraction.
4. Ensured that all the Mongo Queries used use indexes.
