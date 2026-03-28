export interface Annotation {
  id: string;
  articleId: string;
  startIndex: number;
  endIndex: number;
  color: AnnotationColor;
  note: string;
  createdAt: Date;
}

export type AnnotationColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export const ANNOTATION_COLORS: { value: AnnotationColor; label: string; cssClass: string }[] = [
  { value: 'yellow', label: 'Желтый', cssClass: 'annotation-yellow' },
  { value: 'green', label: 'Зеленый', cssClass: 'annotation-green' },
  { value: 'blue', label: 'Синий', cssClass: 'annotation-blue' },
  { value: 'pink', label: 'Розовый', cssClass: 'annotation-pink' },
  { value: 'orange', label: 'Оранжевый', cssClass: 'annotation-orange' }
];
