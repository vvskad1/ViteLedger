import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2: Personal Info
    date_of_birth: '',
    gender: '',
    nationality: '',
    state_region: '',
    // Step 3: Physical Metrics
    height: '',
    weight: '',
    blood_type: '',
    // Step 4: Lifestyle & Diet
    activity_level: '',
    occupation_type: '',
    diet_type: '',
    food_allergies: '',
    dietary_restrictions: '',
    food_preferences: '',
    // Step 5: Medical Background
    pre_existing_conditions: '',
    current_medications: '',
    health_goals: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // State/Region options based on nationality
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Reset state_region when nationality changes
    if (name === 'nationality') {
      setFormData({ ...formData, nationality: value, state_region: '' });
    }
    
    setErrors({ ...errors, [name]: '' });
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (currentStep === 2) {
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.nationality) newErrors.nationality = 'Nationality is required';
      if (!formData.state_region) newErrors.state_region = 'State/Region is required';
    }
    
    if (currentStep === 3) {
      if (!formData.height) newErrors.height = 'Height is required';
      if (!formData.weight) newErrors.weight = 'Weight is required';
    }
    
    return newErrors;
  };

  const nextStep = () => {
    const newErrors = validateStep(step);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only allow submission on Step 6 (Review step)
    if (step !== 6) {
      return;
    }
    
    setLoading(true);
    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
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

      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Registration error:', data);
        throw new Error(data.detail || 'Registration failed');
      }

      const data = await response.json();

      // Auto login after registration
      const loginResponse = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const loginData = await loginResponse.json();
      if (loginResponse.ok) {
        localStorage.setItem('token', loginData.access_token);
        localStorage.setItem('user', JSON.stringify(data));
        navigate('/dashboard');
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`}>
          {step > s ? <Check size={16} /> : s}
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2>Account Information</h2>
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="john@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="••••••••"
              required
            />
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2>Personal Information</h2>
            <Input
              label="Date of Birth"
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              error={errors.date_of_birth}
              required
            />
            <div className="form-group">
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>
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
                <option value="India">India</option>
                <option value="USA">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="China">China</option>
                <option value="Japan">Japan</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
                <option value="Brazil">Brazil</option>
                <option value="Mexico">Mexico</option>
                <option value="Italy">Italy</option>
                <option value="Spain">Spain</option>
                <option value="South Korea">South Korea</option>
                <option value="Thailand">Thailand</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Philippines">Philippines</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Bangladesh">Bangladesh</option>
                <option value="Other">Other</option>
              </select>
              {errors.nationality && <span className="error-text">{errors.nationality}</span>}
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
                <option value="">
                  {formData.nationality ? 'Select State/Region' : 'Select Nationality First'}
                </option>
                {formData.nationality && stateOptions[formData.nationality]?.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state_region && <span className="error-text">{errors.state_region}</span>}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2>Physical Metrics</h2>
            <Input
              label="Height (cm)"
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              error={errors.height}
              placeholder="170"
              required
            />
            <Input
              label="Weight (kg)"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              error={errors.weight}
              placeholder="70"
              required
            />
            <div className="form-group">
              <label>Blood Type (Optional)</label>
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
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2>Lifestyle & Diet</h2>
            <div className="form-group">
              <label>Activity Level</label>
              <select
                name="activity_level"
                value={formData.activity_level}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Activity Level</option>
                <option value="Sedentary">Sedentary (Little to no exercise)</option>
                <option value="Light">Light (1-3 days/week)</option>
                <option value="Moderate">Moderate (3-5 days/week)</option>
                <option value="Active">Active (6-7 days/week)</option>
                <option value="Very Active">Very Active (Intense daily)</option>
              </select>
            </div>
            <Input
              label="Occupation Type (Optional)"
              type="text"
              name="occupation_type"
              value={formData.occupation_type}
              onChange={handleChange}
              placeholder="e.g., Desk job, Physical labor"
            />
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
              </select>
            </div>
            <Input
              label="Food Allergies (Optional)"
              type="text"
              name="food_allergies"
              value={formData.food_allergies}
              onChange={handleChange}
              placeholder="e.g., Nuts, Dairy, Gluten (comma-separated)"
            />
            <Input
              label="Dietary Restrictions (Optional)"
              type="text"
              name="dietary_restrictions"
              value={formData.dietary_restrictions}
              onChange={handleChange}
              placeholder="e.g., Halal, Kosher, No Beef"
            />
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2>Medical Background</h2>
            <Input
              label="Pre-existing Conditions (Optional)"
              type="text"
              name="pre_existing_conditions"
              value={formData.pre_existing_conditions}
              onChange={handleChange}
              placeholder="e.g., Diabetes, Hypertension (comma-separated)"
            />
            <Input
              label="Current Medications (Optional)"
              type="text"
              name="current_medications"
              value={formData.current_medications}
              onChange={handleChange}
              placeholder="e.g., Metformin, Lisinopril (comma-separated)"
            />
            <Input
              label="Health Goals (Optional)"
              type="text"
              name="health_goals"
              value={formData.health_goals}
              onChange={handleChange}
              placeholder="e.g., Weight loss, Muscle gain, Disease management"
            />
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="review-step"
          >
            <h2>Review Your Information</h2>
            <p className="review-subtitle">Please review all your information before submitting. Click "Edit" to make changes.</p>
            
            <div className="review-section">
              <div className="review-section-header">
                <h3>Account Information</h3>
                <button type="button" className="edit-button" onClick={() => setStep(1)}>Edit</button>
              </div>
              <div className="review-content">
                <div className="review-item"><strong>Name:</strong> {formData.name}</div>
                <div className="review-item"><strong>Email:</strong> {formData.email}</div>
              </div>
            </div>

            <div className="review-section">
              <div className="review-section-header">
                <h3>Personal Information</h3>
                <button type="button" className="edit-button" onClick={() => setStep(2)}>Edit</button>
              </div>
              <div className="review-content">
                <div className="review-item"><strong>Date of Birth:</strong> {formData.date_of_birth || 'Not provided'}</div>
                <div className="review-item"><strong>Gender:</strong> {formData.gender || 'Not provided'}</div>
                <div className="review-item"><strong>Nationality:</strong> {formData.nationality || 'Not provided'}</div>
                <div className="review-item"><strong>State/Region:</strong> {formData.state_region || 'Not provided'}</div>
              </div>
            </div>

            <div className="review-section">
              <div className="review-section-header">
                <h3>Physical Metrics</h3>
                <button type="button" className="edit-button" onClick={() => setStep(3)}>Edit</button>
              </div>
              <div className="review-content">
                <div className="review-item"><strong>Height:</strong> {formData.height ? `${formData.height} cm` : 'Not provided'}</div>
                <div className="review-item"><strong>Weight:</strong> {formData.weight ? `${formData.weight} kg` : 'Not provided'}</div>
                <div className="review-item"><strong>Blood Type:</strong> {formData.blood_type || 'Not provided'}</div>
              </div>
            </div>

            <div className="review-section">
              <div className="review-section-header">
                <h3>Lifestyle & Diet</h3>
                <button type="button" className="edit-button" onClick={() => setStep(4)}>Edit</button>
              </div>
              <div className="review-content">
                <div className="review-item"><strong>Activity Level:</strong> {formData.activity_level || 'Not provided'}</div>
                <div className="review-item"><strong>Occupation Type:</strong> {formData.occupation_type || 'Not provided'}</div>
                <div className="review-item"><strong>Diet Type:</strong> {formData.diet_type || 'Not provided'}</div>
                <div className="review-item"><strong>Food Allergies:</strong> {formData.food_allergies || 'None'}</div>
                <div className="review-item"><strong>Dietary Restrictions:</strong> {formData.dietary_restrictions || 'None'}</div>
                <div className="review-item"><strong>Food Preferences:</strong> {formData.food_preferences || 'Not provided'}</div>
              </div>
            </div>

            <div className="review-section">
              <div className="review-section-header">
                <h3>Medical Background</h3>
                <button type="button" className="edit-button" onClick={() => setStep(5)}>Edit</button>
              </div>
              <div className="review-content">
                <div className="review-item"><strong>Pre-existing Conditions:</strong> {formData.pre_existing_conditions || 'None'}</div>
                <div className="review-item"><strong>Current Medications:</strong> {formData.current_medications || 'None'}</div>
                <div className="review-item"><strong>Health Goals:</strong> {formData.health_goals || 'Not provided'}</div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="auth-card registration-card">
          <div className="auth-header">
            <UserPlus className="auth-icon" size={48} />
            <h1>Create Account</h1>
            <p>Step {step} of 6</p>
          </div>

          {renderStepIndicator()}

          <form onSubmit={handleSubmit} className="auth-form">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {errors.submit && (
              <div className="auth-error">{errors.submit}</div>
            )}

            <div className="form-navigation">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep}>
                  <ArrowLeft size={20} />
                  Back
                </Button>
              )}
              
              {step < 6 ? (
                <Button type="button" onClick={nextStep}>
                  {step === 5 ? 'Review' : 'Next'}
                  <ArrowRight size={20} />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Confirm & Complete Registration'}
                </Button>
              )}
            </div>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
