import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import './SupplyChain.css';
import LoadingBackdrop from '../components/Shared/LoadingBackdrop';

export default function SupplyChain() {
  const [activeTab, setActiveTab] = useState('requisitions');
  const [requisitions, setRequisitions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [goodsReceipt, setGoodsReceipt] = useState([]);
  const [vendorPerf, setVendorPerf] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newRequisition, setNewRequisition] = useState({
    department: '',
    requestedDate: new Date().toISOString().split('T')[0],
    requiredDate: '',
    items: []
  });

  const [newVendor, setNewVendor] = useState({
    vendorCode: '',
    vendorName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    paymentTerms: '',
    rating: 'Medium'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'requisitions') {
        const res = await apiClient.get('/supply-chain/requisitions');
        setRequisitions(res.data);
      } else if (activeTab === 'vendors') {
        const res = await apiClient.get('/supply-chain/vendors');
        setVendors(res.data);
      } else if (activeTab === 'goods-receipt') {
        const res = await apiClient.get('/supply-chain/goods-receipt');
        setGoodsReceipt(res.data);
      } else if (activeTab === 'performance') {
        const res = await apiClient.get('/supply-chain/vendors/performance');
        setVendorPerf(res.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddRequisition = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/supply-chain/requisitions', newRequisition);
      setSuccessMessage('Requisition created');
      setNewRequisition({
        department: '',
        requestedDate: new Date().toISOString().split('T')[0],
        requiredDate: '',
        items: []
      });
      loadData();
    } catch (err) {
      setError('Failed to create requisition');
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/supply-chain/vendors', newVendor);
      setSuccessMessage('Vendor registered');
      setNewVendor({
        vendorCode: '',
        vendorName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        paymentTerms: '',
        rating: 'Medium'
      });
      loadData();
    } catch (err) {
      setError('Failed to register vendor');
    }
  };

  return (
    <div className="module-container">
      <h1>🚚 Supply Chain</h1>
      
      <div className="module-nav">
        <button 
          className={`module-nav-item ${activeTab === 'requisitions' ? 'active' : ''}`}
          onClick={() => setActiveTab('requisitions')}
        >
          📝 Requisitions
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'vendors' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendors')}
        >
          🏭 Vendors
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'goods-receipt' ? 'active' : ''}`}
          onClick={() => setActiveTab('goods-receipt')}
        >
          📦 GR/GI
        </button>
        <button 
          className={`module-nav-item ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          📊 Performance
        </button>
      </div>

      <div className="module-content">
        <LoadingBackdrop open={loading} />
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {activeTab === 'requisitions' && (
          <div>
            <h2>Purchase Requisitions</h2>
            <div className="form-card">
              <h3>Create Requisition</h3>
              <form onSubmit={handleAddRequisition}>
                <div className="form-row">
                  <input type="text" placeholder="Department" value={newRequisition.department} 
                    onChange={(e) => setNewRequisition({...newRequisition, department: e.target.value})} required />
                  <input type="date" value={newRequisition.requestedDate} 
                    onChange={(e) => setNewRequisition({...newRequisition, requestedDate: e.target.value})} />
                  <input type="date" placeholder="Required Date" value={newRequisition.requiredDate} 
                    onChange={(e) => setNewRequisition({...newRequisition, requiredDate: e.target.value})} required />
                </div>
                <button type="submit" className="btn-primary">Create Requisition</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Req Number</th>
                    <th>Department</th>
                    <th>Requested</th>
                    <th>Required</th>
                    <th>Status</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.map(req => (
                    <tr key={req.RequisitionID}>
                      <td>{req.RequisitionNumber}</td>
                      <td>{req.Department}</td>
                      <td>{new Date(req.RequestedDate).toLocaleDateString()}</td>
                      <td>{new Date(req.RequiredDate).toLocaleDateString()}</td>
                      <td><span className="badge">{req.Status}</span></td>
                      <td className="amount">${req.TotalAmount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div>
            <h2>Vendors</h2>
            <div className="form-card">
              <h3>Register Vendor</h3>
              <form onSubmit={handleAddVendor}>
                <div className="form-row">
                  <input type="text" placeholder="Vendor Code" value={newVendor.vendorCode} 
                    onChange={(e) => setNewVendor({...newVendor, vendorCode: e.target.value})} required />
                  <input type="text" placeholder="Vendor Name" value={newVendor.vendorName} 
                    onChange={(e) => setNewVendor({...newVendor, vendorName: e.target.value})} required />
                  <input type="email" placeholder="Email" value={newVendor.email} 
                    onChange={(e) => setNewVendor({...newVendor, email: e.target.value})} />
                </div>
                <div className="form-row">
                  <input type="phone" placeholder="Phone" value={newVendor.phone} 
                    onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})} />
                  <input type="text" placeholder="Address" value={newVendor.address} 
                    onChange={(e) => setNewVendor({...newVendor, address: e.target.value})} />
                  <input type="text" placeholder="City" value={newVendor.city} 
                    onChange={(e) => setNewVendor({...newVendor, city: e.target.value})} />
                </div>
                <div className="form-row">
                  <input type="text" placeholder="Country" value={newVendor.country} 
                    onChange={(e) => setNewVendor({...newVendor, country: e.target.value})} />
                  <input type="text" placeholder="Payment Terms" value={newVendor.paymentTerms} 
                    onChange={(e) => setNewVendor({...newVendor, paymentTerms: e.target.value})} />
                  <select value={newVendor.rating} onChange={(e) => setNewVendor({...newVendor, rating: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">Register Vendor</button>
              </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Terms</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(vendor => (
                    <tr key={vendor.VendorID}>
                      <td>{vendor.VendorCode}</td>
                      <td>{vendor.VendorName}</td>
                      <td>{vendor.Email}</td>
                      <td>{vendor.City}</td>
                      <td>{vendor.PaymentTerms}</td>
                      <td><span className="badge">{vendor.Rating}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'goods-receipt' && (
          <div>
            <h2>Goods Receipt</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Vendor</th>
                    <th>PO ID</th>
                    <th>Receipt Date</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {goodsReceipt.map(gr => (
                    <tr key={gr.ReceiptID}>
                      <td>{gr.ReceiptNumber}</td>
                      <td>{gr.VendorName}</td>
                      <td>{gr.PurchaseOrderID}</td>
                      <td>{new Date(gr.ReceiptDate).toLocaleDateString()}</td>
                      <td>{gr.TotalQuantity}</td>
                      <td><span className="badge">{gr.Status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <h2>Vendor Performance</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Total POs</th>
                    <th>On-time %</th>
                    <th>Avg Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorPerf.map(perf => (
                    <tr key={perf.VendorID}>
                      <td>{perf.VendorName}</td>
                      <td>{perf.TotalPOs}</td>
                      <td>{perf.OnTimePercentage?.toFixed(1)}%</td>
                      <td>{perf.AvgQuality?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
