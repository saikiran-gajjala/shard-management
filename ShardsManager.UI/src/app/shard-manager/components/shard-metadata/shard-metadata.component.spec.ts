import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShardMetadataComponent } from './shard-metadata.component';

describe('ShardMetadataComponent', () => {
  let component: ShardMetadataComponent;
  let fixture: ComponentFixture<ShardMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShardMetadataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShardMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
