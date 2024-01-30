import * as _ from 'lodash';
import { PaymentMethodEnum } from '../enums';

export class AppUtil {
  public static isNumber(field): boolean {
    if (field === null || field === undefined || field.toString() === 'NaN') {
      return false;
    }

    return _.isNumber(field);
  }

  public static generateIdempKey(orderID: string, paymentMethod: PaymentMethodEnum): string {
    return `${orderID}_${paymentMethod}`;
  }

  public static enumKeys(e: Record<string, unknown>): string[] {
    return Object.keys(e).filter(x => !(parseInt(x) >= 0));
  }

  public static isInstantPayment(pm: PaymentMethodEnum): boolean {
    switch (pm) {
      case PaymentMethodEnum.CASH:
      case PaymentMethodEnum.WALLET:
        return true;
      case PaymentMethodEnum.SADAD:
        return false;
      default:
        return false;
    }
  }

  public static is3PMethod(pm: PaymentMethodEnum): boolean {
    return !this.isInstantPayment(pm);
  }
}
