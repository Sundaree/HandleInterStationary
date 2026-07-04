import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'baht', standalone: true })
export class BahtPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || isNaN(Number(value))) return '฿ 0';
    return '฿ ' + Number(value).toLocaleString('th-TH', {
      minimumFractionDigits: 0, maximumFractionDigits: 2
    });
  }
}
