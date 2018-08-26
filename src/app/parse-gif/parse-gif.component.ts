import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GifService } from '../services/gif.service';
import { BehaviorSubject, Observable, of, from, Subject, Subscription, timer, interval, combineLatest } from 'rxjs';
import { map, filter, scan, delay, concatAll, concat, zip, startWith, throttleTime, take, switchAll, switchMap } from 'rxjs/operators';
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
  // private control: number = 0;

  public configShowStage = new BehaviorSubject({});
  public configEditStage = new BehaviorSubject({});
  public configShow = new BehaviorSubject({});
  public configEdit = new BehaviorSubject({});

  // @ViewChild("control") private control: ElementRef;
  // @ViewChild("show") private showImg: ElementRef;
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
  }



  // "../../assets/1.jpg";




  changeFile(e) {
    const file = e.target.files[0];
    const fr = new FileReader();
    fr.readAsBinaryString(file);  //2
    fr.onloadend = (e: FileReaderProgressEvent) => {
      //atob 编码   btoa 解码
      // this.data = "data:image/gif;base64," + window.btoa(e.target.result);
      // console.log(this.data);
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
          // let height 


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
  }

  executor(v: any) {
    console.log(v);
  }
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