const express = require('express');
const app = express();
const cors = require('cors');
require("dotenv").config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors({ origin: '*' }));
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

// middleware function for jwt verify 
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.TOKEN_SECRET, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: 'Forbidden' });
    }
    req.decoded = decoded;
    next();
  })
}


const run = async () => {
  try {
    const productCollection = client.db('ronTechUser').collection('products');
    const usersCollection = client.db('ronTechUser').collection('users');
    const cartsCollection = client.db('ronTechUser').collection('carts');
    const ordersCollection = client.db('ronTechUser').collection("orders");
    const wishlistCollection = client.db('ronTechUser').collection("wishlists");

    // Verify Admin Middleware 
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      console.log(decodedEmail);
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== 'admin') {
        return res.status(403).send({ message: 'Forbidden Access' });
      };

      next();
    };


    // Verify Seller Middleware 
    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      // console.log(decodedEmail);
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== 'seller') {
        return res.status(403).send({ message: 'Forbidden Access' });
      };

      next();
    };

    // Finding Admin 
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === 'admin' });
    })


    // Finding Sellers 
    app.get('/users/seller/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === 'seller' });
    })


    // Finding Verified 
    app.get('/users/verify/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isVerified: user?.verify === true });
    })





    app.get('/products', async (req, res) => {
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

    // Get jwt token 
    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user && user.email) {
        const token = jwt.sign({ email }, process.env.TOKEN_SECRET, { expiresIn: '7d' });
        return res.send({ accessToken: token })
      }
      // console.log(user);
      res.status(403).send({ accessToken: '' });
    })

    //new user kaj...........

    // Creating user in dB 
    app.get("/buyers", async (req, res) => {
      const buyers = await ordersCollection.find({}).toArray();
      res.send(buyers)
    })

    // app.post('/users', async (req, res) => {
    //   const user = req.body;
    //   const result = await usersCollection.insertOne(user);
    //   res.send(result);
    // })
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const role = req.query.role;
      let query = { role: role }
      if (query.role === "admin") {
        const users = await usersCollection.find({}).toArray();
        res.send(users)
      }
    })

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email
      const user = await usersCollection.findOne({ email: email });
      res.send(user)
    })

    app.post("/users", async (req, res) => {
      const userData = req.body;
      const user = await usersCollection.insertOne(userData);
      res.send(user)
    })

    app.put("/users/sellers/:id", async (req, res) => {
      // update seller status in users collection
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedSeller = { $set: { isVerified: true } }
      const result = usersCollection.updateOne(filter, updatedSeller, option);
      console.log(result)
      res.send(result)
    })
    app.delete("/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await usersCollection.deleteOne(filter);
      res.send(result)
    })

    // Blue tick handling
    app.put('/users', async (req, res) => {
      const id = req.query.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verified: true
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc, options)
      res.send(result)

    })
    app.delete('/users', async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result);
    })
    //new user...........






    // Getting Sellers for admin 
    // app.get('/users/sellers', async (req, res) => {
    //   const query = { role: 'seller' };
    //   const users = await usersCollection.find(query).toArray();
    //   res.send(users);
    // })

    // Getting Buyers for admin 
    // app.get('/users/buyers', async (req, res) => {
    //   const query = { role: 'buyer' };
    //   const users = await usersCollection.find(query).toArray();
    //   res.send(users);
    // })

    // // Blue tick handling
    // app.put('/users/:id', async (req, res) => {
    //   const id = req.params.id;
    //   // console.log(id);
    //   const filter = { _id: new ObjectId(id) };
    //   const options = { upsert: true };
    //   const updatedDoc = {
    //     $set: {
    //       verify: true
    //     }
    //   };
    //   const result = await usersCollection.updateOne(filter, updatedDoc, options);
    //   res.send(result);
    // })

    // Deleting Sellers 
    // app.delete('/users/sellers/:id', async (req, res) => {
    //   const id = req.params.id;
    //   console.log(id);
    //   const filter = { _id: ObjectId(id) };
    //   const result = await usersCollection.deleteOne(filter);
    //   res.send(result);
    // })

    // Deleting Buyers 
    // app.delete('/users/buyers/:id', async (req, res) => {
    //   const id = req.params.id;
    //   console.log(id);
    //   const filter = { _id: new ObjectId(id) };
    //   const result = await usersCollection.deleteOne(filter);
    //   res.send(result);
    // })

    app.put("/users/sellers/:id", async (req, res) => {
      // update seller status in users collection
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedSeller = { $set: { isVerified: true } }
      const result = usersCollection.updateOne(filter, updatedSeller, option);
      res.send(result)

    })

    app.put("/products/sellers", async (req, res) => {
      const result = await productCollection.updateMany({ isVerified: false }, { $set: { isVerified: true } })
      res.send(result)
    })





    // post  cartItem
    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await cartsCollection.insertOne(cartItem);
      res.send(result);
      console.log(result)
    });

    // carts collection
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
      // console.log(result)
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
      // console.log(result)
    })




    //add new product in usedProductCollection
    app.post('/myProduct', async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      // console.log(result)
      res.send(result)
    })
    app.get('/myProduct', async (req, res) => {
      const products = await productCollection.find().toArray();
      res.send(products);
    })
    //single mobile with unic id
    app.get('/myProduct/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    })


    //  find the  product delete

    app.delete('/myProduct/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await productCollection.deleteOne(query)
      // console.log(result);
      res.send(result)
    })

    //  edit product 


    //  edit product 

    app.patch("/myProduct/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await productCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.get("/myOrders", async (req, res) => {
      const email = req.query.email;
      const orders = await ordersCollection.find({ email: email }).toArray();
      res.send(orders)
    })

    app.get("/orders", async (req, res) => {
      const orders = await ordersCollection.find({}).toArray()
      res.send(orders)
    })
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order)
    })

    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result)
    })

    app.put("/orders/:id", async (req, res) => {
      const paidOrder = req.body
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true }
      const updateOrder = {
        $set: {
          paid: true,
          transactionId: paidOrder.transactionId,
          oldId: paidOrder.id
        }
      }

      const result = await ordersCollection.updateOne(filter, updateOrder, option);
      res.send(result)
    })

    // Deleting order 
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const result = await ordersCollection.deleteOne(filter);
      res.send(result);
    })
    app.get("/wishlist", async (req, res) => {
      const products = await wishlistCollection.find({}).toArray();
      res.send(products)
    })
    app.post("/wishlist", async (req, res) => {
      const product = req.body;
      const result = await wishlistCollection.insertOne(product);
      res.send(result)
    })




    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('ron is sitting')
})

app.listen(port, () => {
  console.log(`ron tech server is sitting on ${port}`);
})