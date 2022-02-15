import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShardCardComponent } from './shard-card.component';

describe('ShardCardComponent', () => {
  let component: ShardCardComponent;
  let fixture: ComponentFixture<ShardCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShardCardComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShardCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
