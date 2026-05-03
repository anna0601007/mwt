import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilmEdit } from './film-edit';

describe('FilmEdit', () => {
  let component: FilmEdit;
  let fixture: ComponentFixture<FilmEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilmEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilmEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
