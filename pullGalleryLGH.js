const request = require('request');
const cheerio = require('cheerio');
const fs = require("fs-extra");
const { DownloaderHelper } = require("node-downloader-helper");
const zipper = require("zip-local");

const exiftool = require("node-exiftool");
const exiftoolBin = require("dist-exiftool");
const ep = new exiftool.ExiftoolProcess(exiftoolBin);

const pullGalleryLGH = function pullGallery(URL, callback){
    request(URL, (error, response, html) => {
        if(!error && response.statusCode == 200) {
            ep.open();  // launch instance of exif tool
            const $ = cheerio.load(html);
            let str = $("script:not([src])")[1].children[0].data; //get second script tag contents
            let data = str.split("__gh__coreData.content=")[1]; //split the script at story data var delcaration
            data = data.split(';\n')[0]; //split off additional variables from script
            let gallery = JSON.parse(data); //put all data into gallery object
  
            fs.writeFile(`./scaped_JSON/gallery.json`, data, (err) => {  //write JSON to file, for dev purposes
                if (err) throw err;
                console.log("--- Data saved to local JSON ---");
              });
  
            let downloadPath = `./downloads/${gallery.type}_${gallery.id}`;  
            galleryID = gallery.id;
            callback(gallery.id);
            // let downloadsComplete = false;
  
  
            createDownloadDir(downloadPath, 0744, function(err) {
                if (err) {
                    console.log("Folder creation error");
                    console.log(err);
                } // handle folder creation error
                else {
                    console.log("gallery folder exists");
                } // we're all good
            });
  
            successfullyDownloaded = 0;
            totalItems = gallery.items.length;
  
            gallery.items.forEach(element => {
                // console.log(element.link.split("&")[0]); //splits off cropping or other params
                // console.log(element.count);
                downloadFile(element.link.split("&")[0], downloadPath, element.caption, element.count);
                // console.log(`caption: ${element.caption}`);
                // console.log(`link: ${element.link}`);
            });
            ep.on(exiftool.events.EXIT, () => {
                zipper.zip(`./downloads/gallery_${gallery.id}`, function(error, zipped) {
                    if (!error) {
                        console.log("starting zip");
                      zipped.compress(); // compress before exporting
                      zipped.save(`./downloads/${gallery.id}.zip`, function(error) {  // save the zipped file to disk
                        console.log("saving zip");
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
            });
        }
    });
  };




  function createDownloadDir(path, mask, cb) {
    if (typeof mask == "function") {
        // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
        if (err.code == "EEXIST") cb(null);
        // ignore the error if the folder already exists
        else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });

}



function downloadFile(downloadURL, dir, caption, count) {
    const dl = new DownloaderHelper(downloadURL, dir, {
      fileName: fileName => count + "_" + fileName,
      override: true
    });
    dl.start();
  
    return new Promise((resolve, reject) => {
      dl.on("end", downloadInfo => {
        console.log("Download Completed: ", downloadInfo.fileName);
  
        const metadata = {
        //   Creator: author,
          "Caption-Abstract": caption
        };
  
        const file = `${dir}/${downloadInfo.fileName}`;

        ep.writeMetadata(file, metadata, ['codedcharacterset=utf8','overwrite_original'])    //   use codedcharacterset
            // .then(console.log, console.error)
            .then(successfullyDownloaded ++, console.log(successfullyDownloaded))
            .catch(console.error);

            if(successfullyDownloaded == totalItems) {
                ep.close();
                console.log('Closing EXIF tool')
            };

        resolve();
      });
  
      dl.on("err", err => {
        console.log("Download Failed");
        reject(err);
      });

    });
  }  


  module.exports = pullGalleryLGH;