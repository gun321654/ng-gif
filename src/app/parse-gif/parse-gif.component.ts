import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GifService } from '../services/gif.service';

import { BehaviorSubject, Observable, of, from, Subject, Subscription, timer, interval } from 'rxjs';
import { map, filter, scan, delay, concatAll, concat } from 'rxjs/operators';

//concatAll  Observable 转 Iterable 

from([1000, 5000, 2000, 6000]).pipe(
  map(x => timer(x)),
  concatAll()
).subscribe(console.log);
// timer(1000).subscribe(console.log)


@Component({
  selector: 'app-parse-gif',
  templateUrl: './parse-gif.component.html',
  styleUrls: ['./parse-gif.component.css']
})
// 
export class ParseGifComponent implements OnInit {
  private data: string = "";
  private time: number = null;
  private play: boolean = false;
  private run: any = null;


  @ViewChild("show") private showImg: ElementRef;
  @ViewChild("edit") private editImg: ElementRef;
  public constructor(private elementRef: ElementRef, private GifService: GifService, ) {


  }
  ngOnInit() {
    console.log(this.showImg.nativeElement);
    console.log(this.editImg.nativeElement);


    // this.imageObj.src = "../../assets/1.jpg";
    let imageObj = new Image();
    imageObj.onload = () => {
      this.configImg = of({
        x: 0,
        y: 0,
        image: imageObj,
        width: 106,
        height: 118,
      })
    }
    imageObj.src = "../../assets/1.jpg";
  }
  playSwitch() {
    this.play = !this.play;

  }
  public configStage = new BehaviorSubject({
    width: 200,
    height: 200
  });
  public configCircle: Observable<any> = of({
    x: 100,
    y: 100,
    radius: 70,
    fill: 'red',
    stroke: 'black',
    strokeWidth: 4
  });

  public configImg: Observable<any>;


  public handleClick(event: any) {
    console.log('Hello Circle', event);
  }

  changeFile(e) {
    const file = e.target.files[0];
    const fr = new FileReader();
    fr.readAsBinaryString(file);  //2
    fr.onloadend = (e: any) => {
      //atob 编码   btoa 解码
      //gif  
      this.data = "data:image/gif;base64," + window.btoa(e.target.result);
      // console.log(this.data);
      this.GifService.doParse(e.target.result).then(this.toImg)
    }
  }

  toImg = (imgData) => {
    console.log(imgData);


  }
  transfromCancas = (img, gce) => {

  }
}

const showImage = (img, canvas) => {
  let frame = canvas.getContext('2d');
  let i = 0;
  let delay = 0;
  const doFrame = () => {
    setTimeout(() => {
      delay = img.gifGCE[i].delayTime * 10 || 100;
      console.log("delay", delay);

      var ct = img.gifGCE[i].lctFlag ? img.gifImg[i].lct : img.gifHead.gct;
      var cData = frame.getImageData(img.gifImg[i].leftPos, img.gifImg[i].topPos, img.gifImg[i].width, img.gifImg[i].height);
      let transparency = img.gifGCE[i].transparencyGiven ? img.gifGCE[i].transparencyIndex : null;
      let disposalMethod = img.gifGCE[i].disposalMethod;
      let lastDisposalMethod = disposalMethod;
      img.gifImg[i].pixels.forEach(function (pixel, i) {
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
      frame.putImageData(cData, img.gifImg[i].leftPos, img.gifImg[i].topPos);
      i++;
      if (img.gifGCE[i]) { doFrame(); }
      // else {
      //   i = 0;
      //   doFrame();
      // }
    }, delay);
  }
  doFrame();
}


class Demo {
  private emitter: Subject<any>;
  private handler: Subscription;
  constructor() {
    this.emitter = new Subject<any>();
    this.handler = this.emitter.subscribe(this.executor);
  }

  executor(v: any) {
    console.log(v);
  }
}




// const pow = (p: number) =>
//   (source: Observable<number>) => source.pipe(
//     map(n => n * p)
//   )

// from([1, 2, 3, 200, 300]).pipe(
//   filter(x => x > 100),
//   pow(2)
// ).subscribe(x => console.log(x))