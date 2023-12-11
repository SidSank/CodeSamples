import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  public isLoading: BehaviorSubject<boolean>;
  constructor() {
    this.isLoading = new BehaviorSubject<any>(false);
  }
}
