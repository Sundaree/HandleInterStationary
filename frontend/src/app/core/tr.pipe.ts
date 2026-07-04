import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({ name: 'tr', standalone: true, pure: false })
export class TrPipe implements PipeTransform {
  private i18n = inject(I18nService);
  transform(key: string): string {
    return this.i18n.t()(key);
  }
}
