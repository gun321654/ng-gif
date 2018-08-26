import { Injectable } from '@angular/core';
import { Stream, parseGIF } from '../tools/gif'
import { promise } from 'protractor';


@Injectable({
  providedIn: 'root'
})
export class GifService {
  constructor() { }
  doParse(data) {
    let gifHead = {};
    let gifGCE = [];
    let gifImg = [];
    return new Promise((resolve, reject) => {
      let handler = {
        hdr: (data) => {
          gifHead = data
        },
        gce: (data) => {
          gifGCE.push(data);
        },
        img: (data) => {
          gifImg.push(data);
        },
        eof: (block) => {
          resolve(toImage(gifHead, gifImg, gifGCE))
        }
      };
      parseGIF(new Stream(data), handler);
    })
  }
}
const toImage = (gifHead, gifImg, gifGCE) => {
  console.log("gifHead", gifHead);
  console.log("gifImg", gifImg);
  console.log("gifGCE", gifGCE);
  let canvas = document.createElement("canvas");
  let frame = canvas.getContext('2d');
  canvas.height = gifHead.height;
  canvas.width = gifHead.width;
  const images = gifImg.map((item, i) => {
    var ct = gifGCE[i].lctFlag ? item.lct : gifHead.gct;
    var cData = frame.getImageData(item.leftPos, item.topPos, item.width, item.height);
    let transparency = gifGCE[i].transparencyGiven ? gifGCE[i].transparencyIndex : null;
    let disposalMethod = gifGCE[i].disposalMethod;
    let lastDisposalMethod = disposalMethod;
    item.pixels.forEach(function (pixel, i) {
      if (transparency !== pixel) {
        cData.data[i * 4 + 0] = ct[pixel][0];
        cData.data[i * 4 + 1] = ct[pixel][1];
        cData.data[i * 4 + 2] = ct[pixel][2];
        cData.data[i * 4 + 3] = 255;
      } else {
        if (lastDisposalMethod === 2 || lastDisposalMethod === 3) {
          cData.data[i * 4 + 3] = 0;
        } else {
        }
      }
    });
    frame.putImageData(cData, item.leftPos, item.topPos);
    let image = new Image();
    image.src = canvas.toDataURL("image/jpg");
    image.height = gifHead.height;
    image.width = gifHead.width;
    return image;
  });

  const delays = gifGCE.map((item, i) => {
    return item.delayTime
  })


  return { delays: delays, images: images, gifHead: gifHead }

}

