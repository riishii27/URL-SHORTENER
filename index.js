const express = require("express");
const app = express();
const PORT = 8001;
const path = require("path");
const cookieParser = require("cookie-parser")
const {restrictToLoggedInUserOnly , checkAuth} = require("./middleware/auth")

const { connectToMongoDB } = require("./connect");
const URL = require("./model/url");

const urlRoute = require("./routes/url");
const staticRouter = require("./routes/staticRouter");
const userRoute = require('./routes/user')

connectToMongoDB("mongodb://127.0.0.1:27017/short-url").then(
  console.log("MongoDB Connected!")
);

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())


app.use("/url",restrictToLoggedInUserOnly, urlRoute);
app.use('/user',userRoute)
app.use("/",checkAuth, staticRouter);


app.get("/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate(
    {
      shortId,
    },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    },
    { new: true }
  );
  if (!entry) {
    return res.status(404).send("Short URL not found");
  }
  res.redirect(entry.redirectURL);
});

app.listen(PORT, () => {
  console.log("Server Started at PORT:8001!");
});
