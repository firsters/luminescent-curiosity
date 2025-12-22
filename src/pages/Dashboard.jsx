import { useInventory } from '../context/InventoryContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { items, loading } = useInventory();

  if (loading) return <div>Loading...</div>;

  const today = new Date();
  const expiringSoon = items.filter(item => {
    if (!item.expiryDate) return false;
    const diffTime = item.expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 3 && diffDays >= 0; // Expiring in 3 days
  });

  const expired = items.filter(item => {
    if (!item.expiryDate) return false;
    return item.expiryDate < today;
  });

  const getPercentage = (category) => {
      const total = items.length;
      if (total === 0) return 0;
      const count = items.filter(i => i.category === category).length;
      return (count / total) * 100;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#e3f2fd' }}>
           <h3 style={{ fontSize: '2rem', color: '#1565c0' }}>{items.length}</h3>
           <p>Total Items</p>
        </div>
        <div className="card" style={{ textAlign: 'center', backgroundColor: expiringSoon.length > 0 ? '#fff3e0' : '#e8f5e9' }}>
           <h3 style={{ fontSize: '2rem', color: expiringSoon.length > 0 ? '#ef6c00' : '#2e7d32' }}>{expiringSoon.length}</h3>
           <p>Expiring Soon</p>
        </div>
      </div>

      {expired.length > 0 && (
         <div className="card" style={{ borderLeft: '5px solid var(--danger)', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--danger)' }}>⚠️ {expired.length} Expired Items</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Check your fridge and toss them out.</p>
         </div>
      )}

      <h3>Storage Overview</h3>
      <div className="card">
        {['fridge', 'freezer', 'pantry'].map(cat => (
             <div key={cat} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                    <span>{items.filter(i => i.category === cat).length} items</span>
                </div>
                <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${getPercentage(cat)}%`, 
                        height: '100%', 
                        background: cat === 'fridge' ? '#4CAF50' : cat === 'freezer' ? '#2196F3' : '#FF9800' 
                    }} />
                </div>
             </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
          <Link to="/add" className="btn">Add New Item</Link>
      </div>
    </div>
  );
}
