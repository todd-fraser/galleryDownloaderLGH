// const request = require('request');
// const cheerio = require('cheerio');
// const fs = require("fs-extra");
// const { DownloaderHelper } = require("node-downloader-helper");
// const zipper = require("zip-local");

// const exiftool = require("node-exiftool");
// const exiftoolBin = require("dist-exiftool");
// const ep = new exiftool.ExiftoolProcess(exiftoolBin);

const pullGalleryLGH = require('./pullGalleryLGH');

let successfullyDownloaded;
let totalItems;
let galleryID;

pullGalleryLGH(`https://www.fayobserver.com/photogallery/NC/20180629/NEWS/629009999/PH/1`, (data) => {
  console.log(`callback fired - Gallery ID = ${data}`);
});
// pullGalleryLGH(`https://www.fayobserver.com/photogallery/NC/20190620/NEWS/620009998/PH/1`);



