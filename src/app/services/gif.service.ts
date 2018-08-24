import { Injectable } from '@angular/core';
import { Stream, parseGIF } from '../tools/gif'
import { promise } from 'protractor';


@Injectable({
  providedIn: 'root'
})
export class GifService {
  handler: any = {};
  gifHead: any = {};
  gifImg: Array<any> = [];
  gifGCE: Array<any> = [];

  constructor() { }
  doParse(data) {
    // console.log(data);
    return new Promise((resolve, reject) => {
      this.handler = {
        hdr: (data) => {
          this.gifHead = data
        },
        gce: (data) => {
          this.gifGCE.push(data);
        },
        img: (data) => {
          this.gifImg.push(data);
        },
        eof: (block) => {
          resolve({ gifHead: this.gifHead, gifImg: this.gifImg, gifGCE: this.gifGCE })
        }
      };
      parseGIF(new Stream(data), this.handler);


    })
  }

}
