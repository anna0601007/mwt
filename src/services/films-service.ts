import { inject, Injectable } from '@angular/core';
import {catchError, EMPTY, map, Observable} from 'rxjs';
import { Film } from '../entities/film';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import { environment } from '../environments/environment';
import {DEFAULT_NAVIGATE_AFTER_LOGIN, UsersService} from './users-service';
import {MessageService} from './message-service';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
//@Injectable() // nepíšeme providedIn, vytvorí sa nová service pre každý Films komponent, vďaka jeho providers sekcii
export class FilmsService {
  http = inject(HttpClient);
  usersService = inject(UsersService);
  url = environment.restServerUrl;
  messageService = inject(MessageService);
  router = inject(Router);
  navigateAfterLogin = DEFAULT_NAVIGATE_AFTER_LOGIN;

  get token() {
    return this.usersService.token;
  }

  set token(value: string) {
    this.usersService.token = value;
  }

  getTokenHeader(): {[header:string]: string} | undefined {
    if (this.token) {
      return {'X-Auth-Token': this.token}
    }
    return undefined;
  }

  getFilm(id: number): Observable<Film> {
    const options = {
      headers: this.getTokenHeader()
    };
    return this.http.get<Film>(`${this.url}films/${id}`, options).pipe(
      map(jsonFilm => Film.clone(jsonFilm)),
      catchError(error => this.processError(error))
    );
  }

  getFilms(orderBy?:string, descending?: boolean, indexFrom?: number, indexTo?: number, search?: string): Observable<FilmsResponse> {
    let httpParams: HttpParams = new HttpParams();
    if (orderBy) httpParams = httpParams.set('orderBy', orderBy);
    if (descending) httpParams = httpParams.set('descending', descending);
    if (! Number.isNaN(Number(indexFrom))) httpParams = httpParams.set('indexFrom', indexFrom!);
    if (indexTo) httpParams = httpParams.set('indexTo', indexTo);
    if (search) httpParams = httpParams.set('search', search);
    // let options = { params: httpParams, headers: this.getTokenHeader()};
    let options = { params: httpParams};
    return this.http.get<FilmsResponse>(this.url + 'films', options);
  }

  saveFilm(film: Film): Observable<Film> {
    const options = {
      headers: this.getTokenHeader()
    };

    return this.http.post<Film>(`${this.url}films`, film, options).pipe(
      map(jsonFilm => Film.clone(jsonFilm)),
      catchError(error => this.processError(error))
    );
  }
  processError(error: any): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        this.messageService.errorMessage("Server not available");
        return EMPTY;
      }
      if (error.status >= 400 && error.status < 500) {
        const message = error.error.errorMessage || JSON.parse(error.error).errorMessage;
        if (message === 'unknown token') {
          this.token = '';
          this.messageService.errorMessage('Session lost, please log in again');
          this.navigateAfterLogin = this.router.url;
          this.router.navigateByUrl('/login');
          return EMPTY;
        }
        this.messageService.errorMessage(message);
        return EMPTY;
      }
      if (error.status >= 500) {
        this.messageService.errorMessage("Server has some serious problems, contact administrator.");
      }
    }
    console.error('HTTP connection error',error);
    return EMPTY;
  }
}

export interface FilmsResponse {
  items: Film[],
  totalCount: number
}

export class FilmsQuery {
  constructor(
    public orderBy?:string,
    public descending?: boolean,
    public indexFrom?: number,
    public indexTo?: number,
    public search?: string
  ){}
}
