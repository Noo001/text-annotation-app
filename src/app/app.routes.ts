import { Routes } from '@angular/router';
import { ArticleListComponent } from './features/article-list/article-list.component';
import { ArticleEditorComponent } from './features/article-editor/article-editor.component';
import { ArticleViewerComponent } from './features/article-viewer/article-viewer.component';

export const routes: Routes = [
  { path: '', component: ArticleListComponent },
  { path: 'editor/:id', component: ArticleEditorComponent },
  { path: 'viewer/:id', component: ArticleViewerComponent },
  { path: '**', redirectTo: '' }
];
