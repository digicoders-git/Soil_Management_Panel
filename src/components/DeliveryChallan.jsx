import React, { forwardRef } from 'react';

const DeliveryChallan = forwardRef(({ incharge, machines = [], challanDetails = {} }, ref) => {
  const today = challanDetails.challanDate || new Date().toLocaleDateString('en-IN');
  const challanNo = challanDetails.challanNo || `ASL-${Date.now().toString().slice(-6)}`;

  const groupedMachines = Object.values(
    machines.reduce((acc, m) => {
      const key = m.machineTypeId?._id || m.machineTypeId || m._id;
      const cost = Number(m.purchaseCost) || 0;
      if (!acc[key]) {
        acc[key] = { ...m, quantity: 1, totalCost: cost, serialNumbers: [m.serialNumber] };
      } else {
        acc[key].quantity += 1;
        acc[key].totalCost += cost;
        acc[key].serialNumbers.push(m.serialNumber);
      }
      return acc;
    }, {})
  );

  const totalQty    = groupedMachines.reduce((s, m) => s + m.quantity, 0);
  const totalAmt    = groupedMachines.reduce((s, m) => s + (Number(m.totalCost) || 0), 0);

  const gstType     = challanDetails.gstType || 'igst';
  const gstRate     = Number(challanDetails.gstRate || 18) / 100;
  const cgst        = gstType === 'cgst_sgst' ? Math.round(totalAmt * (gstRate / 2) * 100) / 100 : 0;
  const sgst        = gstType === 'cgst_sgst' ? Math.round(totalAmt * (gstRate / 2) * 100) / 100 : 0;
  const igst        = gstType === 'igst'      ? Math.round(totalAmt * gstRate * 100) / 100 : 0;
  const totalGst    = gstType === 'cgst_sgst' ? cgst + sgst : igst;
  const netAmount   = Math.round((totalAmt + totalGst) * 100) / 100;

  return (
    <div ref={ref} className="flex flex-col items-center gap-8 py-10 bg-gray-200">
      <div className="challan-page w-[800px] shadow-2xl bg-white p-10 text-black font-sans text-sm">
        
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold uppercase">ARUN SOIL LAB PRIVATE LIMITED</h1>
          <h2 className="text-lg font-semibold uppercase mt-1">Delivery Challan</h2>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Column (Consignor/Consignee) */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-bold text-gray-700 border-b border-gray-300 mb-2">Consignor</p>
              <p className="font-semibold">{challanDetails.consignorName || 'Arun Soil Lab'}</p>
              <p className="whitespace-pre-wrap">{challanDetails.consignorAddress || ''}</p>
              {challanDetails.consignorPincode && <p>Pin: {challanDetails.consignorPincode}</p>}
              {challanDetails.consignorGstin && <p>GSTIN: {challanDetails.consignorGstin}</p>}
              {challanDetails.consignorContact && <p>Contact: {challanDetails.consignorContact}</p>}
            </div>
            <div>
              <p className="font-bold text-gray-700 border-b border-gray-300 mb-2">Consignee</p>
              <p className="font-semibold">{challanDetails.consigneeName || incharge?.name || ''}</p>
              <p className="whitespace-pre-wrap">{challanDetails.consigneeAddress || ''}</p>
              {challanDetails.consigneePincode && <p>Pin: {challanDetails.consigneePincode}</p>}
              {challanDetails.consigneeGstin && <p>GSTIN: {challanDetails.consigneeGstin}</p>}
              {challanDetails.consigneeContact && <p>Contact: {challanDetails.consigneeContact}</p>}
            </div>
          </div>

          {/* Right Column (Details) */}
          <div>
            <p className="font-bold text-gray-700 border-b border-gray-300 mb-2">Challan Details</p>
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr><td className="py-1 font-semibold w-1/2">Challan No:</td><td className="py-1">{challanNo}</td></tr>
                <tr><td className="py-1 font-semibold">Date of issue:</td><td className="py-1">{today}</td></tr>
                {challanDetails.suppliersRef && <tr><td className="py-1 font-semibold">Supplier's Ref:</td><td className="py-1">{challanDetails.suppliersRef}</td></tr>}
                {challanDetails.othersRef && <tr><td className="py-1 font-semibold">Other Ref:</td><td className="py-1">{challanDetails.othersRef}</td></tr>}
                {challanDetails.buyersOrderNo && <tr><td className="py-1 font-semibold">Buyer's Order No:</td><td className="py-1">{challanDetails.buyersOrderNo}</td></tr>}
                {challanDetails.buyersOrderDate && <tr><td className="py-1 font-semibold">Order Date:</td><td className="py-1">{challanDetails.buyersOrderDate}</td></tr>}
                {challanDetails.dispatchDocNo && <tr><td className="py-1 font-semibold">Dispatch Doc No:</td><td className="py-1">{challanDetails.dispatchDocNo}</td></tr>}
                {challanDetails.dispatchThrough && <tr><td className="py-1 font-semibold">Dispatch Through:</td><td className="py-1">{challanDetails.dispatchThrough}</td></tr>}
                {challanDetails.destination && <tr><td className="py-1 font-semibold">Destination:</td><td className="py-1">{challanDetails.destination}</td></tr>}
                {challanDetails.vehicle && <tr><td className="py-1 font-semibold">Vehicle:</td><td className="py-1">{challanDetails.vehicle}</td></tr>}
                {challanDetails.driverName && <tr><td className="py-1 font-semibold">Driver Name:</td><td className="py-1">{challanDetails.driverName}</td></tr>}
                {challanDetails.driverContact && <tr><td className="py-1 font-semibold">Driver Contact:</td><td className="py-1">{challanDetails.driverContact}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left border-collapse border border-gray-400 mb-6">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-400">
              <th className="py-2 px-3 border-r border-gray-400 font-bold">Sr. No.</th>
              <th className="py-2 px-3 border-r border-gray-400 font-bold">Equipments</th>
              <th className="py-2 px-3 border-r border-gray-400 font-bold text-center">Quantity</th>
              <th className="py-2 px-3 border-r border-gray-400 font-bold text-right">Rate (Rs.)</th>
              <th className="py-2 px-3 font-bold text-right">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {groupedMachines.map((m, i) => (
              <tr key={i} className="border-b border-gray-300">
                <td className="py-2 px-3 border-r border-gray-300 text-center">{i + 1}</td>
                <td className="py-2 px-3 border-r border-gray-300">{m.machineTypeId?.name || '-'}</td>
                <td className="py-2 px-3 border-r border-gray-300 text-center">{m.quantity}</td>
                <td className="py-2 px-3 border-r border-gray-300 text-right">{Number(m.purchaseCost || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-right">{Number(m.totalCost || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <table className="w-1/2 text-left border-collapse">
            <tbody>
              <tr>
                <td className="py-1 font-bold">Total Quantity:</td>
                <td className="py-1 text-right">{totalQty}</td>
              </tr>
              <tr>
                <td className="py-1 font-bold">Total Amount:</td>
                <td className="py-1 text-right">{totalAmt.toFixed(2)}</td>
              </tr>
              
              {gstType === 'igst' ? (
                <tr>
                  <td className="py-1 font-bold border-b border-gray-300 pb-2">IGST ({Number(challanDetails.gstRate || 18)}%):</td>
                  <td className="py-1 text-right border-b border-gray-300 pb-2">{igst.toFixed(2)}</td>
                </tr>
              ) : gstType === 'cgst_sgst' ? (
                <>
                  <tr>
                    <td className="py-1 font-bold">CGST ({Number(challanDetails.gstRate || 18) / 2}%):</td>
                    <td className="py-1 text-right">{cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold border-b border-gray-300 pb-2">SGST ({Number(challanDetails.gstRate || 18) / 2}%):</td>
                    <td className="py-1 text-right border-b border-gray-300 pb-2">{sgst.toFixed(2)}</td>
                  </tr>
                </>
              ) : null}
              
              <tr>
                <td className="py-3 font-bold text-lg">Net Amount:</td>
                <td className="py-3 text-right font-bold text-lg">{netAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
});

DeliveryChallan.displayName = 'DeliveryChallan';
export default DeliveryChallan;
