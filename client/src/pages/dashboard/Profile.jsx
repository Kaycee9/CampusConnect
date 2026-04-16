import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../lib/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { Camera, User as UserIcon, MapPin, Navigation, Phone, Briefcase, FileText, DollarSign } from 'lucide-react';
import './Profile.css';

const CATEGORIES = [
  'PLUMBING', 'ELECTRICAL', 'PAINTING', 'CARPENTRY', 'CLEANING',
  'TAILORING', 'BARBING', 'WELDING', 'MECHANICS', 'TECH_REPAIR', 'OTHER',
];

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  
  const profileData = user.role === 'ARTISAN' ? user.artisanProfile : user.studentProfile;

  const [form, setForm] = useState({
    firstName: profileData?.firstName || '',
    lastName: profileData?.lastName || '',
    phone: profileData?.phone || '',
    address: profileData?.address || '',
    lat: profileData?.lat ?? '',
    lng: profileData?.lng ?? '',
    bio: profileData?.bio || '',
    category: profileData?.category || '',
    startingPrice: profileData?.startingPrice || '',
    yearsExp: profileData?.yearsExp || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(profileData?.avatarUrl || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const uploadAvatar = async (file) => {
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile picture updated');
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to upload profile image';
      setAvatarPreview(profileData?.avatarUrl || null);
      toast.error(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        e.target.value = '';
        return;
      }

      setAvatarPreview(URL.createObjectURL(file));
      await uploadAvatar(file);
      e.target.value = '';
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        }));
        setLocationLoading(false);
        toast.success('GPS coordinates updated');
      },
      () => {
        setLocationLoading(false);
        toast.error('Could not access your location');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        const value = form[key];
        if (value !== '' && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile updated successfully');
      
      // Force reload to pick up the new user state from AuthContext
      setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Manage your personal information and settings</p>
        </div>
      </div>

      <div className="profile-content">
        <form onSubmit={handleSubmit} className="profile-form card">
          
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current.click()}>
              <Avatar 
                src={avatarPreview} 
                name={`${profileData?.firstName || ''} ${profileData?.lastName || ''}`} 
                size="xl" 
              />
              <div className="profile-avatar-overlay">
                <Camera size={24} />
              </div>
            </div>
            <div className="profile-avatar-info">
              <h3>Profile Photo</h3>
              <p>Click the image to upload a new photo. Max size 5MB (JPEG, PNG, WEBP).</p>
              {avatarUploading && <p>Uploading photo...</p>}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden-input" 
              />
            </div>
          </div>

          <hr className="profile-divider" />

          {/* Basic Info */}
          <h3 className="profile-section-title">Personal Information</h3>
          <div className="profile-grid">
            <Input
              label="First Name"
              name="firstName"
              icon={UserIcon}
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
            <Input
              label="Phone Number"
              name="phone"
              icon={Phone}
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. +234800000000"
            />
            <Input
              label="Primary Address"
              name="address"
              icon={MapPin}
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Hall of Residence"
            />
          </div>

          <div className="profile-location-row">
            <Button
              type="button"
              variant="ghost"
              onClick={handleUseCurrentLocation}
              loading={locationLoading}
              icon={Navigation}
            >
              Update GPS from current location
            </Button>
          </div>

          {/* Artisan Specific Details */}
          {user.role === 'ARTISAN' && (
            <>
              <hr className="profile-divider" />
              <h3 className="profile-section-title">Professional Details</h3>
              
              <div className="profile-grid">
                <div className="input-group">
                  <label className="input-group__label">Service Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="input-group__input"
                  >
                    <option value="">Select a category...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Years of Experience"
                  name="yearsExp"
                  type="number"
                  icon={Briefcase}
                  value={form.yearsExp}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <Input
                  label="Starting Price (₦)"
                  name="startingPrice"
                  type="number"
                  icon={DollarSign}
                  value={form.startingPrice}
                  onChange={handleChange}
                  hint="Minimum call-out fee or baseline price"
                />
              </div>

              <div className="mb-4">
                <Input
                  label="Professional Bio"
                  name="bio"
                  textarea
                  rows={4}
                  icon={FileText}
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell students about your expertise, reliability, and past work..."
                />
              </div>
            </>
          )}

          <div className="profile-actions">
            <Button type="button" variant="ghost" onClick={() => window.location.reload()}>
              Discard Changes
            </Button>
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
