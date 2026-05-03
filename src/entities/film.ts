import { Person } from "./person";
import { Postava } from "./postava";

export class Film {
  static clone(f: Film): Film {
    return new Film(
      f.nazov, f.rok,
      f.slovenskyNazov, f.imdbID,
      f.reziser?.map(r => Person.clone(r)),
      f.postava?.map(p => Postava.clone(p)),
      {...f.poradieVRebricku},
      f.id
    );
  }
  constructor(
    public nazov: string,
    public rok: number,
    public slovenskyNazov: string,
    public imdbID: string,
    public reziser: Person[],
    public postava: Postava[],
    public poradieVRebricku: {[name: string]: number},
    public id?: number
  ){}
}
