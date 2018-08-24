import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParseGifComponent } from './parse-gif.component';

describe('ParseGifComponent', () => {
  let component: ParseGifComponent;
  let fixture: ComponentFixture<ParseGifComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParseGifComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParseGifComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
