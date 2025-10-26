import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Save, X } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import './Auth.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date_of_birth: '',
    gender: '',
    nationality: '',
    state_region: '',
    height: '',
    weight: '',
    blood_type: '',
    activity_level: '',
    occupation_type: '',
    diet_type: '',
    food_allergies: '',
    dietary_restrictions: '',
    food_preferences: '',
    pre_existing_conditions: '',
    current_medications: '',
    health_goals: ''
  });

  const stateOptions = {
    'India': ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'],
    'USA': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
    'UK': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    'China': ['Beijing', 'Shanghai', 'Tianjin', 'Chongqing', 'Guangdong', 'Jiangsu', 'Shandong', 'Zhejiang', 'Henan', 'Sichuan', 'Hubei', 'Hunan', 'Hebei', 'Fujian', 'Anhui', 'Liaoning', 'Shaanxi', 'Jiangxi', 'Guangxi', 'Yunnan', 'Heilongjiang', 'Jilin', 'Shanxi', 'Guizhou', 'Gansu', 'Inner Mongolia', 'Xinjiang', 'Hainan', 'Ningxia', 'Qinghai', 'Tibet'],
    'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Fukuoka', 'Kanagawa', 'Aichi', 'Hyogo', 'Saitama', 'Chiba'],
    'Germany': ['Bavaria', 'Berlin', 'Hamburg', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Hesse', 'Saxony', 'Lower Saxony', 'Rhineland-Palatinate', 'Schleswig-Holstein'],
    'France': ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Hauts-de-France', 'Brittany', 'Normandy', 'Grand Est', 'Pays de la Loire'],
    'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'],
    'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador', 'Prince Edward Island'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Pará', 'Santa Catarina'],
    'Mexico': ['Mexico City', 'Jalisco', 'Nuevo León', 'Puebla', 'Guanajuato', 'Veracruz', 'Chiapas', 'Oaxaca', 'Michoacán', 'Baja California'],
    'Italy': ['Lazio', 'Lombardy', 'Campania', 'Sicily', 'Veneto', 'Piedmont', 'Emilia-Romagna', 'Tuscany', 'Apulia', 'Calabria'],
    'Spain': ['Madrid', 'Catalonia', 'Andalusia', 'Valencia', 'Galicia', 'Castile and León', 'Basque Country', 'Canary Islands', 'Castilla-La Mancha', 'Murcia'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Gyeonggi', 'Gangwon', 'Jeju'],
    'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Nakhon Ratchasima', 'Khon Kaen', 'Udon Thani', 'Surat Thani', 'Songkhla', 'Chonburi', 'Nakhon Si Thammarat'],
    'Vietnam': ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho', 'Bien Hoa', 'Hue', 'Nha Trang', 'Vung Tau', 'Buon Ma Thuot'],
    'Philippines': ['Metro Manila', 'Cebu', 'Davao', 'Quezon City', 'Makati', 'Pasig', 'Cagayan de Oro', 'Iloilo', 'Zamboanga', 'Baguio'],
    'Pakistan': ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Kashmir'],
    'Bangladesh': ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Barisal', 'Rangpur', 'Mymensingh'],
    'Other': ['Not Specified']
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setFormData({
        name: data.name || '',
        email: data.email || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        nationality: data.nationality || '',
        state_region: data.state_region || '',
        height: data.height || '',
        weight: data.weight || '',
        blood_type: data.blood_type || '',
        activity_level: data.activity_level || '',
        occupation_type: data.occupation_type || '',
        diet_type: data.diet_type || '',
        food_allergies: data.food_allergies || '',
        dietary_restrictions: data.dietary_restrictions || '',
        food_preferences: data.food_preferences || '',
        pre_existing_conditions: data.pre_existing_conditions || '',
        current_medications: data.current_medications || '',
        health_goals: data.health_goals || ''
      });
    } catch (error) {
      setErrors({ fetch: 'Failed to load profile' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'nationality') {
      setFormData({ ...formData, nationality: value, state_region: '' });
    }
    
    setErrors({ ...errors, [name]: '' });
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: formData.name,
        email: formData.email,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        nationality: formData.nationality || null,
        state_region: formData.state_region || null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        blood_type: formData.blood_type || null,
        activity_level: formData.activity_level || null,
        occupation_type: formData.occupation_type || null,
        diet_type: formData.diet_type || null,
        food_allergies: formData.food_allergies || null,
        dietary_restrictions: formData.dietary_restrictions || null,
        food_preferences: formData.food_preferences || null,
        pre_existing_conditions: formData.pre_existing_conditions || null,
        current_medications: formData.current_medications || null,
        health_goals: formData.health_goals || null
      };

      const response = await fetch('http://localhost:8000/auth/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to update profile');
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data));
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="edit-profile-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="edit-profile-card">
            <div className="auth-header">
              <User className="auth-icon" size={48} />
              <h1>Edit Profile</h1>
              <p>Update your personal information</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form edit-profile-form">
              <div className="profile-section">
                <h3>Account Information</h3>
                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled
                />
              </div>

              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <Input
                    label="Date of Birth"
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nationality *</label>
                    <select
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select Nationality</option>
                      {Object.keys(stateOptions).map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>State/Region *</label>
                    <select
                      name="state_region"
                      value={formData.state_region}
                      onChange={handleChange}
                      className="form-select"
                      required
                      disabled={!formData.nationality}
                    >
                      <option value="">Select State/Region</option>
                      {formData.nationality && stateOptions[formData.nationality]?.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h3>Physical Metrics</h3>
                <div className="form-row">
                  <Input
                    label="Height (cm)"
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="170"
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="70"
                  />
                </div>
                <div className="form-group">
                  <label>Blood Type</label>
                  <select
                    name="blood_type"
                    value={formData.blood_type}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="profile-section">
                <h3>Lifestyle & Diet</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Activity Level</label>
                    <select
                      name="activity_level"
                      value={formData.activity_level}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select Activity Level</option>
                      <option value="Sedentary">Sedentary (little or no exercise)</option>
                      <option value="Lightly Active">Lightly Active (1-3 days/week)</option>
                      <option value="Moderately Active">Moderately Active (3-5 days/week)</option>
                      <option value="Very Active">Very Active (6-7 days/week)</option>
                      <option value="Extremely Active">Extremely Active (athlete)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Occupation Type</label>
                    <select
                      name="occupation_type"
                      value={formData.occupation_type}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select Occupation</option>
                      <option value="Desk Job">Desk Job</option>
                      <option value="Physical Labor">Physical Labor</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Student">Student</option>
                      <option value="Retired">Retired</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Diet Type</label>
                  <select
                    name="diet_type"
                    value={formData.diet_type}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select Diet Type</option>
                    <option value="Omnivore">Omnivore</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Pescatarian">Pescatarian</option>
                    <option value="Keto">Keto</option>
                    <option value="Paleo">Paleo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Input
                  label="Food Allergies"
                  type="text"
                  name="food_allergies"
                  value={formData.food_allergies}
                  onChange={handleChange}
                  placeholder="e.g., Peanuts, Shellfish (comma-separated)"
                />
                <Input
                  label="Dietary Restrictions"
                  type="text"
                  name="dietary_restrictions"
                  value={formData.dietary_restrictions}
                  onChange={handleChange}
                  placeholder="e.g., No pork, Gluten-free (comma-separated)"
                />
                <Input
                  label="Food Preferences"
                  type="text"
                  name="food_preferences"
                  value={formData.food_preferences}
                  onChange={handleChange}
                  placeholder="e.g., Spicy food, Traditional cuisine"
                />
              </div>

              <div className="profile-section">
                <h3>Medical Background</h3>
                <Input
                  label="Pre-existing Conditions"
                  type="text"
                  name="pre_existing_conditions"
                  value={formData.pre_existing_conditions}
                  onChange={handleChange}
                  placeholder="e.g., Diabetes, Hypertension (comma-separated)"
                />
                <Input
                  label="Current Medications"
                  type="text"
                  name="current_medications"
                  value={formData.current_medications}
                  onChange={handleChange}
                  placeholder="e.g., Metformin, Lisinopril (comma-separated)"
                />
                <Input
                  label="Health Goals"
                  type="text"
                  name="health_goals"
                  value={formData.health_goals}
                  onChange={handleChange}
                  placeholder="e.g., Weight loss, Muscle gain, Disease management"
                />
              </div>

              {success && (
                <div className="auth-success">{success}</div>
              )}

              {errors.submit && (
                <div className="auth-error">{errors.submit}</div>
              )}

              <div className="form-navigation">
                <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
                  <X size={20} />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save size={20} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default EditProfile;
