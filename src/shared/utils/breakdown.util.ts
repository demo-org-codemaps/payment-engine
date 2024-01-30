import { BatchCashDto, MoneyDto } from '../../transaction';

export const getAllOrdersFromBatches = (data: BatchCashDto) => {
  const orders = [];
  const { batch } = data;
  batch.forEach(order => {
    const orderData = {
      orderId: order.orderId,
      total: new MoneyDto(order.total.amount, order.total.currency),
    };
    orders.push(orderData);
  });
  return orders;
};

export const formatedDataWithBatches = async ordersBreakdown => {
  const ordersBreakdownMap = {};
  ordersBreakdown.forEach(order => {
    const {
      order: { orderId },
      breakdown: { CASH, WALLET, SADAD },
    } = order;
    ordersBreakdownMap[orderId] = {
      cashAmount: CASH?.total?.toJSON()?.amount || 0,
      walletAmount: WALLET?.total?.toJSON()?.amount || 0,
      sadadAmount: SADAD?.total?.toJSON()?.amount || 0,
    };
  });
  return ordersBreakdownMap;
};
