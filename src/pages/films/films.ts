import { AfterViewInit, Component, computed, inject, OnInit, Query, signal, viewChild } from '@angular/core';
import { MaterialModule } from '../../modules/material-module';
import { Film } from '../../entities/film';
import { FilmsQuery, FilmsService } from '../../services/films-service';
import { UsersService } from '../../services/users-service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-films',
  imports: [MaterialModule, MatProgressSpinnerModule, RouterLink, FormsModule],
  templateUrl: './films.html',
  styleUrl: './films.scss',
  providers:[FilmsService] // vypýtame si, aby sa vytvoril service, ktorý nemá globálny charakter
})
export default class Films implements OnInit, AfterViewInit{
  usersService = inject(UsersService);
  filmsService = inject(FilmsService);

  expandedFilm? : Film;
  toggle(film: Film) {
    this.expandedFilm = film === this.expandedFilm ? undefined : film;
  }


  paginator = viewChild.required<MatPaginator>(MatPaginator);
  sorter = viewChild.required<MatSort>(MatSort);

  // films = signal<Film[]>([]);
  loggedUser = this.usersService.loggedUser;

//  columns = signal<string[]>(['id', 'nazov', 'rok']);
  columns = computed(() => this.loggedUser()
    ? ['id', 'nazov', 'slovenskyNazov', 'rok', 'afi1998', 'afi2007', 'editFilm', 'expand']
    : ['id', 'nazov', 'rok']
  );

  orderBy = signal<string | undefined>(undefined);
  descending = signal<boolean | undefined>(undefined);
  indexFrom = signal<number | undefined>(0);
  indexTo = signal<number | undefined>(5);
  search = signal<string | undefined>(undefined);
  query = computed(() => new FilmsQuery(this.orderBy(),
    this.descending(),
    this.indexFrom(),
    this.indexTo(),
    this.search()));
  // request$ = toObservable(this.query).pipe(
  //   tap(query => console.log('sending new query ' , query)),
  //   switchMap(query => this.filmsService.getFilms(query.orderBy, query.descending, query.indexFrom, query.indexTo, query.search))
  // )
  // filmsResponse = toSignal(this.request$);
  filmsResource = rxResource({
    params: () => this.query(),
    stream: ({params: query}) => this.filmsService.getFilms(query.orderBy, query.descending, query.indexFrom, query.indexTo, query.search)
  });
  filmsResponse = this.filmsResource.value;
  loading = this.filmsResource.isLoading;

  films = computed(() => this.filmsResponse()?.items || []);

  ngOnInit(): void {
    // this.filmsService.getFilms(this.orderBy(), this.descending(), this.indexFrom(), this.indexTo(), this.search()).subscribe(filmsReponse => {
    //   this.films.set(filmsReponse.items);
    //   console.log('recieved films response' , filmsReponse);
    // });
  }

  ngAfterViewInit(): void {
    this.paginator().page.subscribe(pageEvent => {
      console.log('page event:', pageEvent);
      this.indexFrom.set(pageEvent.pageIndex * pageEvent.pageSize);
      this.indexTo.set((pageEvent.pageIndex+1) * pageEvent.pageSize);
    });
    this.sorter().sortChange.subscribe(sortEvent => {

    })
  }

  onPageEvent(event: PageEvent) {

  }

  onSortEvent(sortEvent: Sort) {
    console.log('sort event:', sortEvent);
    if (sortEvent.direction === '') {
      this.orderBy.set(undefined);
      this.descending.set(undefined);
      return;
    }
    this.descending.set(sortEvent.direction === 'desc');
    let column = sortEvent.active;
    if (column === 'afi1998') column = 'poradieVRebricku.AFI 1998';
    if (column === 'afi2007') column = 'poradieVRebricku.AFI 2007';
    this.orderBy.set(column);
    this.paginator().firstPage();
  }

  onFilter(event: any) {
    const searchValue = (event?.target.value as string).trim().toLocaleLowerCase();
    this.search.set(searchValue);
    this.paginator().firstPage();
  }
}
