import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss']
})
export class TooltipComponent {
  @Input() note = '';
  @Input() annotationId = '';
  @Input() position = { top: 0, left: 0 };
  @Output() delete = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  onDelete(): void {
    this.delete.emit(this.annotationId);
  }

  onClose(): void {
    this.close.emit();
  }
}
