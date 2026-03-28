import { Component, OnInit, OnDestroy, ElementRef, AfterViewInit, ChangeDetectorRef, viewChild, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { AnnotationService } from '../../core/services/annotation.service';
import { Annotation, ANNOTATION_COLORS, AnnotationColor } from '../../core/models/annotation.model';
import { Article } from '../../core/models/article.model';
import { TooltipComponent } from '../../shared/components/tooltip/tooltip.component';

interface TooltipState {
  visible: boolean;
  note: string;
  annotationId: string;
  top: number;
  left: number;
}

@Component({
  selector: 'app-article-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TooltipComponent],
  templateUrl: './article-viewer.component.html',
  styleUrls: ['./article-viewer.component.scss']
})
export class ArticleViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  articleContentRef = viewChild<ElementRef<HTMLDivElement>>('articleContent');

  article = signal<Article | null>(null);
  annotations = signal<Annotation[]>([]);

  showAnnotationPopup = false;
  popupPosition = { top: 0, left: 0 };
  selectedRange: Range | null = null;
  selectedText = '';

  newAnnotationNote = '';
  newAnnotationColor: AnnotationColor = 'yellow';

  tooltip: TooltipState = {
    visible: false,
    note: '',
    annotationId: '',
    top: 0,
    left: 0
  };

  colors = ANNOTATION_COLORS;

  private subscriptions = new Subscription();
  private renderEffect = effect(() => {
    const currentArticle = this.article();
    const currentAnnotations = this.annotations();
    const element = this.articleContentRef();

    if (currentArticle && element) {
      this.renderAnnotations(currentArticle, currentAnnotations);
    }
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private annotationService: AnnotationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const articleId = this.route.snapshot.paramMap.get('id');
    if (!articleId) {
      this.router.navigate(['/']);
      return;
    }

    this.subscriptions.add(
      this.articleService.getArticleById(articleId).subscribe(article => {
        if (!article) {
          this.router.navigate(['/']);
          return;
        }
        this.article.set(article);
        this.loadAnnotations();
      })
    );
  }

  ngAfterViewInit(): void {
    this.setupTextSelectionListener();
    this.setupAnnotationHoverListener();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.renderEffect.destroy();
    this.removeTextSelectionListener();
    this.removeAnnotationHoverListener();
  }

  private loadAnnotations(): void {
    const currentArticle = this.article();
    if (!currentArticle) return;

    this.subscriptions.add(
      this.annotationService.getAnnotationsForArticle(currentArticle.id).subscribe(annotations => {
        this.annotations.set(annotations);
      })
    );
  }

  private renderAnnotations(article: Article, annotations: Annotation[]): void {
    const element = this.articleContentRef()?.nativeElement;
    if (!element) return;

    const text = article.content;
    let html = '';
    let lastIndex = 0;

    const sortedAnnotations = [...annotations].sort((a, b) => a.startIndex - b.startIndex);

    for (const annotation of sortedAnnotations) {
      html += this.escapeHtml(text.substring(lastIndex, annotation.startIndex));

      const annotatedText = text.substring(annotation.startIndex, annotation.endIndex);
      const colorClass = this.getColorClass(annotation.color);

      html += `<span class="annotated ${colorClass}" data-annotation-id="${annotation.id}" data-note="${this.escapeHtml(annotation.note)}">${this.escapeHtml(annotatedText)}</span>`;

      lastIndex = annotation.endIndex;
    }

    html += this.escapeHtml(text.substring(lastIndex));
    element.innerHTML = html.replace(/\n/g, '<br>');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private getColorClass(color: AnnotationColor): string {
    switch (color) {
      case 'yellow': return 'annotation-yellow';
      case 'green': return 'annotation-green';
      case 'blue': return 'annotation-blue';
      case 'pink': return 'annotation-pink';
      case 'orange': return 'annotation-orange';
      default: return 'annotation-yellow';
    }
  }

  private setupTextSelectionListener(): void {
    document.addEventListener('mouseup', this.onTextSelection.bind(this));
  }

  private removeTextSelectionListener(): void {
    document.removeEventListener('mouseup', this.onTextSelection.bind(this));
  }

  private setupAnnotationHoverListener(): void {
    document.addEventListener('mouseover', this.onAnnotationHover.bind(this));
    document.addEventListener('mouseout', this.onAnnotationLeave.bind(this));
  }

  private removeAnnotationHoverListener(): void {
    document.removeEventListener('mouseover', this.onAnnotationHover.bind(this));
    document.removeEventListener('mouseout', this.onAnnotationLeave.bind(this));
  }

  private onTextSelection(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.closest('.annotation-popup')) {
      return;
    }

    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || !this.articleContentRef()) {
      if (!this.showAnnotationPopup) {
        this.hideAnnotationPopup();
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const container = this.articleContentRef()?.nativeElement;

    if (!container?.contains(range.commonAncestorContainer)) {
      if (!this.showAnnotationPopup) {
        this.hideAnnotationPopup();
      }
      return;
    }

    if (this.isSelectionInAnnotation(range)) {
      if (!this.showAnnotationPopup) {
        this.hideAnnotationPopup();
      }
      return;
    }

    this.selectedRange = range.cloneRange();
    this.selectedText = selection.toString();

    const rect = range.getBoundingClientRect();
    this.popupPosition = {
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX + (rect.width / 2)
    };

    this.newAnnotationNote = '';
    this.newAnnotationColor = 'yellow';
    this.showAnnotationPopup = true;
    this.cdr.detectChanges();
    this.hideTooltip();
  }

  private isSelectionInAnnotation(range: Range): boolean {
    const container = this.articleContentRef()?.nativeElement;
    if (!container) return false;

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('annotated')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    const nodes: HTMLElement[] = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode as HTMLElement);
    }

    for (const node of nodes) {
      if (range.intersectsNode(node)) {
        return true;
      }
    }

    return false;
  }

  private onAnnotationHover(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.classList?.contains('annotated')) {
      return;
    }

    const annotationId = target.getAttribute('data-annotation-id');
    const note = target.getAttribute('data-note');

    if (!annotationId || !note) return;

    const rect = target.getBoundingClientRect();

    this.tooltip = {
      visible: true,
      note: note,
      annotationId: annotationId,
      top: rect.top + window.scrollY - 10,
      left: rect.left + window.scrollX + (rect.width / 2)
    };
  }

  private onAnnotationLeave(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    if (target.classList?.contains('annotated')) {
      if (!relatedTarget || !relatedTarget.closest('.tooltip')) {
        this.hideTooltip();
      }
    }
  }

  hideAnnotationPopup(): void {
    this.showAnnotationPopup = false;
    this.selectedRange = null;
    this.cdr.detectChanges();
  }

  hideTooltip(): void {
    this.tooltip.visible = false;
  }

  createAnnotation(): void {
    if (!this.selectedRange || !this.article() || !this.newAnnotationNote.trim()) {
      alert('Введите текст аннотации');
      return;
    }

    const container = this.articleContentRef()?.nativeElement;
    if (!container) return;

    const currentArticle = this.article()!;

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(this.selectedRange);

    const range = selection!.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);

    const startIndex = preRange.toString().length;
    const endIndex = startIndex + range.toString().length;

    this.annotationService.addAnnotation({
      articleId: currentArticle.id,
      startIndex,
      endIndex,
      color: this.newAnnotationColor,
      note: this.newAnnotationNote.trim()
    });

    this.hideAnnotationPopup();
  }

  deleteAnnotation(annotationId: string): void {
    this.annotationService.deleteAnnotation(annotationId);
    this.hideTooltip();
  }

  editArticle(): void {
    const currentArticle = this.article();
    if (currentArticle) {
      this.router.navigate(['/editor', currentArticle.id]);
    }
  }

  deleteArticle(): void {
    const currentArticle = this.article();
    if (!currentArticle) return;

    if (confirm('Удалить статью? Все аннотации также будут удалены.')) {
      this.annotationService.deleteAnnotationsForArticle(currentArticle.id);
      this.articleService.deleteArticle(currentArticle.id);
      this.router.navigate(['/']);
    }
  }
}
