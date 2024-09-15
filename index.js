import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

const app = express();
const port = 4000;
const saltRound = 10;
env.config();

app.use(express.static('public'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
  },
})
);

app.use(passport.initialize());
app.use(passport.session());


// Database PostgresSQL
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

//GET All posts 
app.get("/posts", async(req, res) => {
  try {
    const result = await db.query("SELECT * FROM posts");
    const isUser = await db.query("SELECT * FROM userblog WHERE username = $1", [req.body.username]);
    if(isUser) {
      const response = result.rows;
      res.status(200).json(response);
    } else {
      res.json({message: "User not found"});
    }

  } catch (error) {
     console.log(error);
  }
});
//GET a specific post by id
app.get("/posts/:id", async(req, res) => {
  const id = parseInt(req.params.id);
  const foundPost = await db.query("SELECT * FROM posts WHERE id = $1", [id]);
  if( foundPost.rows.length > 0) {
    res.json(foundPost.rows);
  } else {
    res.json({message:`Posts with id: ${id} not found.`})
  }
});

//POST a new post
app.post("/posts", async (req, res) => {
  var date = new Date(),
  weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayOfWeek = weekday[date.getDay()],
  month = ["Janury", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  currentMonth = month[date.getMonth()],
  year = date.getFullYear();

  var currentDate = `${currentMonth} ${dayOfWeek}, ${year} `;
  const title = req.body.title;
  const content = req.body.content;

  try {
    const result = await db.query("SELECT * FROM userblog");
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const response = await db.query('INSERT INTO posts (title, content, author, date) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, content, user.name, currentDate]
      );
      res.json(response.rows);
    } else {
      res.json({message: "No user found."})
    }
  } catch (error) {
     res.json(error);
  }
});
//PUT a post when you want to update 
app.put("/posts/:id", async(req, res) => {
  const id = parseInt(req.params.id);
  const title = req.body.title;
  const content = req.body.content;
  try{
    const post = await db.query("SELECT * FROM posts WHERE id = $1", [id]);
    if (post.rows.length > 0) {      
        const update = await db.query("UPDATE posts SET title = $1, content = $2 WHERE id = $3 RETURNING *", [title, content , id]); 
        res.json(update.rows);
      } else {
        return res.status(404).json({ message: "Post not found" });
      }
  } catch (error){
    res.json(error);
  }

});
//DELETE a specific post by providing the post id.
app.delete("/posts/:id", async(req, res) => {
  const id = parseInt(req.params.id);
  const foundId = await db.query("SELECT * FROM posts WHERE id = $1", [id]);
  if(foundId.rows.length > 0) {
    await db.query('DELETE FROM posts WHERE id = $1', [id]);
    res.sendStatus(200);
  } else {
    res 
       .status(404)
       .json( {error: `Posts with id: ${id} not found.`});
  }
});

// GET REGISTER USERS
app.get('/users', async(req, res) => {
  try {
    const result = await db.query("SELECT * FROM userblog");
    if (result.rows.length > 0) {
      const response = result.rows;
      res.json(response);
    } else {
      res.json({message: "No user found."})
    }
  } catch (error) {
     res.json(error);
  }
});
// GET LOGIN USER 
app.get('/users/login', (req, res) => {
  if(req.login) {
    res.json({message: 'User is logged.'}); 
  } else {
    res.json({message:"User is not logged."})
  }
});

// POST A NEW USER
app.post("/users", async(req, res) => {

  const {name, username, password} = req.body;

  if (!name || !username || !password) {
    res.status(400);
    res.json({message:"Please add all fields"});
  };

    // check if user exists
  const userExists = await db.query("SELECT * FROM userblog WHERE username = $1",[username]);
    if (userExists.rows.length > 0) {
      res.status(400);
      res.json({message: "User already exists"});
    };
  
  // create crypt password
  const hashedPassword = await bcrypt.hash(password, saltRound);
  // create user
  const user = await db.query("INSERT INTO userblog (name, username, password) VALUES ($1, $2, $3) RETURNING *",
    [name, username, hashedPassword]);  

  if (user) {
    res.status(201).json(user.rows);
  } else {
    res.status(400);
    res.json({message: "Invalid user data"});
  }
});
// POST LOGIN USER
app.post('/users/login', async (req, res) => {
 
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    res.json({message:"Please add all fields"});
  }

  // Check for user email
  const userExist = await db.query("SELECT * FROM userblog WHERE username = $1",[username]);
  const user = userExist.rows[0];
  if (userExist.rows.length > 0 && (await bcrypt.compare(password, user.password))) {
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
    });
  } else {
    res.status(400);
    res.json({message: "Invalid credentials"});
  }
});

// POST LOGOUT USER
app.post('/users/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.json({message:'Logout successful.'});
    });
  });  

passport.use('local', new Strategy(async function verify(username, password, cb) {
  
  try {
      await db.query("SELECT * FROM userblog WHERE username = ($1)", [username], function(err, user) {
        if(err) { return cb(err); }
        if(user.rows.length > 0) { return cb(null, false, {message: 'Incorrect username or password'});
        } else {
          const store = user.rows[0];
          bcrypt.compare(password, store.password, (err, check) => {
            if (err) { return cb(err); }
            else if (check) { return cb(null, user); }
            else { return cb(null, false); }
          }); 
        }
      }); 
  } catch (err) {
    res.json({message: err});
  }
}));


passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
