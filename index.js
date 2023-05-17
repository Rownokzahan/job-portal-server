const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());

// const uri = "mongodb+srv://<username>:<password>@cluster0.jxgrj34.mongodb.net/?retryWrites=true&w=majority";
const uri = "mongodb://localhost:27017"

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const jobs = client.db("jobsDB").collection("jobs");

        //Compound Indexing
        const indexKeys = { title: 1, category: 1 };
        const indexOptions = { name: "titleCategory" };
        const result = await jobs.createIndex(indexKeys, indexOptions);


        // Endpoint for retrieving all jobs
        app.get('/jobs', async (req, res) => {
            const result = await jobs.find().toArray();
            return res.send(result);
        });

        // Endpoint for filtering jobs by type (status)
        app.get('/jobs/:type', async (req, res) => {
            const type = req.params.type;
            if (type === "remote" || type === "offline") {
                const result = await jobs.find({ status: type }).toArray();
                return res.send(result);
            }

            return res.status(400).send('Invalid job type');
        });

        // Endpoint for searching jobs by text
        app.get('/jobs/search/:text', async (req, res) => {
            const text = req.params.text;
            const result = await jobs.find({
                $or: [
                    { title: { $regex: text, $options: 'i' } }, // Case-insensitive regex match
                    { category: { $regex: text, $options: 'i' } }
                ]
            }).toArray();
            return res.send(result);
        });

        app.post('/jobs', async (req, res) => {
            const newJob = req.body;
            newJob.created_at = new Date();
            const result = await jobs.insertOne(newJob);
            res.send(result);
        })

        app.put('/jobs', async (req, res) => {
            const { _id, ...body } = req.body;
            const updatedJob = {
                $set: {
                    ...body
                }
            }
            const result = await jobs.updateOne({ _id: new ObjectId(_id) }, updatedJob);
            res.send(result);
        })

        app.delete('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const result = await jobs.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        })

        app.get('/my-jobs/:email', async (req, res) => {
            const email = req.params.email;
            // const email = "rownokzahan9@gmail.com"
            const result = await jobs.find({ postedBy: email }).toArray();
            return res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send({ message: "Server is running" });
})

app.listen(port, () => {
    console.log(`Server is running on port : ${port}`);
})