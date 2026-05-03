import { Person } from "./person";

export class Postava {
  static clone(p: Postava): Postava {
    return new Postava(
      p.postava,
      p.dolezitost,
      Person.clone(p.herec)
    );
  }
  constructor(
    public postava: string,
    public dolezitost: "hlavná postava" | "vedľajšia postava",
    public herec: Person
  ){}
}
