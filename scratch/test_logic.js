const { getTherapyFee, getAdvanceAmount, getRemainingAmount, getPlatformRevenue } = require('../server/utils/fees');

const session = {
  id: 2,
  type: 'Karnapoorana (Ear Care)',
  total_fee: '0.00',
  advance_fee: '0.00',
  remaining_fee: '0.00',
  platform_revenue: '0.00'
};

let totalFee = Number(session.total_fee);
if (!totalFee) totalFee = getTherapyFee(session.type);

let advanceFee = Number(session.advance_fee);
if (!advanceFee) advanceFee = getAdvanceAmount(totalFee);

let remainingFee = Number(session.remaining_fee);
if (!remainingFee) remainingFee = getRemainingAmount(totalFee);

let platformRevenue = Number(session.platform_revenue);
if (!platformRevenue) platformRevenue = getPlatformRevenue(totalFee);

console.log({
  sessionId: session.id,
  totalFee,
  advanceFee,
  remainingFee,
  platformRevenue
});
