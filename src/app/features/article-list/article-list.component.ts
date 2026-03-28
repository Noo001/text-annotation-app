import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ArticleService } from '../../core/services/article.service';
import { Article } from '../../core/models/article.model';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss']
})
export class ArticleListComponent implements OnInit {
  articles: Article[] = [];

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.articleService.articles$.subscribe(articles => {
      this.articles = articles;
    });
  }

  deleteArticle(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Удалить статью? Все аннотации также будут удалены.')) {
      this.articleService.deleteArticle(id);
    }
  }
}
