import { TestBed } from '@angular/core/testing';

import { ShardManagerService } from './shard-manager.service';

describe('ShardManagerService', () => {
  let service: ShardManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShardManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
