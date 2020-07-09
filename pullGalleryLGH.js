const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const { DownloaderHelper } = require("node-downloader-helper");
const zipper = require("zip-local");

const exiftool = require("node-exiftool");
const exiftoolBin = require("dist-exiftool");
const ep = new exiftool.ExiftoolProcess(exiftoolBin);

require("events").EventEmitter.defaultMaxListeners = 15;

let captionArray = [];
let fileArray = [];

const pullGalleryLGH = function pullGallery(URL, callback) {
  request(URL, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      captionArray = [];
      fileArray = [];
      successfullyDownloaded = 0;

      const $ = cheerio.load(html);
      let str = $("script:not([src])")[1].children[0].data; //get second script tag contents
      let data = str.split("__gh__coreData.content=")[1]; //split the script at story data var delcaration
      data = data.split(";\n")[0]; //split off additional variables from script
      let gallery = JSON.parse(data); //put all data into gallery object

      // fs.writeFile(`./scaped_JSON/gallery.json`, data, (err) => {  //write JSON to file, for dev purposes
      //     if (err) throw err;
      //     console.log("--- Data saved to local JSON ---");
      //   });

      let downloadPath = `./public/downloads/${gallery.type}_${gallery.id}`;
      galleryID = gallery.id;
      callback(gallery);
      totalItems = gallery.items.length;

      fs.mkdir(downloadPath, 0774, function (err) {
        if (err) {
          if (err.code == "EEXIST") {
            console.log("folder already existed");
            gallery.items.forEach((element) => {
              captionArray.push(element.caption);
              fileArray.push(`${element.count}.jpg`);
              downloadFile(
                element.link.split("&")[0],
                downloadPath,
                element.count
              );
            });
          } else {
            console.log(err);
          }
        } else {
          console.log("successfully created folder");
          gallery.items.forEach((element) => {
            captionArray.push(element.caption);
            fileArray.push(`${element.count}.jpg`);
            // console.log(captionArray);
            downloadFile(
              element.link.split("&")[0],
              downloadPath,
              element.count
            );
          });
        }
      });
    }
  });
};

function downloadFile(downloadURL, dir, count) {
  const dl = new DownloaderHelper(downloadURL, dir, {
    fileName: (fileName) => count + ".jpg",
    override: true,
  });
  dl.start();
  dl.on("end", (downloadInfo) => {
    console.log("Download Completed: ", downloadInfo.fileName);
    successfullyDownloaded++;
    // console.log(`successfully downloaded: ${successfullyDownloaded} so far`)
    if (successfullyDownloaded == totalItems) {
      console.log("All downloaded, starting EXIF writing");
      writeAllExif();
    }
  });
  dl.on("err", (err) => {
    console.log("Download Failed");
    reject(err);
  });
}

function writeAllExif() {
  ep.open()
    // read and write metadata operations
    .then(() => {
      captionArray.forEach((element, index) => {
        ep.writeMetadata(
          `public/downloads/gallery_${galleryID}/${fileArray[index]}`,
          { "Caption-Abstract": element },
          ["codedcharacterset=utf8", "overwrite_original"]
        );
      });
    })
    .then(console.log, console.error)
    .then(() => ep.close())
    .then(() => console.log("Closed exiftool"))
    .then(() => zipFolder())
    .catch(console.error);
}

function zipFolder() {
  console.log(`zip Folder function triggered`);
  zipper.zip(`./public/downloads/gallery_${galleryID}`, function (
    error,
    zipped
  ) {
    if (!error) {
      console.log(`starting zip of ${galleryID}`);
      zipped.compress(); // compress before exporting
      zipped.save(`./public/downloads/${galleryID}.zip`, function (error) {
        // save the zipped file to disk
        console.log(`saving zip ${galleryID}`);
        if (!error) {
          console.log("zipped successfully!");
        } else {
          console.log("some kind of zip error");
          console.log(error);
        }
      });
    } else {
      console.log(error);
    }
  });
}


module.exports = pullGalleryLGH;
