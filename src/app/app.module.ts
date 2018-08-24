import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ParseGifComponent } from './parse-gif/parse-gif.component';
import { KonvaModule } from "ng2-konva";
@NgModule({
  declarations: [
    AppComponent,
    ParseGifComponent,
  ],
  imports: [
    BrowserModule,
    KonvaModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
