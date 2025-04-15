const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');

require("dotenv").config();
//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cust1.baig3hx.mongodb.net/?retryWrites=true&w=majority&appName=cust1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    const productCollection = client.db('ronTechUser').collection('products');

    app.get('/products', async (req,res)=>{
        const query = {};
        const result = await productCollection.find(query).toArray();
        // console.log(result);
        res.send(result)
    })
    
//clicking or find by category
app.get('/products/:category', async (req, res) => {
    const category = req.params.category;
    const query = { category: (category) };
    const result = await productCollection.find(query).toArray();
    res.send(result)
  });

//   //single mobile with unic id
  app.get('/product/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await productCollection.findOne(query);
    res.send(result);
    
  })

  
  


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('ron is sitting')
})

app.listen(port, ()=>{
 console.log(`ron tech server is sitting on ${port}`);
})