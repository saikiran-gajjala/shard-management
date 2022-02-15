import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChunkHomeComponent } from './chunk-home.component';

describe('ChunkHomeComponent', () => {
  let component: ChunkHomeComponent;
  let fixture: ComponentFixture<ChunkHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChunkHomeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChunkHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
