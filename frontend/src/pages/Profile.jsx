import { formatINR, formatDate } from '../utils/locale';
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import './accounting/Accounting.css'; // Reusing some base styles
import LoadingBackdrop from '../components/Shared/LoadingBackdrop';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        setProfile(response.data);
      } catch (err) {
        setError('Failed to load profile data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (error) return <div className="accounting-section"><div className="error-message">{error}</div></div>;

  return (
    <>
      <LoadingBackdrop open={loading} />
      {!profile ? null : <ProfileContent profile={profile} />}
    </>
  );
}

function ProfileContent({ profile }) {
  return (
    <div className="accounting-section">
      <div className="section-header">
        <h2>User Profile</h2>
      </div>

      <div className="form-card" style={{ maxWidth: '600px', display: 'block' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: '#e5e7eb', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '40px',
            margin: '0 auto 10px'
          }}>
            👤
          </div>
          <h3>{profile.firstname} {profile.lastname}</h3>
          <span className="badge badge-info">{profile.role}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', padding: '0 20px' }}>
          <div style={{ fontWeight: '600', color: '#6b7280' }}>Email Address:</div>
          <div>{profile.email}</div>

          <div style={{ fontWeight: '600', color: '#6b7280' }}>User ID:</div>
          <div style={{ fontFamily: 'monospace' }}>#{profile.userid}</div>

          <div style={{ fontWeight: '600', color: '#6b7280' }}>Account Status:</div>
          <div><span style={{ color: '#10b981', fontWeight: '600' }}>● Active</span></div>

          <div style={{ fontWeight: '600', color: '#6b7280' }}>Member Since:</div>
          <div>{formatDate(profile.createddate)}</div>
        </div>

        <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '20px', textAlign: 'center' }}>
          <button className="btn btn-secondary" onClick={() => window.history.back()}>Go Back</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
