import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {
  applyEach,
  applyWhenValue,
  FormField,
  form,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';

import { CanComponentDeactivate } from '../../guards/can-deactivate-guard';
import { DialogService } from '../../services/dialog-service';
import { FilmsService } from '../../services/films-service';
import { MessageService } from '../../services/message-service';

import { Film } from '../../entities/film';
import { Person } from '../../entities/person';
import { Postava } from '../../entities/postava';

interface DirectorInput {
  krstneMeno: string;
  stredneMeno: string;
  priezvisko: string;
}

interface ActorInput {
  krstneMeno: string;
  stredneMeno: string;
  priezvisko: string;
}

interface CharacterInput {
  postava: string;
  dolezitost: '' | 'hlavná postava' | 'vedľajšia postava';
  herec: ActorInput;
}

interface FilmFormModel {
  nazov: string;
  rok: number | '';
  slovenskyNazov: string;
  imdbID: string;
  afi1998: number | '';
  afi2007: number | '';
  reziseri: DirectorInput[];
  postavy: CharacterInput[];
}

@Component({
  selector: 'app-film-edit',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormField,
  ],
  templateUrl: './film-edit.html',
  styleUrl: './film-edit.scss',
})
export class FilmEdit implements OnInit, CanComponentDeactivate {
  private filmService = inject(FilmsService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private dialogService = inject(DialogService);

  title = signal('');
  filmID = signal<number | undefined>(undefined);
  saved = false;
  submitted = signal(false);
  initialSnapshot = signal('');

  model = signal<FilmFormModel>({
    nazov: '',
    rok: '',
    slovenskyNazov: '',
    imdbID: '',
    afi1998: '',
    afi2007: '',
    reziseri: [this.emptyDirector()],
    postavy: [this.emptyCharacter()],
  });

  filmForm = form(this.model, schema => {
    required(schema.nazov, { message: 'Title is required' });
    minLength(schema.nazov, 2, {
      message: 'Title must have at least 2 characters',
    });
    maxLength(schema.nazov, 200, { message: 'Title is too long' });

    required(schema.rok, { message: 'Year is required' });
    min(schema.rok, 1888, { message: 'Year is too small' });
    max(schema.rok, new Date().getFullYear(), {
      message: 'Year cannot be in the future',
    });

    required(schema.slovenskyNazov, {
      message: 'Slovak title is required',
    });
    minLength(schema.slovenskyNazov, 2, {
      message: 'Slovak title must have at least 2 characters',
    });
    maxLength(schema.slovenskyNazov, 200, {
      message: 'Slovak title is too long',
    });

    required(schema.imdbID, { message: 'IMDb ID is required' });
    pattern(schema.imdbID, /^tt\d+$/, {
      message: 'IMDb ID must be in format tt1234567',
    });

    applyWhenValue(
      schema.afi1998,
      value => value !== '' && value != null,
      afi1998 => {
        min(afi1998, 1, {
          message: 'AFI 1998 ranking must be at least 1',
        });
        max(afi1998, 100, {
          message: 'AFI 1998 ranking cannot be greater than 100',
        });
      }
    );

    applyWhenValue(
      schema.afi2007,
      value => value !== '' && value != null,
      afi2007 => {
        min(afi2007, 1, {
          message: 'AFI 2007 ranking must be at least 1',
        });
        max(afi2007, 100, {
          message: 'AFI 2007 ranking cannot be greater than 100',
        });
      }
    );

    applyEach(schema.reziseri, director => {
      required(director.krstneMeno, {
        message: 'Director first name is required',
      });
      minLength(director.krstneMeno, 3, {
        message: 'Director first name must have at least 3 characters',
      });

      required(director.priezvisko, {
        message: 'Director last name is required',
      });
      minLength(director.priezvisko, 3, {
        message: 'Director last name must have at least 3 characters',
      });
    });

    applyEach(schema.postavy, character => {
      required(character.postava, {
        message: 'Character name is required',
      });
      minLength(character.postava, 3, {
        message: 'Character name must have at least 3 characters',
      });

      required(character.dolezitost, {
        message: 'Importance is required',
      });

      required(character.herec.krstneMeno, {
        message: 'Actor first name is required',
      });
      minLength(character.herec.krstneMeno, 3, {
        message: 'Actor first name must have at least 3 characters',
      });

      required(character.herec.priezvisko, {
        message: 'Actor last name is required',
      });
      minLength(character.herec.priezvisko, 3, {
        message: 'Actor last name must have at least 3 characters',
      });
    });
  });

  ngOnInit(): void {
    const id = Number(this.activatedRoute.snapshot.params['id']);

    if (!Number.isNaN(id)) {
      this.title.set('Editing film with id ' + id);
      this.filmID.set(id);

      this.filmService.getFilm(id).subscribe(film => {
        this.model.set({
          nazov: film.nazov,
          rok: film.rok,
          slovenskyNazov: film.slovenskyNazov,
          imdbID: film.imdbID,
          afi1998: film.poradieVRebricku['AFI 1998'] ?? '',
          afi2007: film.poradieVRebricku['AFI 2007'] ?? '',
          reziseri:
            film.reziser.length > 0
              ? film.reziser.map(r => ({
                krstneMeno: r.krstneMeno ?? '',
                stredneMeno: r.stredneMeno ?? '',
                priezvisko: r.priezvisko ?? '',
              }))
              : [this.emptyDirector()],
          postavy:
            film.postava.length > 0
              ? film.postava.map(p => ({
                postava: p.postava ?? '',
                dolezitost: p.dolezitost ?? '',
                herec: {
                  krstneMeno: p.herec?.krstneMeno ?? '',
                  stredneMeno: p.herec?.stredneMeno ?? '',
                  priezvisko: p.herec?.priezvisko ?? '',
                },
              }))
              : [this.emptyCharacter()],
        });

        this.resetInitialSnapshot();
      });
    } else {
      this.title.set('Insert new film');
      this.resetInitialSnapshot();
    }
  }

  private resetInitialSnapshot(): void {
    this.initialSnapshot.set(JSON.stringify(this.model()));
  }

  private emptyDirector(): DirectorInput {
    return {
      krstneMeno: '',
      stredneMeno: '',
      priezvisko: '',
    };
  }

  private emptyCharacter(): CharacterInput {
    return {
      postava: '',
      dolezitost: '',
      herec: {
        krstneMeno: '',
        stredneMeno: '',
        priezvisko: '',
      },
    };
  }

  addDirector(): void {
    this.model.update(m => ({
      ...m,
      reziseri: [...m.reziseri, this.emptyDirector()],
    }));
  }

  removeDirector(index: number): void {
    this.model.update(m => {
      const next = m.reziseri.filter((_, i) => i !== index);
      return {
        ...m,
        reziseri: next.length > 0 ? next : [this.emptyDirector()],
      };
    });
  }

  addCharacter(): void {
    this.model.update(m => ({
      ...m,
      postavy: [...m.postavy, this.emptyCharacter()],
    }));
  }

  removeCharacter(index: number): void {
    this.model.update(m => {
      const next = m.postavy.filter((_, i) => i !== index);
      return {
        ...m,
        postavy: next.length > 0 ? next : [this.emptyCharacter()],
      };
    });
  }

  onSubmit(event?: Event): void {
    event?.preventDefault();
    this.submitted.set(true);

    if (this.filmForm().invalid()) {
      return;
    }

    const data = this.model();

    const directors: Person[] = data.reziseri.map(
      d =>
        ({
          krstneMeno: d.krstneMeno.trim(),
          stredneMeno: d.stredneMeno.trim(),
          priezvisko: d.priezvisko.trim(),
        }) as Person
    );

    const characters: Postava[] = data.postavy.map(
      c =>
        ({
          postava: c.postava.trim(),
          dolezitost: c.dolezitost as
            | 'hlavná postava'
            | 'vedľajšia postava',
          herec: {
            krstneMeno: c.herec.krstneMeno.trim(),
            stredneMeno: c.herec.stredneMeno.trim(),
            priezvisko: c.herec.priezvisko.trim(),
          } as Person,
        }) as Postava
    );

    const rankings: { [name: string]: number } = {};

    if (data.afi1998 !== '' && data.afi1998 != null) {
      rankings['AFI 1998'] = Number(data.afi1998);
    }

    if (data.afi2007 !== '' && data.afi2007 != null) {
      rankings['AFI 2007'] = Number(data.afi2007);
    }

    const film = new Film(
      data.nazov.trim(),
      Number(data.rok),
      data.slovenskyNazov.trim(),
      data.imdbID.trim(),
      directors,
      characters,
      rankings,
      this.filmID()
    );

    this.filmService.saveFilm(film).subscribe(savedFilm => {
      this.messageService.successMessage(
        'Film ' + savedFilm.nazov + ' saved successfully'
      );
      this.saved = true;
      this.router.navigateByUrl('/films');
    });
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.saved) return true;

    const changed = JSON.stringify(this.model()) !== this.initialSnapshot();

    if (changed) {
      return this.dialogService.confirm(
        'Form not saved',
        'Do you really want to leave without saving this film?'
      );
    }

    return true;
  }
}
