import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Annotation } from '../models/annotation.model';

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {
  private readonly STORAGE_KEY = 'annotations';
  private annotationsSubject = new BehaviorSubject<Annotation[]>([]);
  public annotations$ = this.annotationsSubject.asObservable();

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const annotations: Annotation[] = stored ? JSON.parse(stored) : [];

    const annotationsWithDates = annotations.map(annotation => ({
      ...annotation,
      createdAt: new Date(annotation.createdAt)
    }));
    this.annotationsSubject.next(annotationsWithDates);
  }

  private saveToLocalStorage(annotations: Annotation[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(annotations));
    this.annotationsSubject.next(annotations);
  }

  getAnnotationsForArticle(articleId: string): Observable<Annotation[]> {
    return new Observable(subscriber => {
      this.annotations$.subscribe(annotations => {
        subscriber.next(annotations.filter(a => a.articleId === articleId));
      });
    });
  }

  addAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt'>): Annotation {
    const newAnnotation: Annotation = {
      ...annotation,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    const current = this.annotationsSubject.value;
    this.saveToLocalStorage([...current, newAnnotation]);
    return newAnnotation;
  }

  deleteAnnotation(id: string): void {
    const current = this.annotationsSubject.value;
    this.saveToLocalStorage(current.filter(a => a.id !== id));
  }

  deleteAnnotationsForArticle(articleId: string): void {
    const current = this.annotationsSubject.value;
    this.saveToLocalStorage(current.filter(a => a.articleId !== articleId));
  }
}
