const request = require('request');
const cheerio = require('cheerio');
const fs = require("fs-extra");
const { DownloaderHelper } = require("node-downloader-helper");
const zipper = require("zip-local");

const exiftool = require("node-exiftool");
const exiftoolBin = require("dist-exiftool");
const ep = new exiftool.ExiftoolProcess(exiftoolBin);

require('events').EventEmitter.defaultMaxListeners = 15;

let captionArray = [];
let fileArray = [];

const pullGalleryLGH = function pullGallery(URL, callbackID){
    request(URL, (error, response, html) => {
        if(!error && response.statusCode == 200) {
            captionArray = [];
            fileArray = [];
            const $ = cheerio.load(html);
            let str = $("script:not([src])")[1].children[0].data; //get second script tag contents
            let data = str.split("__gh__coreData.content=")[1]; //split the script at story data var delcaration
            data = data.split(';\n')[0]; //split off additional variables from script
            let gallery = JSON.parse(data); //put all data into gallery object
  
            fs.writeFile(`./scaped_JSON/gallery.json`, data, (err) => {  //write JSON to file, for dev purposes
                if (err) throw err;
                console.log("--- Data saved to local JSON ---");
              });
  
            let downloadPath = `./public/downloads/${gallery.type}_${gallery.id}`;  
            galleryID = gallery.id;
            callbackID(gallery.id);
            // let downloadsComplete = false;
  
  

            fs.mkdir(downloadPath, 0774, function(err) {
                if (err) {
                    if (err.code == "EEXIST") {
                        console.log("folder already existed");
                        gallery.items.forEach(element => {
                            captionArray.push(element.caption);
                            fileArray.push(`${element.count}.jpg`);
                            downloadFile(element.link.split("&")[0], downloadPath, element.count);
                        });
                    } else {
                        console.log(err);
                    }
                } else {
                    console.log("successfully created folder");
                    gallery.items.forEach(element => {
                        captionArray.push(element.caption);
                        fileArray.push(`${element.count}.jpg`);
                        // console.log(captionArray);
                        downloadFile(element.link.split("&")[0], downloadPath, element.count);
                    });
                }
            });
            



            successfullyDownloaded = 0;
            totalItems = gallery.items.length;
  

            // ep.on(exiftool.events.EXIT, () => {
            //     console.log(`EXIF exit event:`);
            //     zipper.zip(`./public/downloads/gallery_${gallery.id}`, function(error, zipped) {
            //         if (!error) {
            //             console.log(`starting zip of ${gallery.id}`);
            //           zipped.compress(); // compress before exporting
            //           zipped.save(`./public/downloads/${gallery.id}.zip`, function(error) {  // save the zipped file to disk
            //             console.log(`saving zip ${gallery.id}`);
            //             if (!error) {
            //               console.log("zipped successfully!");
            //             } else {
            //               console.log("some kind of zip error");
            //               console.log(error);
            //             }
            //           });
            //         } else {
            //             console.log(error);
            //         }
            //       });
            // });
        }
    });
  };


function downloadFile(downloadURL, dir, count) {
    const dl = new DownloaderHelper(downloadURL, dir, {
      fileName: fileName => count + ".jpg",
      override: true
    });
    dl.start();
    dl.on("end", downloadInfo => {
        console.log("Download Completed: ", downloadInfo.fileName);
        // fileArray.push(`${dir}/${downloadInfo.fileName}`);
        successfullyDownloaded ++;
        console.log(`successfully downloaded: ${successfullyDownloaded} so far`)
        if(successfullyDownloaded == totalItems) {
            console.log('All downloaded, starting EXIF writing');
            writeAllExif();
        };
    });
    dl.on("err", err => {
        console.log("Download Failed");
        reject(err);
    });
}     

function writeAllExif() {
    ep
    .open()
    // read and write metadata operations
    .then(() => {
        console.log(captionArray);
        console.log(`File Array: ${fileArray}`);
        captionArray.forEach((element, index) => {
            console.log(fileArray[index]);
            console.log(element);
            ep.writeMetadata(`public/downloads/gallery_708009994/${fileArray[index]}`, { "Caption-Abstract": element }, ['codedcharacterset=utf8','overwrite_original'])
        // ep.writeMetadata("public/downloads/gallery_708009994/1_PH-708009994.jpg", { "Caption-Abstract": "demo caption" }, ['codedcharacterset=utf8','overwrite_original'])
        })
    })    
    .then(console.log, console.error)
    .then(() => ep.close())
    .then(() => console.log('Closed exiftool'))
    .catch(console.error)
};

//     return new Promise((resolve, reject) => {
//       dl.on("end", downloadInfo => {
//         console.log("Download Completed: ", downloadInfo.fileName);
  
//         const metadata = {
//         //   Creator: author,
//           "Caption-Abstract": caption
//         };
  
//         const file = `${dir}/${downloadInfo.fileName}`;

//         ep.writeMetadata(file, metadata, ['codedcharacterset=utf8','overwrite_original'])    //   use codedcharacterset
//             // .then(console.log, console.error)
//             .then(successfullyDownloaded ++, console.log(successfullyDownloaded))
//             .catch(console.error);

//             if(successfullyDownloaded == totalItems) {
//                 ep.close();
//                 console.log('Closing EXIF tool')
//             };

//         resolve();
//       });
  
//       dl.on("err", err => {
//         console.log("Download Failed");
//         reject(err);
//       });

//     });
//   }  


  module.exports = pullGalleryLGH;