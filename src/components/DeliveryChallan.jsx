import React, { forwardRef } from 'react';

const T = ({ top, left, width, align = 'left', bold, children }) => (
  <span style={{
    position: 'absolute',
    top,
    left,
    width,
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 12,
    color: 'black',
    textAlign: align,
    display: 'inline-block',
    padding: '0 2px',
    lineHeight: '1.4',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    fontWeight: bold ? 'bold' : 'normal',
  }}>
    {children}
  </span>
);

const DeliveryChallan = forwardRef(({ incharge, machines = [], challanDetails = {} }, ref) => {
  const today = challanDetails.challanDate || new Date().toLocaleDateString('en-IN');
  const challanNo = challanDetails.challanNo || `ASL-${Date.now().toString().slice(-6)}`;

  const groupedMachines = Object.values(
    machines.reduce((acc, m) => {
      const key = m.machineTypeId?._id || m.machineTypeId || m._id;
      if (!acc[key]) {
        acc[key] = { ...m, quantity: 1, totalCost: m.purchaseCost || 0, serialNumbers: [m.serialNumber] };
      } else {
        acc[key].quantity += 1;
        acc[key].totalCost += m.purchaseCost || 0;
        acc[key].serialNumbers.push(m.serialNumber);
      }
      return acc;
    }, {})
  );

  const page1Rows = groupedMachines.slice(0, 12);
  const page2Rows = groupedMachines.slice(12);
  const rowStartY = 432;
  const rowHeight = 18;

  const totalQty    = groupedMachines.reduce((s, m) => s + m.quantity, 0);
  const totalAmt    = groupedMachines.reduce((s, m) => s + (m.totalCost || 0), 0);
  const igst        = Math.round(totalAmt * 0.18 * 100) / 100;
  const netAmount   = Math.round((totalAmt + igst) * 100) / 100;

  // totals row appears after last data row on whichever page is last
  const lastPage1RowTop = rowStartY + (page1Rows.length - 1) * rowHeight + 53;
  const totalsTop = page2Rows.length > 0 ? null : lastPage1RowTop + rowHeight + 450;

  return (
    <div ref={ref} className="flex flex-col items-center gap-8 py-10 bg-gray-200">

      {/* PAGE 1 */}
      <div className="challan-page relative w-[800px] shadow-2xl bg-white">
        <img src="/539_page-0001.jpg" alt="Challan Page 1" className="block w-full" />

        {/* Consignor */}
        <T top={250} left={150} width={240}>{challanDetails.consignorName || ''}</T>
        {(() => {
          const addr = challanDetails.consignorAddress || '';
          const mid = addr.lastIndexOf(' ', Math.ceil(addr.length / 2));
          const split = mid === -1 ? Math.ceil(addr.length / 2) : mid;
          return (
            <>
              <T top={265} left={150} width={240}>{addr.slice(0, split).trim()}</T>
              <T top={279} left={150} width={240}>{addr.slice(split).trim()}</T>
            </>
          );
        })()}
        <T top={305} left={150} width={250}>{challanDetails.consignorPincode || ''}</T>
        <T top={322} left={150} width={250}>{challanDetails.consignorGstin || ''}</T>
        <T top={340} left={150} width={250}>{challanDetails.consignorContact || ''}</T>

        {/* Consignee */}
        <T top={360} left={150} width={310}>{challanDetails.consigneeName || incharge?.name || ''}</T>
        <T top={375} left={150} width={310}>{challanDetails.consigneeAddress || ''}</T>
        <T top={412} left={150} width={250}>{challanDetails.consigneePincode || ''}</T>
        <T top={430} left={150} width={250}>{challanDetails.consigneeGstin || ''}</T>
        <T top={449} left={150} width={250}>{challanDetails.consigneeContact || ''}</T>

        {/* Right side fields */}
        <T top={253} left={520} width={100}>{challanNo}</T>
        <T top={261} left={645} width={85}>{today}</T>
        <T top={281} left={500} width={100}>{challanDetails.suppliersRef || ''}</T>
        <T top={288} left={645} width={85}>{challanDetails.othersRef || ''}</T>
        <T top={321} left={505} width={100}>{challanDetails.buyersOrderNo || ''}</T>
        <T top={321} left={645} width={85}>{challanDetails.buyersOrderDate || ''}</T>
        <T top={360} left={515} width={100}>{challanDetails.dispatchDocNo || ''}</T>
        <T top={388} left={645} width={140}>{challanDetails.destination || ''}</T>
        <T top={388} left={520} width={260}>{challanDetails.dispatchThrough || ''}</T>
        <T top={412} left={460} width={260}>{challanDetails.vehicle || ''}</T>
        <T top={430} left={480} width={260}>{challanDetails.driverName || ''}</T>
        <T top={448} left={495} width={260}>{challanDetails.driverContact || ''}</T>

        {/* Table Rows */}
        {Array.from({ length: 12 }).map((_, i) => {
          const m = page1Rows[i];
          const top = rowStartY + i * rowHeight + 53;
          return (
            <React.Fragment key={i}>
              <T top={top} left={88}  width={55}  align="center">{m ? i + 1 : ''}</T>
              <T top={top} left={150} width={280}>{m ? (m.machineTypeId?.name || '-') : ''}</T>
              <T top={top} left={400} width={95}  align="center">{m ? m.quantity : ''}</T>
              <T top={top} left={532} width={80}  align="center">{m ? (m.purchaseCost || '') : ''}</T>
              <T top={top} left={605} width={155} align="center">{m ? (m.totalCost || '') : ''}</T>
            </React.Fragment>
          );
        })}

        {/* Totals — only on page 1 if no page 2 */}
        {page2Rows.length === 0 && totalsTop && (
          <>
            <T top={totalsTop}      left={400} width={95}  align="center" style={{fontWeight:'bold'}}>{totalQty}</T>
            <T top={totalsTop}      left={605} width={155} align="center">{totalAmt.toFixed(2)}</T>
            <T top={totalsTop - 3} left={150} width={200} bold>Total Quantity</T>
            <T top={totalsTop - 3} left={530} width={200} bold>Total Amount</T>
            <T top={totalsTop + 16} left={530} width={200} bold>IGST 18%</T>
            <T top={totalsTop + 16} left={605} width={155} align="center">{igst.toFixed(2)}</T>
            <T top={totalsTop + 32} left={530} width={200} bold>Net Amount</T>
            <T top={totalsTop + 32} left={605} width={155} align="center">{netAmount.toFixed(2)}</T>
          </>
        )}
      </div>

      {/* PAGE 2 */}
      {page2Rows.length > 0 && (
        <div className="challan-page relative w-[800px] shadow-2xl bg-white">
          <img src="/539_page-0002.jpg" alt="Challan Page 2" className="block w-full" />
          {Array.from({ length: 13 }).map((_, i) => {
            const m = page2Rows[i];
            const top = 120 + i * rowHeight;
            return (
              <React.Fragment key={i}>
                <T top={top} left={88}  width={55}  align="center">{m ? 12 + i + 1 : ''}</T>
                <T top={top} left={150} width={280}>{m ? (m.machineTypeId?.name || '-') : ''}</T>
                <T top={top} left={438} width={95}  align="center">{m ? m.quantity : ''}</T>
                <T top={top} left={58}  width={80}  align="center">{m ? (m.purchaseCost || '') : ''}</T>
                <T top={top} left={605} width={155} align="center">{m ? (m.totalCost || '') : ''}</T>
              </React.Fragment>
            );
          })}
          {/* Totals on page 2 */}
          {(() => {
            const lastTop = 120 + (page2Rows.length - 1) * rowHeight;
            const tTop = lastTop + rowHeight + 4;
            return (
              <>
                <T top={tTop}      left={438} width={95}  align="center">{totalQty}</T>
                <T top={tTop}      left={605} width={155} align="center">{totalAmt.toFixed(2)}</T>
                <T top={tTop + 16} left={150} width={200}>IGST 18%</T>
                <T top={tTop + 16} left={605} width={155} align="center">{igst.toFixed(2)}</T>
                <T top={tTop + 32} left={150} width={200}>Net Amount</T>
                <T top={tTop + 32} left={605} width={155} align="center">{netAmount.toFixed(2)}</T>
              </>
            );
          })()}
        </div>
      )}

    </div>
  );
});

DeliveryChallan.displayName = 'DeliveryChallan';
export default DeliveryChallan;
