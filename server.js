import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import env from "dotenv";

const app = express();
const port = 3000;
const API_URL = "http://localhost:4000";
env.config();

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route to render the main page without login
app.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts`);
   
    res.render("index.ejs", { posts: response.data });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});
// Route to render the main page if is's logged
app.get("/islogged", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts`);
   
    res.render("islogged.ejs", { posts: response.data });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});
// Route to render the main page for admin only
app.get("/admin", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts`);
   
    res.render("admin.ejs", { posts: response.data });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// Route to render the edit page
app.get("/new", (req, res) => {
  res.render("modify.ejs");
});

// Route to render the login/register page for users
app.get('/login', (req, res) => {
  res.render('login.ejs');
});
app.get('/register', (req, res) => {
  res.render('register.ejs');
});
app.get('/logout', (req, res) => {
  res.render('login.ejs');
})
// Create a new post
app.post("/api/posts", async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/posts`, req.body);  
    res.redirect("/islogged");
  } catch (error) {
    res.status(500).json({ message: "Error creating post" });
  }
});

// Update a post
app.post("/api/posts/:id", async (req, res) => {

  try {
    const response = await axios.put(`${API_URL}/posts/${req.params.id}`,req.body);
    res.redirect("/admin");
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
});

// Delete a post
app.get("/api/posts/delete/:id", async (req, res) => {

  try {
    const result = await axios.delete(`${API_URL}/posts/${req.params.id}`);
    res.redirect("/admin");
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
});

// Create a new user
app.post("/api/users", async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/users`, req.body);
    res.redirect("/login");
  } catch (error) {
    res.status(500).json({ message: "Error creating user." });
  }
});
// Post login user
app.post('/api/users/login', async(req, res) => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, req.body);
    if ( req.body.username === process.env.ADMIN_EMAIL && req.body.password === process.env.ADMIN_PASSWORD) {
      res.redirect("/admin");
    } else {
      res.redirect("/islogged");
    };
  } catch (error) {
    res.status(500).json({ message: "Error login user. Please register first" });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
