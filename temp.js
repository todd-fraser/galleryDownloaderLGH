const exiftool = require("node-exiftool");
const exiftoolBin = require("dist-exiftool");
const ep = new exiftool.ExiftoolProcess(exiftoolBin);

let successfullyDownloaded = 1;
let totalItems = 0;

const data = {
    all: '',
    comment: 'Exiftool rules!', // has to come after `all` in order not to be removed
    'Keywords+': [ 'keywordA', 'keywordB' ],
  }


 
ep
  .open()
  .then(() => ep.writeMetadata('public/downloads/gallery_708009994/1_PH-708009994.jpg', {
    all: '', // remove existing tags
    comment: 'Exiftool rules!',
    'Keywords+': [ 'keywordA', 'keywordB' ],
  }, ['overwrite_original']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)



//   .writeMetadata("/gallery_708009994/1_PH-708009994.jpg", { "Caption-Abstract": "demo caption" }, ['codedcharacterset=utf8','overwrite_original'])
