import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShardsGridViewComponent } from './shards-grid-view.component';

describe('ShardsGridViewComponent', () => {
  let component: ShardsGridViewComponent;
  let fixture: ComponentFixture<ShardsGridViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShardsGridViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShardsGridViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
