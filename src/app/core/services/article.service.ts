import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Article } from '../models/article.model';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private readonly STORAGE_KEY = 'articles';
  private articlesSubject = new BehaviorSubject<Article[]>([]);
  public articles$ = this.articlesSubject.asObservable();

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const articles: Article[] = stored ? JSON.parse(stored) : [];

    const articlesWithDates = articles.map(article => ({
      ...article,
      createdAt: new Date(article.createdAt),
      updatedAt: new Date(article.updatedAt)
    }));
    this.articlesSubject.next(articlesWithDates);
  }

  private saveToLocalStorage(articles: Article[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(articles));
    this.articlesSubject.next(articles);
  }

  getArticles(): Observable<Article[]> {
    return this.articles$;
  }

  getArticleById(id: string): Observable<Article | undefined> {
    return this.articles$.pipe(
      map(articles => articles.find(a => a.id === id))
    );
  }

  createArticle(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Article {
    const newArticle: Article = {
      ...article,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const current = this.articlesSubject.value;
    this.saveToLocalStorage([...current, newArticle]);
    return newArticle;
  }

  updateArticle(id: string, updates: Partial<Omit<Article, 'id' | 'createdAt'>>): void {
    const current = this.articlesSubject.value;
    const index = current.findIndex(a => a.id === id);
    if (index !== -1) {
      const updated = {
        ...current[index],
        ...updates,
        updatedAt: new Date()
      };
      current[index] = updated;
      this.saveToLocalStorage([...current]);
    }
  }

  deleteArticle(id: string): void {
    const current = this.articlesSubject.value;
    this.saveToLocalStorage(current.filter(a => a.id !== id));
  }
}
