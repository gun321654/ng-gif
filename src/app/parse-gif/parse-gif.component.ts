import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GifService } from '../services/gif.service';
import { BehaviorSubject, Observable, of, from, Subject, Subscription, timer, interval, combineLatest } from 'rxjs';
import { map, filter, scan, delay, concatAll, concat, zip, startWith, throttleTime, take, switchAll, switchMap } from 'rxjs/operators';
import { KonvaComponent } from 'ng2-konva'
//concatAll  Observable 转 Iterable 
// timer(1000).subscribe(console.log)
@Component({
  selector: 'app-parse-gif',
  templateUrl: './parse-gif.component.html',
  styleUrls: ['./parse-gif.component.css']
})
export class ParseGifComponent implements OnInit {
  private images: Array<HTMLImageElement> = [];
  private delays: Array<number> = [];
  private gct: Array<string> = [];
  // private control: number = 0;

  public configShowStage = new BehaviorSubject({});
  public configEditStage = new BehaviorSubject({});
  public configShow = new BehaviorSubject({});
  public configEdit = new BehaviorSubject({});

  // @ViewChild("control") private control: ElementRef;
  @ViewChild("show") private show: KonvaComponent;
  // @ViewChild("edit") private editImg: ElementRef;

  private time: number = null;
  private play: boolean = false;
  private run: any = null;

  public constructor(private elementRef: ElementRef, private GifService: GifService, ) {

  }
  ngOnInit() {
    // console.log(this.showImg.nativeElement);
    // console.log(this.editImg.nativeElement);
  }


  changeControl(e) {
    // console.log(e);
    const image = this.images[e];

    this.configEdit.next({
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
      fillPatternImage: image
    });

    setTimeout(() => {
      const imgData = this.show.getStage().toCanvas().getContext("2d").getImageData(0, 0, image.width, image.height).data;
      console.log("imgData", imgData);
      console.time();
      var result = [];
      for (var i = 0; i < imgData.length; i += 4) {
        // if(imgData[i+4]===0){console.log("透明")}
        result.push(colorRGB2Hex2(imgData.slice(i, i + 3)));
      }
      console.log(result);
      result.forEach(item => {
        let repeat = this.gct.findIndex(arritem => item === arritem);
        if (repeat === -1) {
          this.gct.push(item);
        }
      });
      console.log(this.gct);
      console.timeEnd();
    }, 0);

  }
  // "../../assets/1.jpg";
  changeFile(e) {
    const file = e.target.files[0];
    const fr = new FileReader();
    fr.readAsBinaryString(file);  //2
    fr.onloadend = (e: any) => {
      //atob 编码   btoa 解码
      // this.data = "data:image/gif;base64," + window.btoa(e.target.result);
      // console.log(this.data);
      console.log("file input", e);
      this.GifService.doParse(e.target.result)
        .then((data: { delays: Array<number>, images: Array<HTMLImageElement>, gifHead: any }) => {
          this.delays = data.delays;
          this.images = data.images;

          const { width, height } = data.gifHead;
          this.configShowStage.next({
            width: width,
            height: height
          });
          this.configEditStage.next({
            width: width,
            height: height
          });
          this.changeControl(0);

          let delays = data.delays;
          let images = data.images;
          const time = from(delays).pipe(
            startWith(0),
            map(x => timer(x === 0 ? 100 : x * 10)),
            concatAll()
          );
          let clear = from(images).pipe(
            zip(time, data1 => data1)
          );
          let run = clear.subscribe({
            next: (image: HTMLImageElement) => {
              this.configShow.next({
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
                fillPatternImage: image
              });
            },
            error: (err) => { console.log('Error: ' + err); },
            complete: () => { console.log('complete'); }
          });
        })
    }
  }
}


class Demo {
  private emitter: Subject<any>;
  private handler: Subscription;
  constructor() {
    this.emitter = new Subject<any>();
    this.handler = this.emitter.subscribe(this.executor);
    const asd = new Subject<any>();
    const qwe = asd.subscribe();
    const zxc = qwe.unsubscribe();


  }

  executor(v: any) {
    console.log(v);
  }
}



function colorRGB2Hex(color) {
  var hex = ((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16);
  return hex;
}
function colorRGB2Hex2(color) {
  var hex = 1000000000 + (color[0] * 1000000) + color[1] * 1000 + color[2];
  return hex;
}







// const data$ = from([3000, 5000, 2000])
//   .pipe(
//     map(x => timer(x)),
//     startWith('a'),
//     concatAll(),
// );
// const control$ = new Subject();

// const main$ = combineLatest(
//   data$,
//   control$,
// );


// const handler = main$.subscribe(v => console.log(v));

// control$.next({ pause: false });

// // 某个时间
// setTimeout(() => {
//   control$.next({ pause: true });
// }, 5000);


// const pow = (p: number) =>
//   (source: Observable<number>) => source.pipe(
//     map(n => n * p)
//   )

// from([1, 2, 3, 200, 300]).pipe(
//   filter(x => x > 100),
//   pow(2)
// ).subscribe(x => console.log(x))