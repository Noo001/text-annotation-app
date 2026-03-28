import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArticleService } from '../../core/services/article.service';
import { AnnotationService } from '../../core/services/annotation.service';

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './article-editor.component.html',
  styleUrls: ['./article-editor.component.scss']
})
export class ArticleEditorComponent implements OnInit {
  articleId: string | null = null;
  title = '';
  content = '';
  isNew = true;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private annotationService: AnnotationService
  ) {}

  ngOnInit(): void {
    this.articleId = this.route.snapshot.paramMap.get('id');

    if (this.articleId && this.articleId !== 'new') {
      this.isNew = false;
      this.loadArticle();
    }
  }

  private loadArticle(): void {
    this.articleService.getArticleById(this.articleId!).subscribe(article => {
      if (article) {
        this.title = article.title;
        this.content = article.content;
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  saveArticle(): void {
    if (!this.title.trim()) {
      alert('Введите заголовок статьи');
      return;
    }

    this.saving = true;

    if (this.isNew) {
      const newArticle = this.articleService.createArticle({
        title: this.title.trim(),
        content: this.content
      });
      this.router.navigate(['/viewer', newArticle.id]);
    } else {
      this.articleService.updateArticle(this.articleId!, {
        title: this.title.trim(),
        content: this.content
      });

      this.annotationService.deleteAnnotationsForArticle(this.articleId!);

      this.router.navigate(['/viewer', this.articleId]);
    }

    this.saving = false;
  }

  cancel(): void {
    if (this.isNew) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/viewer', this.articleId]);
    }
  }
}
