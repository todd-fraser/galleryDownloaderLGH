const express = require("express");
const app = express();
const bodyParser = require("body-parser");

require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const pullGalleryLGH = require("./pullGalleryLGH");

let successfullyDownloaded;
let totalItems;
let galleryID = 0; 

app.get("/", function (req, res) {
  res.render("scrape");
});

app.post("/scrape", function (req, res) {
  galleryURL = req.body.galleryURL;
  console.log(`Request for /scrape and gallery URL - ${galleryURL}`);
  pullGalleryLGH(galleryURL, (data) => {
    console.log(`callback fired - Gallery ID = ${data}`);
  });
});

app.listen(process.env.PORT, function() { 
  console.log('Server listening on port ' + process.env.PORT); 
});
